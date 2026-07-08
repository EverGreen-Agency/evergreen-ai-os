import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Route } from "next";

import { Chip } from "@/components/os/chip";
import { GraphBadges } from "@/components/os/graph-badges";
import { OsMarkdown } from "@/components/os/markdown";
import { FALLBACK_COLOR, PHASE_COLOR, STAGE_META } from "@/components/os/meta";
import { hasViveiroAccess } from "@/server/viveiro/access";
import {
  getEngineeringModules,
  getIdeaBank,
  getMaturityMatrix,
  getModuleDetail,
} from "@/server/viveiro/adapters";

/**
 * Detalhe do módulo — o coração do BANCO DE ARTEFATOS: spec + ADRs + tasks
 * renderizados, maturidade/próximo gate da matriz, e grafo de dependências
 * navegável (via ideas.json) ligando módulo a módulo.
 */
export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await hasViveiroAccess())) redirect("/");
  const { id } = await params;
  const t = await getTranslations("viveiro.engineering");

  const [detail, matrix, bank, modules] = await Promise.all([
    getModuleDetail(id),
    getMaturityMatrix(),
    getIdeaBank(),
    getEngineeringModules(),
  ]);
  if (detail === null) notFound();

  const mat = matrix?.get(id);
  const phase = mat?.phase.match(/P\d(?:\.\d)?/)?.[0] ?? mat?.phase ?? null;
  const phaseColor = (phase && PHASE_COLOR[phase]) || FALLBACK_COLOR;

  const idea = bank?.ideas.find((i) => i.id === id) ?? null;
  const moduleIds = new Set((modules ?? []).map((m) => m.id));
  const contains = bank?.ideas.filter((i) => i.part_of === id && !i.archived) ?? [];
  const stageMeta = idea ? STAGE_META[idea.stage] : undefined;

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho do artefato */}
      <header className="rounded-md border border-border bg-surface-deep p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-mono text-lg font-bold text-info">{id}</h1>
          {phase ? <Chip color={phaseColor}>{phase}</Chip> : null}
          {mat ? <Chip color={phaseColor}>{mat.maturity}</Chip> : null}
          {idea && stageMeta ? (
            <Chip color={stageMeta.color}>{stageMeta.label}</Chip>
          ) : null}
          {idea ? (
            <GraphBadges
              dependsOn={idea.depends_on.length}
              enables={idea.enables.length}
              partOf={idea.part_of}
              containsCount={contains.length}
            />
          ) : null}
        </div>
        {mat?.nextGate ? (
          <p className="mt-2 text-[12px] text-muted-foreground">
            <span className="font-semibold text-warning">{t("detail.nextGate")}:</span>{" "}
            {mat.nextGate}
          </p>
        ) : null}
        {idea ? (
          <p className="mt-1 text-[12px] text-muted-foreground">{idea.desc}</p>
        ) : null}
      </header>

      {/* Grafo navegável: dependências/habilitações/contidos que também são módulos */}
      {idea &&
      (idea.depends_on.length > 0 || idea.enables.length > 0 || contains.length > 0) ? (
        <section className="rounded-md border border-border bg-card p-3 text-[12px]">
          <RelationRow
            label={`← ${t("detail.dependsOn")}`}
            ids={idea.depends_on}
            moduleIds={moduleIds}
            color="#ffab00"
          />
          <RelationRow
            label={`→ ${t("detail.enables")}`}
            ids={idea.enables}
            moduleIds={moduleIds}
            color="#00d4ff"
          />
          <RelationRow
            label={`⊃ ${t("detail.contains")}`}
            ids={contains.map((c) => c.id)}
            moduleIds={moduleIds}
            color="#3ac97b"
          />
        </section>
      ) : null}

      {/* Spec */}
      {detail.specContent ? (
        <Artifact title="spec.md" defaultOpen>
          <OsMarkdown>{detail.specContent}</OsMarkdown>
        </Artifact>
      ) : (
        <p className="text-[12px] text-muted-foreground">{t("detail.noSpec")}</p>
      )}

      {/* ADRs */}
      {detail.adrs.map((adr) => (
        <Artifact key={adr.file} title={adr.title} subtitle={`adr/${adr.file}`}>
          <OsMarkdown>{adr.content}</OsMarkdown>
        </Artifact>
      ))}

      {/* Tasks */}
      {detail.tasksContent ? (
        <Artifact title="tasks.md">
          <OsMarkdown>{detail.tasksContent}</OsMarkdown>
        </Artifact>
      ) : null}

      <Link
        href={"/viveiro/engenharia" as Route}
        className="text-[12px] text-info underline underline-offset-2"
      >
        ← {t("detail.back")}
      </Link>
    </div>
  );
}

function RelationRow({
  label,
  ids,
  moduleIds,
  color,
}: {
  label: string;
  ids: string[];
  moduleIds: Set<string>;
  color: string;
}) {
  if (ids.length === 0) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-1.5 py-0.5">
      <span className="font-semibold" style={{ color }}>
        {label}:
      </span>
      {ids.map((rid) =>
        moduleIds.has(rid) ? (
          <Link
            key={rid}
            href={`/viveiro/engenharia/${rid}` as Route}
            className="font-mono text-info underline underline-offset-2"
          >
            {rid}
          </Link>
        ) : (
          <span key={rid} className="font-mono text-muted-foreground">
            {rid}
          </span>
        ),
      )}
    </div>
  );
}

/** Artefato colapsável (details nativo — denso e sem JS). */
function Artifact({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-md border border-border bg-card open:pb-3"
    >
      <summary className="cursor-pointer select-none px-4 py-2.5 text-[13px] font-semibold hover:bg-muted/50">
        <span className="text-primary">{title}</span>
        {subtitle ? (
          <span className="ml-2 font-mono text-[11px] text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </summary>
      <div className="px-4">{children}</div>
    </details>
  );
}
