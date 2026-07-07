/**
 * Contexto do tenant ativo (RF8): cookie com o org_id escolhido, SEMPRE
 * revalidado contra o RLS — se a org não for visível/ativa para o usuário,
 * o cookie é ignorado (anti-IDOR: cookie é input do cliente).
 */
import "server-only";

import { cookies } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const ACTIVE_ORG_COOKIE = "bioma_active_org";

export type ActiveOrg = {
  id: string;
  name: string;
  slug: string;
  orgType: string;
  status: string;
  branding: { primary_color?: string; logo_url?: string };
  locale: string;
};

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  org_type: string;
  status: string;
  branding: ActiveOrg["branding"] | null;
  locale: string;
};

function toActiveOrg(o: OrgRow): ActiveOrg {
  return {
    id: o.id,
    name: o.name,
    slug: o.slug,
    orgType: o.org_type,
    status: o.status,
    branding: o.branding ?? {},
    locale: o.locale,
  };
}

/** Orgs visíveis ao usuário (RLS decide — nada de filtro manual). */
export async function getVisibleOrgs(): Promise<ActiveOrg[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("organizations")
    .select("id, name, slug, org_type, status, branding, locale")
    .order("name");
  return ((data ?? []) as OrgRow[]).map(toActiveOrg);
}

/**
 * Org ativa: cookie validado contra as orgs visíveis; fallback = primeira
 * visível. null = usuário sem nenhuma org acessível (ou todas suspensas).
 */
export async function getActiveOrg(): Promise<ActiveOrg | null> {
  const orgs = await getVisibleOrgs();
  if (orgs.length === 0) return null;
  const cookieStore = await cookies();
  const wanted = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  return orgs.find((o) => o.id === wanted) ?? orgs[0];
}
