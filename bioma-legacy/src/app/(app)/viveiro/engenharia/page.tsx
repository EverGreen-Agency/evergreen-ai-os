import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Route } from "next";

import { Chip } from "@/components/os/chip";
import { KanbanCard } from "@/components/os/kanban";
import { FALLBACK_COLOR, PHASE_COLOR } from "@/components/os/meta";
import { Toolbar, ToolbarCount } from "@/components/os/toolbar";
import {
  getEngineeringModules,
  getMaturityMatrix,
  type EngineeringModule,
  type ModuleMaturity,
} from "@/server/viveiro/adapters";

import { MemoryUnavailable } from "../memory-unavailable";

/** Ordem de fases do roadmap; módulos sem fase na matriz vão para o fim. */
const PHASE_ORDER = ["P0", "P0.5", "P1", "P2", "P3", "P4"];

function normalizePhase(phase: string | undefined): string {
  if (!phase) return "—";
  const match = phase.match(/P\d(?:\.\d)?/);
  return match ? match[0] : phase;
}

/**
 * Engenharia — BANCO DE ARTEFATOS navegável (RF1/CA1): módulos agrupados por
 * fase do roadmap, com maturidade, próximo gate e acesso ao detalhe
 * (spec + ADRs + tasks renderizados).
 */
export default async function ViveiroEngineeringPage() {
  const t = await getTranslations("viveiro.engineering");
  const [modules, matrix] = await Promise.all([
    getEngineeringModules(),
    getMaturityMatrix(),
  ]);
  if (modules === null) return <MemoryUnavailable />;

  const groups = new Map<string, Array<{ mod: EngineeringModule; mat?: ModuleMaturity }>>();
  for (const mod of modules) {
    const mat = matrix?.get(mod.id);
    const phase = normalizePhase(mat?.phase);
    if (!groups.has(phase)) groups.set(phase, []);
    groups.get(phase)!.push({ mod, mat });
  }

  const orderedPhases = [
    ...PHASE_ORDER.filter((p) => groups.has(p)),
    ...[...groups.keys()].filter((p) => !PHASE_ORDER.includes(p)).sort(),
  ];

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <span className="text-muted-foreground">{t("phasesHint")}</span>
        <ToolbarCount>{t("count", { count: modules.length })}</ToolbarCount>
      </Toolbar>

      {orderedPhases.map((phase) => {
        const items = groups.get(phase)!;
        const color = PHASE_COLOR[phase] ?? FALLBACK_COLOR;
        return (
          <section key={phase}>
            <h2
              className="mb-2 text-[11px] font-bold uppercase tracking-[0.7px]"
              style={{ color }}
            >
              {phase === "—" ? t("noPhase") : phase}{" "}
              <span className="font-mono text-muted-foreground">{items.length}</span>
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(({ mod, mat }) => (
                <ModuleCard key={mod.id} mod={mod} mat={mat} phaseColor={color} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

async function ModuleCard({
  mod,
  mat,
  phaseColor,
}: {
  mod: EngineeringModule;
  mat?: ModuleMaturity;
  phaseColor: string;
}) {
  const t = await getTranslations("viveiro.engineering");
  return (
    <Link href={`/viveiro/engenharia/${mod.id}` as Route} className="group">
      <KanbanCard className="h-full group-hover:border-primary">
        <p className="font-mono text-[12px] font-semibold text-info">{mod.id}</p>
        {mod.specTitle ? (
          <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">
            {mod.specTitle}
          </p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {mat ? <Chip color={phaseColor}>{mat.maturity}</Chip> : null}
          {mod.hasSpec ? (
            <Chip color="#3ac97b">{t("chips.spec")}</Chip>
          ) : (
            <Chip color="#ff6b5c">{t("chips.noSpec")}</Chip>
          )}
          {mod.adrCount > 0 ? (
            <Chip color="#00d4ff">{t("chips.adrs", { count: mod.adrCount })}</Chip>
          ) : null}
          {mod.hasTasks ? <Chip color="#ffab00">{t("chips.tasks")}</Chip> : null}
          {mod.specStatus ? <Chip color={FALLBACK_COLOR}>{mod.specStatus}</Chip> : null}
        </div>
        {mat?.nextGate ? (
          <p className="mt-1.5 line-clamp-2 text-[10px] text-muted-foreground">
            → {mat.nextGate}
          </p>
        ) : null}
      </KanbanCard>
    </Link>
  );
}
