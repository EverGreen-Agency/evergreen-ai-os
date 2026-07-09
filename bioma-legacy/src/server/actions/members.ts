"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { uuidSchema } from "@/lib/validation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/server/audit";
import { AuthzError, requirePermission } from "@/server/authz";
import type { ActionState } from "./orgs";

const createMemberSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(120),
  password: z.string().min(10).max(256),
  orgId: uuidSchema,
  roleKey: z.enum(["tenant_admin", "operator", "client_viewer", "super_admin"]),
});

/**
 * Cria usuário (auth admin API — único caminho possível) + membership.
 * Autorização: members.manage NA ORG ALVO (anti-IDOR: orgId do form é validado
 * por recurso). A membership é criada com o client do USUÁRIO (RLS confere).
 */
export async function createMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createMemberSchema.safeParse({
    email: formData.get("email"),
    displayName: formData.get("displayName"),
    password: formData.get("password"),
    orgId: formData.get("orgId"),
    roleKey: formData.get("roleKey"),
  });
  if (!parsed.success) return { error: "invalid_input" };
  const input = parsed.data;

  try {
    await requirePermission(input.orgId, "members.manage");
  } catch (e) {
    return { error: e instanceof AuthzError ? "forbidden" : "unknown" };
  }

  const supabase = await createSupabaseServerClient();

  // Papel é resolvido por chave no servidor (nunca role_id vindo do client).
  const { data: role } = await supabase
    .from("roles")
    .select("id")
    .eq("key", input.roleKey)
    .single();
  if (!role) return { error: "invalid_input" };

  const admin = createSupabaseAdminClient();
  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { display_name: input.displayName },
  });

  let userId: string;
  if (userError) {
    // Usuário pode já existir → vincular membership ao existente.
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("email", input.email)
      .maybeSingle();
    if (!existing) return { error: "user_create_failed" };
    userId = existing.id;
  } else {
    userId = created.user.id;
  }

  const { error: membershipError } = await supabase.from("memberships").insert({
    user_id: userId,
    org_id: input.orgId,
    role_id: role.id,
  });
  if (membershipError) return { error: "db_error" };

  await audit({
    tenantId: input.orgId,
    action: "member.created",
    resourceType: "membership",
    resourceId: userId,
    metadata: { role: input.roleKey }, // sem e-mail/nome (PII) — só ids/chaves
  });

  revalidatePath("/admin");
  return { ok: true };
}

const changeRoleSchema = z.object({
  membershipId: uuidSchema,
  orgId: uuidSchema,
  roleKey: z.enum(["tenant_admin", "operator", "client_viewer"]),
});

export async function changeMemberRoleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = changeRoleSchema.safeParse({
    membershipId: formData.get("membershipId"),
    orgId: formData.get("orgId"),
    roleKey: formData.get("roleKey"),
  });
  if (!parsed.success) return { error: "invalid_input" };
  const input = parsed.data;

  try {
    await requirePermission(input.orgId, "members.manage");
  } catch {
    return { error: "forbidden" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: role } = await supabase
    .from("roles")
    .select("id")
    .eq("key", input.roleKey)
    .single();
  if (!role) return { error: "invalid_input" };

  // RLS: o UPDATE também confere members.manage na org da membership — o
  // .eq("org_id") impede trocar papel de membership de OUTRA org via id (IDOR).
  const { data: updated, error } = await supabase
    .from("memberships")
    .update({ role_id: role.id })
    .eq("id", input.membershipId)
    .eq("org_id", input.orgId)
    .select("id")
    .single();
  if (error || !updated) return { error: "db_error" };

  await audit({
    tenantId: input.orgId,
    action: "member.role_changed",
    resourceType: "membership",
    resourceId: input.membershipId,
    metadata: { new_role: input.roleKey },
  });

  revalidatePath("/admin");
  return { ok: true };
}
