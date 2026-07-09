import { getTranslations } from "next-intl/server";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getArchitectureDecisions,
  getArchitecturePrinciples,
  getExternalToolsSections,
} from "@/server/viveiro/adapters";

import { MemoryUnavailable } from "../memory-unavailable";

/**
 * Arquitetura: decisões D1–D7 + princípios (banco_arquitetura/arquitetura.md)
 * e ferramentas externas (ferramentas-externas.md), como texto simples por
 * seção — render markdown rico fica para um corte futuro.
 */
export default async function CockpitArchitecturePage() {
  const t = await getTranslations("viveiro.architecture");

  const [decisions, principles, toolsSections] = await Promise.all([
    getArchitectureDecisions(),
    getArchitecturePrinciples(),
    getExternalToolsSections(),
  ]);

  if (decisions === null && principles === null && toolsSections === null) {
    return <MemoryUnavailable />;
  }

  return (
    <div className="flex flex-col gap-8">
      {principles && principles.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-medium">{t("principlesTitle")}</h2>
          <Card>
            <CardContent className="pt-6">
              <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
                {principles.map((principle) => (
                  <li key={principle}>{principle}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-medium">{t("decisionsTitle")}</h2>
        {decisions && decisions.length > 0 ? (
          <div className="grid gap-4">
            {decisions.map((decision) => (
              <Card key={decision.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    <span className="mr-2 font-mono text-primary">{decision.id}</span>
                    {decision.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {decision.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("decisionsEmpty")}</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">{t("toolsTitle")}</h2>
        <p className="mb-3 text-sm text-muted-foreground">{t("toolsHint")}</p>
        {toolsSections && toolsSections.length > 0 ? (
          <div className="grid gap-4">
            {toolsSections.map((section) => (
              <Card key={section.title}>
                <CardHeader>
                  <CardTitle className="text-base">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <pre className="text-xs leading-relaxed whitespace-pre text-muted-foreground">
                      {section.body}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("toolsEmpty")}</p>
        )}
      </section>
    </div>
  );
}
