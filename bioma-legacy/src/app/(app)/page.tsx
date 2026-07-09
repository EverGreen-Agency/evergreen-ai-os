import { getTranslations } from "next-intl/server";
import { BarChart3, BookOpen, Users, Wallet } from "lucide-react";

import { NoteForm } from "@/components/note-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrg } from "@/server/active-org";
import { deleteNoteAction } from "@/server/actions/notes";
import { getMyMemberships, requireUser } from "@/server/authz";

export default async function TenantLandingPage() {
  const t = await getTranslations("landing");
  const tAdmin = await getTranslations("admin.orgs.types");
  const user = await requireUser();
  const org = (await getActiveOrg())!; // layout garante

  const supabase = await createSupabaseServerClient();
  const [{ data: profile }, { data: notes }, memberships] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("notes")
      .select("id, title, body, created_at")
      .eq("tenant_id", org.id)
      .order("created_at", { ascending: false })
      .limit(10),
    getMyMemberships(),
  ]);

  const canWriteNotes =
    memberships.some(
      (m) =>
        m.permissions.includes("notes.write") &&
        (m.orgId === org.id || m.roleKey === "tenant_admin"),
    ) || memberships.some((m) => m.roleKey === "super_admin");

  const modules = [
    { icon: Users, name: t("modules.clientHub"), desc: t("modules.clientHubDesc") },
    { icon: BarChart3, name: t("modules.bi"), desc: t("modules.biDesc") },
    { icon: Wallet, name: t("modules.financeiro"), desc: t("modules.financeiroDesc") },
    { icon: BookOpen, name: t("modules.conhecimento"), desc: t("modules.conhecimentoDesc") },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-semibold">
          {t("welcome", { name: profile?.display_name ?? user.email ?? "—" })}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("orgContext")} <span className="font-medium text-foreground">{org.name}</span>{" "}
          <Badge variant="outline">{tAdmin(org.orgType)}</Badge>
        </p>
      </section>

      {/* Placeholder de onde os módulos futuros vão morar (spec §3). */}
      <section>
        <h2 className="mb-3 text-lg font-medium">{t("modulesTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((m) => (
            <Card key={m.name} className="opacity-70">
              <CardHeader>
                <m.icon className="size-5 text-primary" />
                <CardTitle className="text-base">{m.name}</CardTitle>
                <CardDescription>{m.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">{t("modulesSoon")}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Dado de produto real do tenant — o padrão que os módulos vão copiar. */}
      <section>
        <h2 className="mb-3 text-lg font-medium">{t("notes.title")}</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              {notes && notes.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {notes.map((n) => (
                    <li
                      key={n.id}
                      className="flex items-start justify-between gap-3 rounded-md border border-border p-3"
                    >
                      <div>
                        <p className="font-medium">{n.title}</p>
                        {n.body ? (
                          <p className="text-sm text-muted-foreground">{n.body}</p>
                        ) : null}
                      </div>
                      {canWriteNotes ? (
                        <form action={deleteNoteAction}>
                          <input type="hidden" name="noteId" value={n.id} />
                          <input type="hidden" name="tenantId" value={org.id} />
                          <Button variant="ghost" size="sm" type="submit">
                            ×
                          </Button>
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t("notes.empty")}</p>
              )}
            </CardContent>
          </Card>
          {canWriteNotes ? <NoteForm tenantId={org.id} /> : null}
        </div>
      </section>
    </div>
  );
}
