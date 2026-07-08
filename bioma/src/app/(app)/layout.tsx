import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";

import { OrgSwitcher } from "@/components/org-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getActiveOrg, getVisibleOrgs } from "@/server/active-org";
import { logoutAction } from "@/server/actions/auth";
import {
  getMyMemberships,
  isPlatformMember,
  isPlatformSuperAdmin,
  requireUser,
} from "@/server/authz";

/**
 * Shell do tenant (RF8): contexto da org ativa + gate de suspensão (CA6, além
 * da RLS) + theming white-label (ADR-0010) injetado server-side.
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireUser(); // proxy já redireciona; cinto e suspensório
  const t = await getTranslations("shell");

  const [orgs, activeOrg, memberships, superAdmin, platformMember] =
    await Promise.all([
      getVisibleOrgs(),
      getActiveOrg(),
      getMyMemberships(),
      isPlatformSuperAdmin(),
      isPlatformMember(),
    ]);

  // Sem org visível: ou o usuário não tem vínculo, ou TODAS as orgs dele estão
  // suspensas (RLS as esconde — memberships continuam visíveis para si mesmo).
  if (!activeOrg) {
    const blocked = memberships.length > 0;
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-2xl font-semibold">
          {blocked ? t("suspended.title") : t("noOrg.title")}
        </h1>
        <p className="max-w-md text-muted-foreground">
          {blocked ? t("suspended.body") : t("noOrg.body")}
        </p>
        <form action={logoutAction}>
          <Button variant="outline">{t("logout")}</Button>
        </form>
      </main>
    );
  }

  const brandColor = activeOrg.branding.primary_color;

  return (
    <>
      {/* White-label (ADR-0010): sobrescreve tokens a partir do branding do tenant. */}
      {brandColor ? (
        <style>{`:root { --primary: ${sanitizeColor(brandColor)}; --ring: ${sanitizeColor(brandColor)}; }`}</style>
      ) : null}

      <header className="border-b border-border bg-surface-deep">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-2.5">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-semibold text-primary">
              Bioma
              <span className="ml-2 text-[10px] font-normal uppercase tracking-[1px] text-muted-foreground">
                EverGreen
              </span>
            </Link>
            <Badge variant="secondary">{activeOrg.name}</Badge>
          </div>

          <div className="flex items-center gap-2">
            {orgs.length > 1 ? (
              <OrgSwitcher
                orgs={orgs.map((o) => ({ id: o.id, name: o.name }))}
                activeOrgId={activeOrg.id}
                label={t("switchOrg")}
              />
            ) : null}
            <Link
              href="/vault"
              className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              {t("vault")}
            </Link>
            {platformMember ? (
              <Link
                href="/viveiro"
                className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted"
              >
                {t("viveiro")}
              </Link>
            ) : null}
            {superAdmin ? (
              <Link
                href="/admin"
                className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted"
              >
                <ShieldCheck className="size-4" /> {t("admin")}
              </Link>
            ) : null}
            <ThemeToggle />
            <form action={logoutAction}>
              <Button variant="outline" size="sm">
                {t("logout")}
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">{children}</main>
    </>
  );
}

/** Só aceita cor CSS simples (hex/rgb/hsl) — nunca injetar string livre do banco. */
function sanitizeColor(value: string): string {
  return /^(#[0-9a-fA-F]{3,8}|rgb\([\d\s,%.]+\)|hsl\([\d\s,%.deg]+\))$/.test(value)
    ? value
    : "var(--primary)";
}
