import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { hasViveiroAccess } from "@/server/viveiro/access";

import { ViveiroNav } from "./viveiro-nav";

/**
 * Área /viveiro — superfície operacional INTERNA da EG (mod-cockpit-interno).
 * Gate: membership ativa na org de plataforma (qualquer papel); fora disso,
 * volta para a home do tenant.
 */
export default async function CockpitLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!(await hasViveiroAccess())) redirect("/");

  const t = await getTranslations("viveiro");

  const tabs = [
    { href: "/viveiro", label: t("nav.overview"), exact: true },
    { href: "/viveiro/ideias", label: t("nav.ideas") },
    { href: "/viveiro/radar", label: t("nav.radar") },
    { href: "/viveiro/engenharia", label: t("nav.engineering") },
    { href: "/viveiro/arquitetura", label: t("nav.architecture") },
    { href: "/viveiro/legado", label: t("nav.legacy") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <ViveiroNav tabs={tabs} />
      {children}
    </div>
  );
}
