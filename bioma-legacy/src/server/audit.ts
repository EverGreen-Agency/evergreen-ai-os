/**
 * Trilha de auditoria (RF7/CA5). Grava via client do USUÁRIO → a policy RLS
 * garante actor = auth.uid() (ninguém audita em nome de outro).
 *
 * REGRA: metadata NUNCA carrega PII (e-mail, nome, token). Ids e chaves, sim.
 */
import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "./authz";

export type AuditEntry = {
  /** null = ação de plataforma (só super-admin consegue gravar assim). */
  tenantId: string | null;
  action:
    | "auth.login"
    | "org.created"
    | "org.updated"
    | "org.suspended"
    | "org.reactivated"
    | "member.created"
    | "member.role_changed"
    | "member.removed"
    | "oauth.connected"
    | "oauth.disconnected"
    | "platform.impersonation"
    | (string & {});
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
};

export async function audit(entry: AuditEntry): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("audit_logs").insert({
    tenant_id: entry.tenantId,
    actor_user_id: user.id,
    action: entry.action,
    resource_type: entry.resourceType ?? null,
    resource_id: entry.resourceId ?? null,
    metadata: entry.metadata ?? {},
  });
  if (error) {
    // Auditoria é obrigatória em ação sensível: falha de audit = falha da ação.
    throw new Error(`Falha ao registrar auditoria: ${error.message}`);
  }
}
