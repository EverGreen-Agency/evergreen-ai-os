import { getTranslations } from "next-intl/server";
import type { Route } from "next";

import { Chip, FilterChipLink } from "@/components/os/chip";
import { GraphBadges } from "@/components/os/graph-badges";
import { KanbanBoard, KanbanCard, KanbanColumn } from "@/components/os/kanban";
import {
  CAT_COLOR,
  FALLBACK_COLOR,
  HORIZON_META,
  HORIZON_ORDER,
  STAGE_META,
  STAGE_ORDER,
} from "@/components/os/meta";
import { Toolbar, ToolbarCount } from "@/components/os/toolbar";
import { getIdeaBank, type Idea } from "@/server/viveiro/adapters";

import { MemoryUnavailable } from "../memory-unavailable";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/**
 * Banco de Ideias — kanban denso por stage (linguagem visual do legado):
 * cor por stage na coluna, chips de categoria/horizonte, badges de grafo
 * (← depende, → habilita, ⊂ parte-de, ⊃ contém). Leitura (RF2 corte 1);
 * filtros por chips-link GET, sem JS no client.
 */
export default async function ViveiroIdeasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations("viveiro.ideas");
  const bank = await getIdeaBank();
  if (bank === null) return <MemoryUnavailable />;

  const params = await searchParams;
  const filterCategory = firstValue(params.category);

  const active = bank.ideas.filter((i) => !i.archived);
  const categories = [...new Set(active.map((i) => i.category).filter(Boolean))].sort();
  const filtered = filterCategory
    ? active.filter((i) => i.category === filterCategory)
    : active;

  // Quantos módulos cada umbrella contém (badge ⊃).
  const containsCount = new Map<string, number>();
  for (const idea of active) {
    if (idea.part_of) {
      containsCount.set(idea.part_of, (containsCount.get(idea.part_of) ?? 0) + 1);
    }
  }

  const stages = STAGE_ORDER.filter((s) =>
    (bank.stages.length > 0 ? bank.stages : STAGE_ORDER).includes(s),
  );
  const extraStages = [...new Set(filtered.map((i) => i.stage))].filter(
    (s) => s && !stages.includes(s),
  );

  const byStage = (stage: string) =>
    filtered
      .filter((i) => i.stage === stage)
      .sort(
        (a, b) =>
          (HORIZON_ORDER[a.horizon] ?? 4) - (HORIZON_ORDER[b.horizon] ?? 4) ||
          a.title.localeCompare(b.title),
      );

  return (
    <div className="flex flex-col gap-3">
      <Toolbar>
        <FilterChipLink
          color={FALLBACK_COLOR}
          href={"/viveiro/ideias" as Route}
          active={!filterCategory}
        >
          {t("filters.all")}
        </FilterChipLink>
        {categories.map((cat) => (
          <FilterChipLink
            key={cat}
            color={CAT_COLOR[cat] ?? FALLBACK_COLOR}
            href={`/viveiro/ideias?category=${encodeURIComponent(cat)}` as Route}
            active={filterCategory === cat}
          >
            {cat}
          </FilterChipLink>
        ))}
        <ToolbarCount>{t("count", { count: filtered.length })}</ToolbarCount>
      </Toolbar>

      <KanbanBoard>
        {[...stages, ...extraStages].map((stage) => {
          const meta = STAGE_META[stage] ?? {
            label: stage,
            color: FALLBACK_COLOR,
            hint: "",
          };
          const ideas = byStage(stage);
          return (
            <KanbanColumn
              key={stage}
              label={meta.label}
              color={meta.color}
              count={ideas.length}
              hint={meta.hint}
            >
              {ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  contains={containsCount.get(idea.id) ?? 0}
                />
              ))}
            </KanbanColumn>
          );
        })}
      </KanbanBoard>
    </div>
  );
}

function IdeaCard({ idea, contains }: { idea: Idea; contains: number }) {
  const catColor = CAT_COLOR[idea.category] ?? FALLBACK_COLOR;
  const horizon = HORIZON_META[idea.horizon];
  return (
    <KanbanCard>
      <p className="font-medium">{idea.title}</p>
      {idea.desc ? (
        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
          {idea.desc}
        </p>
      ) : null}
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {idea.category ? <Chip color={catColor}>{idea.category}</Chip> : null}
        {horizon ? <Chip color={horizon.color}>{horizon.label}</Chip> : null}
        <GraphBadges
          dependsOn={idea.depends_on.length}
          enables={idea.enables.length}
          partOf={idea.part_of}
          containsCount={contains}
        />
        {idea.readiness ? (
          <Chip color="#ffab00" title={idea.readiness}>
            gate
          </Chip>
        ) : null}
      </div>
    </KanbanCard>
  );
}
