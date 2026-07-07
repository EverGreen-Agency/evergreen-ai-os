"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { uuidSchema } from "@/lib/validation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { audit } from "@/server/audit";
import { AuthzError, requirePermission, requireUser } from "@/server/authz";
import { decryptToken, encryptToken } from "@/server/crypto";
import type { ActionState } from "./orgs";

const CREDENTIAL_STATUSES = [
  "active",
  "expired",
  "compromised",
  "revoked",
  "rotating",
] as const;

const secretField = z.string().min(1).max(10_000).optional();

const createCredentialSchema = z.object({
  tenantId: uuidSchema,
  platform: z.string().min(2).max(60),
  label: z.string().min(2).max(200),
  username: secretField,
  password: secretField,
  token: secretField,
  recoveryCodes: secretField,
  notes: secretField,
});

/** Cadastra credencial: TODO segredo é cifrado ANTES de tocar o banco (CA1). */
export async function createCredentialAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createCredentialSchema.safeParse({
    tenantId: formData.get("tenantId"),
    platform: formData.get("platform"),
    label: formData.get("label"),
    username: formData.get("username") || undefined,
    password: formData.get("password") || undefined,
    token: formData.get("token") || undefined,
    recoveryCodes: formData.get("recoveryCodes") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: "invalid_input" };
  const input = parsed.data;

  if (!input.username && !input.password && !input.token) {
    return { error: "invalid_input" }; // credencial sem segredo não faz sentido
  }

  const user = await requireUser();
  try {
    await requirePermission(input.tenantId, "vault.manage");
  } catch (e) {
    return { error: e instanceof AuthzError ? "forbidden" : "unknown" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vault_credentials")
    .insert({
      tenant_id: input.tenantId,
      platform: input.platform,
      label: input.label,
      owner_user_id: user.id,
      created_by: user.id,
      encrypted_username: input.username ? encryptToken(input.username) : null,
      encrypted_password: input.password ? encryptToken(input.password) : null,
      encrypted_token: input.token ? encryptToken(input.token) : null,
      encrypted_recovery_codes: input.recoveryCodes
        ? encryptToken(input.recoveryCodes)
        : null,
      encrypted_notes: input.notes ? encryptToken(input.notes) : null,
    })
    .select("id")
    .single();
  if (error) return { error: "db_error" };

  await audit({
    tenantId: input.tenantId,
    action: "vault.credential_created",
    resourceType: "vault_credential",
    resourceId: data.id,
    metadata: { platform: input.platform }, // nunca segredo/label longo em metadata
  });

  revalidatePath("/vault");
  return { ok: true };
}

const revealSchema = z.object({
  credentialId: uuidSchema,
  tenantId: uuidSchema,
  reason: z.string().min(3).max(500),
});

export type RevealedSecrets = {
  error?: string;
  secrets?: {
    username?: string;
    password?: string;
    token?: string;
    recoveryCodes?: string;
    notes?: string;
  };
};

/**
 * Revela segredos decifrados (RF3/CA3): exige 'vault.reveal' (operator NÃO tem),
 * motivo obrigatório, e SEMPRE audita. Credencial revogada/comprometida não
 * revela (CA6 da spec do cofre).
 */
export async function revealCredentialAction(
  _prev: RevealedSecrets,
  formData: FormData,
): Promise<RevealedSecrets> {
  const parsed = revealSchema.safeParse({
    credentialId: formData.get("credentialId"),
    tenantId: formData.get("tenantId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { error: "invalid_input" };
  const input = parsed.data;

  try {
    await requirePermission(input.tenantId, "vault.reveal");
  } catch (e) {
    return { error: e instanceof AuthzError ? "forbidden" : "unknown" };
  }

  const supabase = await createSupabaseServerClient();
  // RLS + .eq(tenant_id): id forjado de outro tenant → 0 linhas (anti-IDOR).
  const { data: row } = await supabase
    .from("vault_credentials")
    .select(
      "id, status, encrypted_username, encrypted_password, encrypted_token, encrypted_recovery_codes, encrypted_notes",
    )
    .eq("id", input.credentialId)
    .eq("tenant_id", input.tenantId)
    .maybeSingle();
  if (!row) return { error: "forbidden" };
  if (row.status === "revoked" || row.status === "compromised") {
    return { error: "credential_blocked" };
  }

  // Auditoria ANTES de devolver o segredo — falhou audit, não revela (RF4).
  await audit({
    tenantId: input.tenantId,
    action: "vault.credential_revealed",
    resourceType: "vault_credential",
    resourceId: row.id,
    metadata: { reason: input.reason },
  });

  return {
    secrets: {
      username: row.encrypted_username
        ? decryptToken(row.encrypted_username)
        : undefined,
      password: row.encrypted_password
        ? decryptToken(row.encrypted_password)
        : undefined,
      token: row.encrypted_token ? decryptToken(row.encrypted_token) : undefined,
      recoveryCodes: row.encrypted_recovery_codes
        ? decryptToken(row.encrypted_recovery_codes)
        : undefined,
      notes: row.encrypted_notes ? decryptToken(row.encrypted_notes) : undefined,
    },
  };
}

const setStatusSchema = z.object({
  credentialId: uuidSchema,
  tenantId: uuidSchema,
  status: z.enum(CREDENTIAL_STATUSES),
});

/** Rotação/revogação/expiração (RF5/CA6): vault.manage + audit. */
export async function setCredentialStatusAction(formData: FormData): Promise<void> {
  const parsed = setStatusSchema.safeParse({
    credentialId: formData.get("credentialId"),
    tenantId: formData.get("tenantId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;
  const input = parsed.data;

  try {
    await requirePermission(input.tenantId, "vault.manage");
  } catch {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data: updated } = await supabase
    .from("vault_credentials")
    .update({
      status: input.status,
      ...(input.status === "rotating" ? { rotated_at: new Date().toISOString() } : {}),
    })
    .eq("id", input.credentialId)
    .eq("tenant_id", input.tenantId)
    .select("id")
    .maybeSingle();
  if (!updated) return;

  await audit({
    tenantId: input.tenantId,
    action: "vault.credential_status_changed",
    resourceType: "vault_credential",
    resourceId: input.credentialId,
    metadata: { new_status: input.status },
  });

  revalidatePath("/vault");
}
