"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ACTIVE_ORG_COOKIE } from "@/server/active-org";
import { audit } from "@/server/audit";
import {
  AuthzError,
  requirePermission,
  requirePlatformSuperAdmin,
} from "@/server/authz";

export type ActionState = { error?: string; ok?: boolean };

const createOrgSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9][a-z0-9-]*$/),
  orgType: z.enum(["client", "partner_agency", "agency_client", "independent"]),
  parentOrgId: z.string().uuid(),
});

/** Cria org filha. RLS exige org.manage no PAI (CA2/CA4) — client do usuário. */
export async function createOrgAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createOrgSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    orgType: formData.get("orgType"),
    parentOrgId: formData.get("parentOrgId"),
  });
  if (!parsed.success) return { error: "invalid_input" };
  const input = parsed.data;

  try {
    await requirePermission(input.parentOrgId, "org.manage");
  } catch (e) {
    return { error: e instanceof AuthzError ? "forbidden" : "unknown" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name: input.name,
      slug: input.slug,
      org_type: input.orgType,
      parent_org_id: input.parentOrgId,
    })
    .select("id")
    .single();
  if (error) return { error: "db_error" };

  await audit({
    tenantId: data.id,
    action: "org.created",
    resourceType: "organization",
    resourceId: data.id,
    metadata: { org_type: input.orgType, parent_org_id: input.parentOrgId },
  });

  revalidatePath("/admin");
  return { ok: true };
}

const setStatusSchema = z.object({
  orgId: z.string().uuid(),
  status: z.enum(["active", "suspended"]),
});

/**
 * Suspensão/reativação (RF9/CA6) — SÓ super-admin de plataforma. Usa o client
 * admin porque a org suspensa fica fora do accessible_org_ids de usuários
 * comuns; a autorização explícita + audit compensam o bypass (regra admin.ts).
 */
export async function setOrgStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = setStatusSchema.safeParse({
    orgId: formData.get("orgId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: "invalid_input" };

  try {
    await requirePlatformSuperAdmin();
  } catch {
    return { error: "forbidden" };
  }

  const admin = createSupabaseAdminClient();
  const { data: org, error } = await admin
    .from("organizations")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.orgId)
    .neq("org_type", "platform") // nunca suspender a própria EG
    .select("id")
    .single();
  if (error || !org) return { error: "db_error" };

  await audit({
    tenantId: parsed.data.orgId,
    action:
      parsed.data.status === "suspended" ? "org.suspended" : "org.reactivated",
    resourceType: "organization",
    resourceId: parsed.data.orgId,
  });

  revalidatePath("/admin");
  return { ok: true };
}

const switchOrgSchema = z.object({ orgId: z.string().uuid() });

/** Troca o tenant ativo. O valor é validado de novo no getActiveOrg (RLS). */
export async function switchOrgAction(formData: FormData): Promise<void> {
  const parsed = switchOrgSchema.safeParse({ orgId: formData.get("orgId") });
  if (!parsed.success) return;
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, parsed.data.orgId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  revalidatePath("/");
}
