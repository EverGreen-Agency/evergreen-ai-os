import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getEngineeringModules } from "@/server/viveiro/adapters";

import { MemoryUnavailable } from "../memory-unavailable";

/**
 * Engenharia (RF1 / CA1): módulos de `_memory/engenharia/` com spec, ADRs,
 * tasks e status lidos do cabeçalho de cada spec.md.
 */
export default async function CockpitEngineeringPage() {
  const t = await getTranslations("viveiro.engineering");
  const modules = await getEngineeringModules();

  if (modules === null) return <MemoryUnavailable />;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {t("count", { count: modules.length })}
      </p>

      <Card>
        <CardContent className="pt-6">
          {modules.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-4">{t("columns.module")}</th>
                    <th className="py-2 pr-4">{t("columns.spec")}</th>
                    <th className="py-2 pr-4">{t("columns.status")}</th>
                    <th className="py-2 pr-4">{t("columns.date")}</th>
                    <th className="py-2 pr-4">{t("columns.adrs")}</th>
                    <th className="py-2">{t("columns.tasks")}</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((mod) => (
                    <tr key={mod.id} className="border-b border-border/60 align-top">
                      <td className="py-2 pr-4 font-mono text-xs font-medium whitespace-nowrap">
                        {mod.id}
                      </td>
                      <td className="max-w-md py-2 pr-4">
                        {mod.hasSpec ? (
                          <span>{mod.specTitle ?? t("specUntitled")}</span>
                        ) : (
                          <span className="text-muted-foreground">{t("noSpec")}</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {mod.specStatus ? (
                          <Badge variant="outline">{mod.specStatus}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                        {mod.specDate ?? "—"}
                      </td>
                      <td className="py-2 pr-4">
                        {mod.adrCount > 0 ? (
                          <Badge variant="secondary">{mod.adrCount}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="py-2 text-xs">
                        {mod.hasTasks ? (
                          <Badge variant="secondary">{t("tasksYes")}</Badge>
                        ) : (
                          <span className="text-muted-foreground">{t("tasksNo")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">{t("sourceHint")}</p>
    </div>
  );
}
