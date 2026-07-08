import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getEngineeringModules,
  getStackRadar,
  KNOWN_QUADRANTS,
  KNOWN_RINGS,
} from "@/server/viveiro/adapters";

import { MemoryUnavailable } from "../memory-unavailable";

/** Ordem de exibição dentro do quadrante: da adoção mais firme à mais fraca. */
const RING_ORDER: Record<string, number> = { adopt: 0, trial: 1, assess: 2, hold: 3 };

const RING_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  adopt: "default",
  trial: "secondary",
  assess: "outline",
  hold: "destructive",
};

/** Tech Radar (RF3): tabela agrupada por quadrante, badge por anel, link p/ ADR. */
export default async function CockpitRadarPage() {
  const t = await getTranslations("viveiro.radar");

  const [radar, modules] = await Promise.all([
    getStackRadar(),
    getEngineeringModules(),
  ]);

  if (radar === null) return <MemoryUnavailable />;

  const quadrants = radar.quadrants.length > 0 ? radar.quadrants : [...KNOWN_QUADRANTS];
  // Quadrante desconhecido (dados evoluíram) não pode sumir da tela.
  const extraQuadrants = [
    ...new Set(radar.techs.map((tech) => tech.quadrant).filter((q) => !quadrants.includes(q))),
  ];
  const moduleIds = new Set((modules ?? []).map((m) => m.id));

  const ringLabel = (ring: string) =>
    (KNOWN_RINGS as readonly string[]).includes(ring) ? t(`rings.${ring}`) : ring;
  const quadrantLabel = (quadrant: string) =>
    (KNOWN_QUADRANTS as readonly string[]).includes(quadrant)
      ? t(`quadrants.${quadrant}`)
      : quadrant;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {t("count", { count: radar.techs.length })}
        {radar.updated_at ? ` · ${t("updatedAt", { date: radar.updated_at })}` : null}
      </p>

      {[...quadrants, ...extraQuadrants].map((quadrant) => {
        const techs = radar.techs
          .filter((tech) => tech.quadrant === quadrant)
          .sort(
            (a, b) =>
              (RING_ORDER[a.ring] ?? 99) - (RING_ORDER[b.ring] ?? 99) ||
              a.name.localeCompare(b.name),
          );
        if (techs.length === 0) return null;

        return (
          <Card key={quadrant}>
            <CardHeader>
              <CardTitle className="text-base">{quadrantLabel(quadrant)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-2 pr-4">{t("columns.tech")}</th>
                      <th className="py-2 pr-4">{t("columns.ring")}</th>
                      <th className="py-2 pr-4">{t("columns.note")}</th>
                      <th className="py-2">{t("columns.adr")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {techs.map((tech) => (
                      <tr key={tech.id} className="border-b border-border/60 align-top">
                        <td className="py-2 pr-4 font-medium whitespace-nowrap">
                          {tech.name}
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant={RING_BADGE_VARIANT[tech.ring] ?? "outline"}>
                            {ringLabel(tech.ring)}
                          </Badge>
                        </td>
                        <td className="max-w-lg py-2 pr-4 text-xs text-muted-foreground">
                          {tech.note || "—"}
                        </td>
                        <td className="py-2 font-mono text-xs">
                          <AdrRef adr={tech.adr} moduleIds={moduleIds} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Referência de ADR do radar (formato `ADR-XXXX@projeto`). Quando o projeto é
 * um módulo de engenharia interno, vira link para a aba Engenharia; ADRs de
 * projetos de cliente (ex.: rian-pje-trf1) ficam como texto — vivem fora
 * da memória interna.
 */
function AdrRef({ adr, moduleIds }: { adr: string; moduleIds: Set<string> }) {
  if (!adr) return <span className="text-muted-foreground">—</span>;
  const at = adr.indexOf("@");
  const project = at >= 0 ? adr.slice(at + 1) : "";
  if (project && moduleIds.has(project)) {
    return (
      <Link href="/viveiro/engenharia" className="text-primary hover:underline">
        {adr}
      </Link>
    );
  }
  return <span className="text-muted-foreground">{adr}</span>;
}
