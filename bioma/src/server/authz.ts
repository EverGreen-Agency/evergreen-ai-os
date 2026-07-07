/**
 * Autorização por recurso (Zero Trust / anti-IDOR).
 *
 * Duas linhas de defesa, sempre juntas:
 *  1. Estas checagens explícitas nas server actions (erro claro p/ UX);
 *  2. RLS no Postgres (se a checagem for esquecida, o banco bloqueia — CA1).
 *
 * As leituras aqui usam o client do USUÁRIO (passam pelo RLS): um usuário só
 * enxerga as próprias memberships/roles, então não há como forjar escopo.
 */
import "server-only";

import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string | null;
};

export type MembershipInfo = {
  orgId: string;
  roleKey: string;
  permissions: string[];
};

export class AuthzError extends Error {
  constructor(message = "Não autorizado") {
    super(message);
    this.name = "AuthzError";
  }
}

/** Usuário autenticado ou erro (validado no servidor de auth, não no cookie). */
export const requireUser = cache(async (): Promise<SessionUser> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthzError("Sessão inválida ou expirada");
  return { id: user.id, email: user.email ?? null };
});

/** Memberships ativas do usuário corrente, com papéis e permissões resolvidos. */
export const getMyMemberships = cache(async (): Promise<MembershipInfo[]> => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("memberships")
    .select(
      "org_id, status, roles:role_id (key, role_permissions (permissions:permission_id (key)))",
    )
    .eq("user_id", user.id)
    .eq("status", "active");
  if (error) throw new AuthzError(error.message);

  return (data ?? []).map((m) => {
    const role = Array.isArray(m.roles) ? m.roles[0] : m.roles;
    const rps = (role?.role_permissions ?? []) as Array<{
      permissions: { key: string } | { key: string }[] | null;
    }>;
    const permissions = rps.flatMap((rp) =>
      rp.permissions
        ? Array.isArray(rp.permissions)
          ? rp.permissions.map((p) => p.key)
          : [rp.permissions.key]
        : [],
    );
    return { orgId: m.org_id as string, roleKey: role?.key ?? "", permissions };
  });
});

/** O usuário corrente é super-admin da plataforma (membership super_admin em org platform)? */
export const isPlatformSuperAdmin = cache(async (): Promise<boolean> => {
  const memberships = await getMyMemberships();
  if (!memberships.some((m) => m.roleKey === "super_admin")) return false;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("organizations")
    .select("id, org_type")
    .eq("org_type", "platform")
    .in("id", memberships.filter((m) => m.roleKey === "super_admin").map((m) => m.orgId));
  return (data ?? []).length > 0;
});

/**
 * Exige permissão sobre UMA org específica (recurso), nunca "permissão global".
 * Membership direta OU tenant_admin ancestral OU super-admin de plataforma —
 * mesmo contrato da função SQL app.has_permission (que o RLS reforça).
 */
export async function requirePermission(
  orgId: string,
  permission: string,
): Promise<void> {
  if (await isPlatformSuperAdmin()) return;

  const memberships = await getMyMemberships();
  const direct = memberships.find((m) => m.orgId === orgId);
  if (direct?.permissions.includes(permission)) return;

  // tenant_admin ancestral: a org alvo precisa estar visível (RLS já expande
  // descendentes de tenant_admin) E alguma membership tenant_admin ter a permissão.
  const supabase = await createSupabaseServerClient();
  const { data: visible } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", orgId)
    .maybeSingle();
  const hasViaAdmin = memberships.some(
    (m) => m.roleKey === "tenant_admin" && m.permissions.includes(permission),
  );
  if (visible && hasViaAdmin) return;

  throw new AuthzError(`Permissão ausente: ${permission}`);
}

/** Exige super-admin de plataforma (operações de plataforma: criar tenant raiz, suspender). */
export async function requirePlatformSuperAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!(await isPlatformSuperAdmin())) {
    throw new AuthzError("Requer super-admin da plataforma");
  }
  return user;
}
