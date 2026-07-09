import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { MemberForm } from "@/components/member-form";
import { OrgForm } from "@/components/org-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { setOrgStatusAction } from "@/server/actions/orgs";
import { isPlatformSuperAdmin } from "@/server/authz";

/** Painel do super-admin EG (CA2: só super-admin lista todos os tenants). */
export default async function AdminPage() {
  if (!(await isPlatformSuperAdmin())) redirect("/");

  const t = await getTranslations("admin");
  const supabase = await createSupabaseServerClient();

  const [{ data: orgs }, { data: auditRows }] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug, org_type, status, parent_org_id")
      .order("created_at"),
    supabase
      .from("audit_logs")
      .select("id, created_at, actor_user_id, action, resource_type, resource_id, tenant_id")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const orgById = new Map((orgs ?? []).map((o) => [o.id, o]));

  async function suspendAction(formData: FormData) {
    "use server";
    await setOrgStatusAction({}, formData);
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("orgs.createTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <OrgForm
              parents={(orgs ?? []).map((o) => ({ id: o.id, name: o.name }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("members.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <MemberForm
              orgs={(orgs ?? []).map((o) => ({ id: o.id, name: o.name }))}
            />
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>{t("orgs.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-4">{t("orgs.name")}</th>
                    <th className="py-2 pr-4">{t("orgs.slug")}</th>
                    <th className="py-2 pr-4">{t("orgs.type")}</th>
                    <th className="py-2 pr-4">{t("orgs.parent")}</th>
                    <th className="py-2 pr-4">{t("orgs.status")}</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {(orgs ?? []).map((o) => (
                    <tr key={o.id} className="border-b border-border/60">
                      <td className="py-2 pr-4 font-medium">{o.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{o.slug}</td>
                      <td className="py-2 pr-4">{t(`orgs.types.${o.org_type}`)}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {o.parent_org_id ? orgById.get(o.parent_org_id)?.name ?? "—" : "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant={o.status === "active" ? "secondary" : "destructive"}>
                          {o.status === "active" ? t("orgs.active") : t("orgs.suspended")}
                        </Badge>
                      </td>
                      <td className="py-2 text-right">
                        {o.org_type !== "platform" ? (
                          <form action={suspendAction}>
                            <input type="hidden" name="orgId" value={o.id} />
                            <input
                              type="hidden"
                              name="status"
                              value={o.status === "active" ? "suspended" : "active"}
                            />
                            <Button
                              type="submit"
                              size="sm"
                              variant={o.status === "active" ? "destructive" : "secondary"}
                            >
                              {o.status === "active" ? t("orgs.suspend") : t("orgs.reactivate")}
                            </Button>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>{t("audit.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {auditRows && auditRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-2 pr-4">{t("audit.when")}</th>
                      <th className="py-2 pr-4">{t("audit.action")}</th>
                      <th className="py-2 pr-4">{t("audit.resource")}</th>
                      <th className="py-2">{t("audit.actor")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditRows.map((a) => (
                      <tr key={a.id} className="border-b border-border/60">
                        <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                          {new Date(a.created_at).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs">{a.action}</td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {a.resource_type ?? "—"}
                        </td>
                        <td className="py-2 font-mono text-xs text-muted-foreground">
                          {a.actor_user_id ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("audit.empty")}</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
