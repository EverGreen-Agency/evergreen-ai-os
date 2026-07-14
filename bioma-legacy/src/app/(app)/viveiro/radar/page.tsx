import { getTranslations } from "next-intl/server";
import type { Route } from "next";

import { Chip, FilterChipLink } from "@/components/os/chip";
import { KanbanBoard, KanbanCard, KanbanColumn } from "@/components/os/kanban";
import {
  FALLBACK_COLOR,
  QUADRANT_LABEL,
  RING_META,
  RING_ORDER,
} from "@/components/os/meta";
import { Toolbar, ToolbarCount } from "@/components/os/toolbar";
import { getStackRadar, type Tech } from "@/server/viveiro/adapters";

import { MemoryUnavailable } from "../memory-unavailable";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/**
 * Tech Radar — kanban por anel (adote→evite), cores do legado (RING_META),
 * chip de quadrante e referência de ADR por tecnologia (RF3).
 */
export default async function ViveiroRadarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations("viveiro.radar");
  const radar = await getStackRadar();
  if (radar === null) return <MemoryUnavailable />;

  const params = await searchParams;
  const filterQuadrant = firstValue(params.quadrant);

  const quadrants = [...new Set(radar.techs.map((x) => x.quadrant).filter(Boolean))].sort();
  const techs = filterQuadrant
    ? radar.techs.filter((x) => x.quadrant === filterQuadrant)
    : radar.techs;

  const rings = RING_ORDER.filter((r) =>
    (radar.rings.length > 0 ? radar.rings : RING_ORDER).includes(r),
  );
  const extraRings = [...new Set(techs.map((x) => x.ring))].filter(
    (r) => r && !rings.includes(r),
  );

  return (
    <div className="flex flex-col gap-3">
      <Toolbar>
        <FilterChipLink
          color={FALLBACK_COLOR}
          href={"/viveiro/radar" as Route}
          active={!filterQuadrant}
        >
          {t("filters.all")}
        </FilterChipLink>
        {quadrants.map((q) => (
          <FilterChipLink
            key={q}
            color="#00d4ff"
            href={`/viveiro/radar?quadrant=${encodeURIComponent(q)}` as Route}
            active={filterQuadrant === q}
          >
            {QUADRANT_LABEL[q] ?? q}
          </FilterChipLink>
        ))}
        <ToolbarCount>{t("count", { count: techs.length })}</ToolbarCount>
      </Toolbar>

      <KanbanBoard>
        {[...rings, ...extraRings].map((ring) => {
          const meta = RING_META[ring] ?? { label: ring, color: FALLBACK_COLOR, hint: "" };
          const items = techs
            .filter((x) => x.ring === ring)
            .sort((a, b) => a.name.localeCompare(b.name));
          return (
            <KanbanColumn
              key={ring}
              label={meta.label}
              color={meta.color}
              count={items.length}
              hint={meta.hint}
            >
              {items.map((tech) => (
                <TechCard key={tech.id} tech={tech} ringColor={meta.color} />
              ))}
            </KanbanColumn>
          );
        })}
      </KanbanBoard>
    </div>
  );
}

function TechCard({ tech, ringColor }: { tech: Tech; ringColor: string }) {
  return (
    <KanbanCard>
      <p className="font-medium">{tech.name}</p>
      {tech.note ? (
        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{tech.note}</p>
      ) : null}
      <div className="mt-1.5 flex flex-wrap gap-1">
        {tech.quadrant ? (
          <Chip color="#00d4ff">{QUADRANT_LABEL[tech.quadrant] ?? tech.quadrant}</Chip>
        ) : null}
        {tech.adr ? (
          <Chip color={ringColor} title={tech.adr} className="font-mono">
            {tech.adr}
          </Chip>
        ) : null}
      </div>
    </KanbanCard>
  );
}
