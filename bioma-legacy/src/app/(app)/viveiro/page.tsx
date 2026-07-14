import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getEngineeringModules,
  getIdeaBank,
  getStackRadar,
} from "@/server/viveiro/adapters";
import { LEGACY_INVENTORY } from "@/server/viveiro/legacy-inventory";

import { MemoryUnavailable } from "./memory-unavailable";

const KNOWN_STAGES = ["capture", "evaluation", "processing", "project", "company"];
const KNOWN_RING_KEYS = ["adopt", "trial", "assess", "hold"];

function countBy<T>(items: T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

/** Visão geral do cockpit: contagens dos bancos internos + atalhos. */
export default async function CockpitOverviewPage() {
  const t = await getTranslations("viveiro");

  const [ideaBank, stackRadar, modules] = await Promise.all([
    getIdeaBank(),
    getStackRadar(),
    getEngineeringModules(),
  ]);

  if (ideaBank === null && stackRadar === null && modules === null) {
    return <MemoryUnavailable />;
  }

  const activeIdeas = ideaBank?.ideas.filter((i) => !i.archived) ?? [];
  const ideasByStage = countBy(activeIdeas, (i) => i.stage);
  const ideasByCategory = [...countBy(activeIdeas, (i) => i.category).entries()].sort(
    (a, b) => b[1] - a[1],
  );

  const techs = stackRadar?.techs ?? [];
  const techsByRing = countBy(techs, (tech) => tech.ring);
  const ringOrder = stackRadar?.rings ?? KNOWN_RING_KEYS;

  const mods = modules ?? [];
  const withSpec = mods.filter((m) => m.hasSpec).length;
  const withAdrs = mods.filter((m) => m.adrCount > 0).length;
  const withTasks = mods.filter((m) => m.hasTasks).length;

  const legacyByDecision = countBy(LEGACY_INVENTORY, (item) => item.decision);

  const stageLabel = (stage: string) =>
    KNOWN_STAGES.includes(stage) ? t(`ideas.stages.${stage}`) : stage;
  const ringLabel = (ring: string) =>
    KNOWN_RING_KEYS.includes(ring) ? t(`radar.rings.${ring}`) : ring;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Banco de Ideias */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("overview.ideasTitle")}</CardTitle>
          <SectionLink href="/viveiro/ideias" label={t("overview.open")} />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {ideaBank ? (
            <>
              <p className="text-sm text-muted-foreground">
                {t("overview.ideasCount", { count: activeIdeas.length })}
              </p>
              <div className="flex flex-wrap gap-2">
                {(ideaBank.stages.length > 0 ? ideaBank.stages : KNOWN_STAGES)
                  .filter((stage) => (ideasByStage.get(stage) ?? 0) > 0)
                  .map((stage) => (
                    <Badge key={stage} variant="outline">
                      {stageLabel(stage)}: {ideasByStage.get(stage) ?? 0}
                    </Badge>
                  ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {ideasByCategory.map(([category, count]) => (
                  <Badge key={category} variant="secondary">
                    {category}: {count}
                  </Badge>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("overview.sourceMissing")}</p>
          )}
        </CardContent>
      </Card>

      {/* Tech Radar */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("overview.radarTitle")}</CardTitle>
          <SectionLink href="/viveiro/radar" label={t("overview.open")} />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {stackRadar ? (
            <>
              <p className="text-sm text-muted-foreground">
                {t("overview.radarCount", { count: techs.length })}
              </p>
              <div className="flex flex-wrap gap-2">
                {ringOrder
                  .filter((ring) => (techsByRing.get(ring) ?? 0) > 0)
                  .map((ring) => (
                    <Badge key={ring} variant="outline">
                      {ringLabel(ring)}: {techsByRing.get(ring) ?? 0}
                    </Badge>
                  ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("overview.sourceMissing")}</p>
          )}
        </CardContent>
      </Card>

      {/* Engenharia */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("overview.engineeringTitle")}</CardTitle>
          <SectionLink href="/viveiro/engenharia" label={t("overview.open")} />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {modules ? (
            <>
              <p className="text-sm text-muted-foreground">
                {t("overview.modulesCount", { count: mods.length })}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {t("overview.withSpec")}: {withSpec}
                </Badge>
                <Badge variant="outline">
                  {t("overview.withAdrs")}: {withAdrs}
                </Badge>
                <Badge variant="outline">
                  {t("overview.withTasks")}: {withTasks}
                </Badge>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("overview.sourceMissing")}</p>
          )}
        </CardContent>
      </Card>

      {/* Arquitetura + Legado */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("overview.legacyTitle")}</CardTitle>
          <SectionLink href="/viveiro/legado" label={t("overview.open")} />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {t("overview.legacyCount", { count: LEGACY_INVENTORY.length })}
          </p>
          <div className="flex flex-wrap gap-2">
            {[...legacyByDecision.entries()].map(([decision, count]) => (
              <Badge key={decision} variant="outline">
                {t(`legacy.decisions.${decision}`)}: {count}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            <Link href="/viveiro/arquitetura" className="text-primary hover:underline">
              {t("overview.architectureLink")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
    >
      {label} <ArrowRight className="size-3.5" />
    </Link>
  );
}
