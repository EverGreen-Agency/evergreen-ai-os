import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Chip } from "@/components/os/chip";
import { Toolbar, ToolbarCount } from "@/components/os/toolbar";
import { ConsentForm } from "@/components/lgpd/consent-form";
import { PurposeForm } from "@/components/lgpd/purpose-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrg, getVisibleOrgs } from "@/server/active-org";
import { revokeConsentAction } from "@/server/actions/lgpd";
import { hasViveiroAccess } from "@/server/viveiro/access";

/** Cores por classe de dado (quanto mais sensível, mais quente). */
const CLASS_COLOR: Record<string, string> = {
  public: "#3ac97b",
  internal: "#8fb4a3",
  client: "#00d4ff",
  financial: "#ffab00",
  legal: "#ffab00",
  pii: "#ff6b5c",
  secret: "#ff6b5c",
  restricted_ai: "#a855f7",
};

const DATA_CLASSES = Object.keys(CLASS_COLOR);

/**
 * Governança de dados (mod-lgpd, fatia N&S): finalidades + consentimentos por
 * tenant e a regra de IA externa (gate em src/server/ai/policy.ts).
 */
export default async function GovernancaPage() {
  if (!(await hasViveiroAccess())) redirect("/");
  const t = await getTranslations("lgpd");

  const [org, orgs] = await Promise.all([getActiveOrg(), getVisibleOrgs()]);
  const activeOrg = org!;

  const supabase = await createSupabaseServerClient();
  const [{ data: purposes }, { data: consents }] = await Promise.all([
    supabase
      .from("processing_purposes")
      .select(
        "id, tenant_id, purpose, legal_basis, data_classes, external_ai_allowed, organizations:tenant_id (name)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("consents")
      .select("id, tenant_id, purpose_id, subject_label, granted, revoked_at")
      .order("created_at", { ascending: false }),
  ]);

  const purposeById = new Map((purposes ?? []).map((p) => [p.id, p]));

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <span className="text-muted-foreground">{t("hint")}</span>
        <ToolbarCount>
          {t("counts", {
            purposes: purposes?.length ?? 0,
            consents: consents?.filter((c) => c.granted).length ?? 0,
          })}
        </ToolbarCount>
      </Toolbar>

      {/* Regra de IA externa — as 8 classes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[13px]">{t("classes.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-[12px]">
          <div className="flex flex-wrap gap-1">
            {DATA_CLASSES.map((c) => (
              <Chip key={c} color={CLASS_COLOR[c]}>
                {c}
              </Chip>
            ))}
          </div>
          <p className="text-muted-foreground">{t("classes.rule")}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-4">
          {/* Finalidades */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[13px]">{t("purposes.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {purposes && purposes.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {purposes.map((p) => {
                    const orgName = Array.isArray(p.organizations)
                      ? p.organizations[0]?.name
                      : (p.organizations as { name: string } | null)?.name;
                    return (
                      <li
                        key={p.id}
                        className="rounded-md border border-border p-2.5 text-[12px]"
                      >
                        <p className="font-medium">{p.purpose}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {orgName ? <Chip color="#00d4ff">{orgName}</Chip> : null}
                          <Chip color="#8fb4a3">{p.legal_basis}</Chip>
                          {(p.data_classes ?? []).map((c: string) => (
                            <Chip key={c} color={CLASS_COLOR[c] ?? "#8fb4a3"}>
                              {c}
                            </Chip>
                          ))}
                          {p.external_ai_allowed ? (
                            <Chip color="#ffab00">{t("purposes.aiAllowed")}</Chip>
                          ) : (
                            <Chip color="#3ac97b">{t("purposes.aiBlocked")}</Chip>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-[12px] text-muted-foreground">{t("purposes.empty")}</p>
              )}
            </CardContent>
          </Card>

          {/* Consentimentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[13px]">{t("consents.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {consents && consents.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {consents.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5 text-[12px]"
                    >
                      <span>
                        <span className="font-mono">{c.subject_label}</span>{" "}
                        <span className="text-muted-foreground">
                          — {purposeById.get(c.purpose_id)?.purpose ?? c.purpose_id}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        {c.granted ? (
                          <>
                            <Chip color="#3ac97b">{t("consents.active")}</Chip>
                            <form action={revokeConsentAction}>
                              <input type="hidden" name="consentId" value={c.id} />
                              <input type="hidden" name="tenantId" value={c.tenant_id} />
                              <Button type="submit" size="sm" variant="outline">
                                {t("consents.revoke")}
                              </Button>
                            </form>
                          </>
                        ) : (
                          <Chip color="#ff6b5c">{t("consents.revoked")}</Chip>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] text-muted-foreground">{t("consents.empty")}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-[13px]">{t("purposes.formTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <PurposeForm
                orgs={orgs.map((o) => ({ id: o.id, name: o.name }))}
                defaultOrgId={activeOrg.id}
                dataClasses={DATA_CLASSES}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-[13px]">{t("consents.formTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ConsentForm
                purposes={(purposes ?? []).map((p) => ({
                  id: p.id,
                  tenantId: p.tenant_id,
                  label: p.purpose,
                }))}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
