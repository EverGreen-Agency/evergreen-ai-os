import { getTranslations } from "next-intl/server";

import { CredentialForm } from "@/components/vault/credential-form";
import { CredentialRow } from "@/components/vault/credential-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrg } from "@/server/active-org";
import { getMyMemberships, isPlatformSuperAdmin } from "@/server/authz";

/** Cofre de acessos (cofre-senhas P0.5): metadados na listagem, segredo só via reveal. */
export default async function VaultPage() {
  const t = await getTranslations("vault");
  const org = (await getActiveOrg())!; // layout garante org ativa

  const [memberships, superAdmin] = await Promise.all([
    getMyMemberships(),
    isPlatformSuperAdmin(),
  ]);
  // Permissões efetivas no tenant ativo (membership direta OU tenant_admin
  // ancestral — mesma regra do app.has_permission; o RLS revalida tudo).
  const perms = new Set(
    memberships
      .filter((m) => m.orgId === org.id || m.roleKey === "tenant_admin")
      .flatMap((m) => m.permissions),
  );
  const canRead = superAdmin || perms.has("vault.read");
  const canManage = superAdmin || perms.has("vault.manage");
  const canReveal = superAdmin || perms.has("vault.reveal");

  if (!canRead) {
    // Sem vault.read: nada a mostrar (o RLS devolveria vazio de todo jeito).
    return (
      <p className="text-muted-foreground">{t("empty")}</p>
    );
  }

  const supabase = await createSupabaseServerClient();
  // Listagem NUNCA seleciona colunas de segredo (RNF: segredo não retorna em listagem).
  const { data: credentials } = await supabase
    .from("vault_credentials")
    .select("id, platform, label, status, updated_at")
    .eq("tenant_id", org.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardContent className="pt-6">
            {credentials && credentials.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-2 pr-4">{t("columns.platform")}</th>
                      <th className="py-2 pr-4">{t("columns.label")}</th>
                      <th className="py-2 pr-4">{t("columns.status")}</th>
                      <th className="py-2 pr-4">{t("columns.updated")}</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {credentials.map((c) => (
                      <CredentialRow
                        key={c.id}
                        credential={{
                          id: c.id,
                          platform: c.platform,
                          label: c.label,
                          status: c.status,
                          updatedAt: c.updated_at,
                        }}
                        tenantId={org.id}
                        canReveal={canReveal}
                        canManage={canManage}
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

        {canManage ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("form.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CredentialForm tenantId={org.id} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
