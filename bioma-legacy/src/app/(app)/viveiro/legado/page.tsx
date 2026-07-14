import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  LEGACY_INVENTORY,
  type LegacyDecision,
} from "@/server/viveiro/legacy-inventory";

const DECISION_BADGE_VARIANT: Record<
  LegacyDecision,
  "default" | "secondary" | "outline" | "destructive"
> = {
  substituido: "default",
  portar: "secondary",
  manter_temporario: "outline",
  descartar: "destructive",
};

/**
 * Inventário do `dashboard/` Vite legado (RF8 / CA5 / CA6): cada área do
 * cockpit antigo com decisão final e URL equivalente no Bioma quando existir.
 * O dashboard antigo NÃO precisa estar rodando para nada desta página (CA7).
 */
export default async function CockpitLegacyPage() {
  const t = await getTranslations("viveiro.legacy");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t("intro")}</p>

      {/* TODO (corte futuro): edição do Banco de Ideias/Stack com schema
          validation + diff resumido + auditoria (CA2 da spec) — enquanto não
          existe, os itens de escrita ficam como "manter temporário". */}
      <Card>
        <CardContent className="flex items-start gap-3 pt-6">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("todoEditing")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4">{t("columns.area")}</th>
                  <th className="py-2 pr-4">{t("columns.legacyPath")}</th>
                  <th className="py-2 pr-4">{t("columns.decision")}</th>
                  <th className="py-2 pr-4">{t("columns.biomaUrl")}</th>
                  <th className="py-2">{t("columns.note")}</th>
                </tr>
              </thead>
              <tbody>
                {LEGACY_INVENTORY.map((item) => (
                  <tr key={item.id} className="border-b border-border/60 align-top">
                    <td className="max-w-56 py-2 pr-4 font-medium">{item.area}</td>
                    <td className="max-w-64 py-2 pr-4 font-mono text-xs text-muted-foreground">
                      {item.legacyPath}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant={DECISION_BADGE_VARIANT[item.decision]}>
                        {t(`decisions.${item.decision}`)}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {item.biomaUrl ? (
                        <Link
                          href={item.biomaUrl}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {item.biomaUrl}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="max-w-md py-2 text-xs text-muted-foreground">
                      {item.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
