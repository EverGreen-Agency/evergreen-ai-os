import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Chip } from "@/components/os/chip";
import { StatusDot } from "@/components/os/status-dot";
import { Toolbar, ToolbarCount } from "@/components/os/toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { setIncidentStatusAction } from "@/server/actions/observability";
import { isPlatformSuperAdmin } from "@/server/authz";
import { runHealthChecks } from "@/server/observability/incidents";
import { hasViveiroAccess } from "@/server/viveiro/access";

const SEVERITY_COLOR: Record<string, string> = {
  info: "#00d4ff",
  warning: "#ffab00",
  critical: "#ff6b5c",
};

const STATUS_COLOR: Record<string, string> = {
  open: "#ff6b5c",
  acknowledged: "#ffab00",
  resolved: "#3ac97b",
};

export const dynamic = "force-dynamic";

/** Status da plataforma (mod-observabilidade): health ao vivo + incidentes. */
export default async function StatusPage() {
  if (!(await hasViveiroAccess())) redirect("/");
  const t = await getTranslations("observabilidade");

  const [health, superAdmin] = await Promise.all([
    runHealthChecks(),
    isPlatformSuperAdmin(),
  ]);

  const supabase = await createSupabaseServerClient();
  const { data: incidents } = await supabase
    .from("incidents")
    .select("id, tenant_id, source, severity, status, title, correlation_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const openCount = (incidents ?? []).filter((i) => i.status === "open").length;

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <StatusDot
          color={health.status === "ok" ? "#3ac97b" : health.status === "degraded" ? "#ffab00" : "#ff6b5c"}
          pulse={health.status !== "ok"}
          title={health.status}
        />
        <span className="font-semibold uppercase tracking-wide">
          {t(`health.${health.status}`)}
        </span>
        <Chip color={health.checks.db ? "#3ac97b" : "#ff6b5c"}>postgres</Chip>
        <Chip color={health.checks.redis ? "#3ac97b" : "#ffab00"}>redis</Chip>
        <ToolbarCount>{t("openCount", { count: openCount })}</ToolbarCount>
      </Toolbar>

      <Card>
        <CardHeader>
          <CardTitle className="text-[13px]">{t("incidents.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {incidents && incidents.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {incidents.map((inc) => (
                <li
                  key={inc.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5 text-[12px]"
                >
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Chip color={SEVERITY_COLOR[inc.severity] ?? "#8fb4a3"}>
                      {inc.severity}
                    </Chip>
                    <Chip color={STATUS_COLOR[inc.status] ?? "#8fb4a3"}>
                      {t(`status.${inc.status}`)}
                    </Chip>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {inc.source}
                    </span>
                    <span className="font-medium">{inc.title}</span>
                    {inc.correlation_id ? (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        corr:{inc.correlation_id}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                      {new Date(inc.created_at).toLocaleString()}
                    </span>
                    {superAdmin && inc.status !== "resolved" ? (
                      <>
                        {inc.status === "open" ? (
                          <form action={setIncidentStatusAction}>
                            <input type="hidden" name="incidentId" value={inc.id} />
                            <input type="hidden" name="next" value="acknowledged" />
                            <Button type="submit" size="sm" variant="outline">
                              {t("actions.ack")}
                            </Button>
                          </form>
                        ) : null}
                        <form action={setIncidentStatusAction}>
                          <input type="hidden" name="incidentId" value={inc.id} />
                          <input type="hidden" name="next" value="resolved" />
                          <Button type="submit" size="sm" variant="secondary">
                            {t("actions.resolve")}
                          </Button>
                        </form>
                      </>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-muted-foreground">{t("incidents.empty")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
