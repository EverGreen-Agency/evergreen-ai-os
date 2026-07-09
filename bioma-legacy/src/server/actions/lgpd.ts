"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { uuidSchema } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { audit } from "@/server/audit";
import { AuthzError, requirePermission, requireUser } from "@/server/authz";
import type { ActionState } from "./orgs";

const DATA_CLASSES = [
  "public",
  "internal",
  "client",
  "pii",
  "secret",
  "financial",
  "legal",
  "restricted_ai",
] as const;

const LEGAL_BASES = [
  "consentimento",
  "legitimo_interesse",
  "execucao_contrato",
  "obrigacao_legal",
] as const;

const createPurposeSchema = z.object({
  tenantId: uuidSchema,
  purpose: z.string().min(5).max(500),
  legalBasis: z.enum(LEGAL_BASES),
  dataClasses: z.array(z.enum(DATA_CLASSES)).min(1),
  externalAiAllowed: z.boolean(),
});

/** Registra finalidade de tratamento (RF2). */
export async function createPurposeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createPurposeSchema.safeParse({
    tenantId: formData.get("tenantId"),
    purpose: formData.get("purpose"),
    legalBasis: formData.get("legalBasis"),
    dataClasses: formData.getAll("dataClasses"),
    externalAiAllowed: formData.get("externalAiAllowed") === "on",
  });
  if (!parsed.success) return { error: "invalid_input" };
  const input = parsed.data;

  const user = await requireUser();
  try {
    await requirePermission(input.tenantId, "lgpd.manage");
  } catch (e) {
    return { error: e instanceof AuthzError ? "forbidden" : "unknown" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("processing_purposes")
    .insert({
      tenant_id: input.tenantId,
      purpose: input.purpose,
      legal_basis: input.legalBasis,
      data_classes: input.dataClasses,
      external_ai_allowed: input.externalAiAllowed,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: "db_error" };

  await audit({
    tenantId: input.tenantId,
    action: "lgpd.purpose_created",
    resourceType: "processing_purpose",
    resourceId: data.id,
    metadata: {
      legal_basis: input.legalBasis,
      external_ai_allowed: input.externalAiAllowed,
    },
  });

  revalidatePath("/viveiro/governanca");
  return { ok: true };
}

const consentSchema = z.object({
  tenantId: uuidSchema,
  purposeId: uuidSchema,
  subjectLabel: z.string().min(2).max(120),
});

/** Registra consentimento (RF4). subject_label é pseudônimo — nunca PII. */
export async function grantConsentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = consentSchema.safeParse({
    tenantId: formData.get("tenantId"),
    purposeId: formData.get("purposeId"),
    subjectLabel: formData.get("subjectLabel"),
  });
  if (!parsed.success) return { error: "invalid_input" };
  const input = parsed.data;

  const user = await requireUser();
  try {
    await requirePermission(input.tenantId, "lgpd.manage");
  } catch (e) {
    return { error: e instanceof AuthzError ? "forbidden" : "unknown" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("consents")
    .insert({
      tenant_id: input.tenantId,
      purpose_id: input.purposeId,
      subject_label: input.subjectLabel,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: "db_error" };

  await audit({
    tenantId: input.tenantId,
    action: "lgpd.consent_granted",
    resourceType: "consent",
    resourceId: data.id,
    metadata: { purpose_id: input.purposeId },
  });

  revalidatePath("/viveiro/governanca");
  return { ok: true };
}

const revokeSchema = z.object({
  tenantId: uuidSchema,
  consentId: uuidSchema,
});

export async function revokeConsentAction(formData: FormData): Promise<void> {
  const parsed = revokeSchema.safeParse({
    tenantId: formData.get("tenantId"),
    consentId: formData.get("consentId"),
  });
  if (!parsed.success) return;
  const input = parsed.data;

  try {
    await requirePermission(input.tenantId, "lgpd.manage");
  } catch {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data: updated } = await supabase
    .from("consents")
    .update({ granted: false, revoked_at: new Date().toISOString() })
    .eq("id", input.consentId)
    .eq("tenant_id", input.tenantId)
    .select("id")
    .maybeSingle();
  if (!updated) return;

  await audit({
    tenantId: input.tenantId,
    action: "lgpd.consent_revoked",
    resourceType: "consent",
    resourceId: input.consentId,
  });

  revalidatePath("/viveiro/governanca");
}
