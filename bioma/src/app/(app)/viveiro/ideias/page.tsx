import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { getIdeaBank, type Idea } from "@/server/viveiro/adapters";

import { MemoryUnavailable } from "../memory-unavailable";

const KNOWN_STAGES = ["capture", "evaluation", "processing", "project", "company"];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/**
 * Banco de Ideias — leitura + filtros (RF2, corte 1 é read-only).
 * Filtros viajam por searchParams (form GET, sem JS no client).
 */
export default async function CockpitIdeasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations("viveiro.ideas");
  const bank = await getIdeaBank();

  if (bank === null) return <MemoryUnavailable />;

  const params = await searchParams;
  const filterCategory = firstValue(params.category);
  const filterStage = firstValue(params.stage);
  const filterPartOf = firstValue(params.part_of);

  const active = bank.ideas.filter((i) => !i.archived);
  const archivedCount = bank.ideas.length - active.length;

  const categories = [...new Set(active.map((i) => i.category).filter(Boolean))].sort();
  const stages = bank.stages.length > 0 ? bank.stages : KNOWN_STAGES;
  const partOfValues = [
    ...new Set(active.map((i) => i.part_of).filter((p): p is string => Boolean(p))),
  ].sort();

  const filtered = active.filter(
    (i) =>
      (filterCategory === "" || i.category === filterCategory) &&
      (filterStage === "" || i.stage === filterStage) &&
      (filterPartOf === "" || i.part_of === filterPartOf),
  );

  const stageLabel = (stage: string) =>
    KNOWN_STAGES.includes(stage) ? t(`stages.${stage}`) : stage;

  const hasFilters = filterCategory !== "" || filterStage !== "" || filterPartOf !== "";

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros — form GET puro: recarrega a página com searchParams. */}
      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"
      >
        <FilterField label={t("filters.category")}>
          <Select name="category" defaultValue={filterCategory} className="w-44">
            <option value="">{t("filters.all")}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label={t("filters.stage")}>
          <Select name="stage" defaultValue={filterStage} className="w-44">
            <option value="">{t("filters.all")}</option>
            {stages.map((s) => (
              <option key={s} value={s}>
                {stageLabel(s)}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label={t("filters.partOf")}>
          <Select name="part_of" defaultValue={filterPartOf} className="w-56">
            <option value="">{t("filters.all")}</option>
            {partOfValues.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </FilterField>
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm">
            {t("filters.apply")}
          </Button>
          {hasFilters ? (
            <Link
              href="/viveiro/ideias"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("filters.clear")}
            </Link>
          ) : null}
        </div>
      </form>

      <p className="text-sm text-muted-foreground">
        {t("count", { shown: filtered.length, total: active.length })}
        {archivedCount > 0 ? ` ${t("archivedHidden", { count: archivedCount })}` : null}
      </p>

      <Card>
        <CardContent className="pt-6">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-4">{t("columns.title")}</th>
                    <th className="py-2 pr-4">{t("columns.category")}</th>
                    <th className="py-2 pr-4">{t("columns.stage")}</th>
                    <th className="py-2 pr-4">{t("columns.horizon")}</th>
                    <th className="py-2 pr-4">{t("columns.partOf")}</th>
                    <th className="py-2">{t("columns.readiness")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((idea) => (
                    <IdeaRow
                      key={idea.id}
                      idea={idea}
                      stageLabel={idea.stage ? stageLabel(idea.stage) : "—"}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

function IdeaRow({ idea, stageLabel }: { idea: Idea; stageLabel: string }) {
  return (
    <tr className="border-b border-border/60 align-top">
      <td className="max-w-md py-2 pr-4">
        <p className="font-medium">{idea.title}</p>
        {idea.desc ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {idea.desc}
          </p>
        ) : null}
      </td>
      <td className="py-2 pr-4">
        {idea.category ? <Badge variant="secondary">{idea.category}</Badge> : "—"}
      </td>
      <td className="py-2 pr-4">
        <Badge variant="outline">{stageLabel}</Badge>
      </td>
      <td className="py-2 pr-4 text-xs text-muted-foreground">
        {idea.horizon || "—"}
      </td>
      <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
        {idea.part_of ?? "—"}
      </td>
      <td className="max-w-xs py-2 text-xs text-muted-foreground">
        {idea.readiness ?? "—"}
      </td>
    </tr>
  );
}
