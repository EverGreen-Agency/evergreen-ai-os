/**
 * Gate de acesso do cockpit interno.
 *
 * O cockpit é SUPERFÍCIE INTERNA da EG: só membros ativos da org de
 * plataforma (org_type='platform') entram — qualquer papel (super_admin,
 * operator, …). Clientes/tenants NUNCA enxergam o cockpit.
 *
 * A leitura usa o client do usuário (passa pelo RLS): as memberships e a org
 * plataforma só ficam visíveis para quem realmente pertence a elas.
 */
import "server-only";

import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMyMemberships, isPlatformSuperAdmin } from "@/server/authz";

/** Membership ativa em org de plataforma (qualquer papel) OU super-admin. */
export const hasViveiroAccess = cache(async (): Promise<boolean> => {
  if (await isPlatformSuperAdmin()) return true;

  const memberships = await getMyMemberships();
  if (memberships.length === 0) return false;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("organizations")
    .select("id")
    .eq("org_type", "platform")
    .in(
      "id",
      memberships.map((m) => m.orgId),
    );
  return (data ?? []).length > 0;
});
