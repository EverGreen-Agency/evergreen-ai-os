import { FormEvent, useState } from "react";
import {
  Activity,
  BarChart3,
  Cloud,
  GitBranch,
  KeyRound,
  Link,
  PenLine,
  Plus,
  RefreshCw,
  Search,
  Server,
  Tags,
  TrendingUp,
} from "lucide-react";
import { useUiStore } from "../store/uiStore";
import {
  useClients,
  useClientPortal,
  useCreatePerformanceConnection,
  useIntegrationsStatus,
  usePerformanceConnections,
  useRequestPerformanceSync,
  useSyncClickUp,
  useUpdatePerformanceConnection,
  useKommoConfig,
  useSetupKommoConfig,
} from "../hooks/useBiomaApi";
import { formatDateTime } from "../lib/format";
import type { PerformanceConnection, PerformanceProvider } from "../lib/api";
import { Briefcase } from "lucide-react";

// Tudo aqui é estado real: flags de ambiente vêm de /integrations/status,
// conexões de /clients/{id}/performance/connections e o ClickUp do portal.
// Meta/LinkedIn entram como novos providers no worker (roadmap), não como card fake.

const PROVIDER_META: Record<PerformanceProvider, {
  label: string;
  icon: typeof BarChart3;
  accountLabel: string;
  accountPlaceholder: string;
  parentLabel?: string;
  parentPlaceholder?: string;
}> = {
  google_ads: {
    label: "Google Ads",
    icon: BarChart3,
    accountLabel: "Customer ID",
    accountPlaceholder: "123-456-7890",
    parentLabel: "MCC (login customer id) — opcional",
    parentPlaceholder: "111-222-3333",
  },
  ga4: {
    label: "Google Analytics 4",
    icon: TrendingUp,
    accountLabel: "Property ID",
    accountPlaceholder: "123456789",
  },
  search_console: {
    label: "Search Console",
    icon: Search,
    accountLabel: "Propriedade",
    accountPlaceholder: "sc-domain:evergreenmkt.com.br",
  },
  gtm: {
    label: "Google Tag Manager",
    icon: Tags,
    accountLabel: "Container ID",
    accountPlaceholder: "GTM-XXXXXXX",
    parentLabel: "Account ID",
    parentPlaceholder: "6000000000",
  },
};

const PROVIDERS = Object.keys(PROVIDER_META) as PerformanceProvider[];

function EnvStatusPill({ configured }: { configured: boolean }) {
  return configured
    ? <span className="status-pill open">Configurado</span>
    : <span className="status-pill draft">Não configurado</span>;
}

function ConnectionStatusPill({ connection }: { connection: PerformanceConnection | null }) {
  if (!connection) return <span className="status-pill draft">Sem conexão</span>;
  if (connection.status === "error") return <span className="status-pill cancelled">Erro</span>;
  if (connection.status === "inactive") return <span className="status-pill paused">Inativa</span>;
  return <span className="status-pill open">Ativa</span>;
}

export function IntegrationsTab({
  clientId = null,
  scope = "all",
}: {
  clientId?: string | null;
  scope?: "all" | "environment" | "client";
} = {}) {
  const { selectedClientId: storedClientId, setSelectedClientId } = useUiStore();
  const selectedClientId = clientId ?? storedClientId;
  const { data: clients = [] } = useClients();
  const { data: portal } = useClientPortal(selectedClientId);
  const { data: envStatus } = useIntegrationsStatus();
  const { data: connections = [], isLoading: loadingConnections } = usePerformanceConnections(selectedClientId);

  const syncClickUp = useSyncClickUp();
  const createConnection = useCreatePerformanceConnection();
  const updateConnection = useUpdatePerformanceConnection();
  const requestSync = useRequestPerformanceSync();

  const [editingProvider, setEditingProvider] = useState<PerformanceProvider | null>(null);
  const [accountId, setAccountId] = useState("");
  const [parentId, setParentId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [syncFeedback, setSyncFeedback] = useState<string>("");

  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? null;
  const organizationId = selectedClient?.organization_id ?? null;

  const { data: kommoConfig, isLoading: loadingKommo } = useKommoConfig(organizationId);
  const setupKommo = useSetupKommoConfig();

  const [kommoClientId, setKommoClientId] = useState("");
  const [kommoClientSecret, setKommoClientSecret] = useState("");
  const [kommoAccessToken, setKommoAccessToken] = useState("");
  const [kommoSubdomain, setKommoSubdomain] = useState("");
  const [isEditingKommo, setIsEditingKommo] = useState(false);
  const clickupRun = portal?.sync_runs.find((run) => run.source === "clickup") ?? null;
  const connectionFor = (provider: PerformanceProvider) =>
    connections.find((connection) => connection.provider === provider) ?? null;

  function startEdit(provider: PerformanceProvider) {
    const existing = connectionFor(provider);
    setEditingProvider(provider);
    setAccountId(existing?.external_account_id ?? "");
    setParentId(existing?.external_parent_id ?? "");
    setDisplayName(existing?.display_name ?? "");
  }

  function cancelEdit() {
    setEditingProvider(null);
    setAccountId("");
    setParentId("");
    setDisplayName("");
  }

  function startEditKommo() {
    setIsEditingKommo(true);
    setKommoSubdomain(kommoConfig?.subdomain ?? "");
  }

  function cancelEditKommo() {
    setIsEditingKommo(false);
    setKommoClientId("");
    setKommoClientSecret("");
    setKommoAccessToken("");
    setKommoSubdomain("");
  }

  function handleSaveKommo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationId) return;
    setupKommo.mutate(
      {
        organizationId,
        payload: {
          client_id: kommoClientId.trim(),
          client_secret: kommoClientSecret.trim(),
          access_token: kommoAccessToken.trim(),
          subdomain: kommoSubdomain.trim(),
        },
      },
      { onSuccess: cancelEditKommo }
    );
  }

  function handleSaveConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClientId || !editingProvider || !accountId.trim()) return;
    const existing = connectionFor(editingProvider);
    const payload = {
      provider: editingProvider,
      external_account_id: accountId.trim(),
      external_parent_id: parentId.trim() || null,
      display_name: displayName.trim() || null,
    };
    const onSuccess = () => cancelEdit();
    if (existing) {
      updateConnection.mutate(
        { clientId: selectedClientId, connectionId: existing.id, payload },
        { onSuccess },
      );
    } else {
      createConnection.mutate({ clientId: selectedClientId, payload }, { onSuccess });
    }
  }

  function handleToggleStatus(connection: PerformanceConnection) {
    if (!selectedClientId) return;
    updateConnection.mutate({
      clientId: selectedClientId,
      connectionId: connection.id,
      payload: { status: connection.status === "active" ? "inactive" : "active" },
    });
  }

  function handleProviderSync(provider: PerformanceProvider) {
    if (!selectedClientId) return;
    setSyncFeedback("");
    requestSync.mutate(
      { clientId: selectedClientId, provider },
      {
        onSuccess: (run) => setSyncFeedback(
          `Sync de ${PROVIDER_META[provider].label} enfileirado (${run.status}). O worker processa fora da requisição.`,
        ),
      },
    );
  }

  const savingConnection = createConnection.isPending || updateConnection.isPending;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, gridColumn: "1 / -1" }}>
      {/* Ambiente (flags reais, somente leitura) */}
      {scope !== "client" && <section>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <Server size={18} /> Ambiente EverGreen
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "4px 0 0 0" }}>
            Estado real das credenciais deste ambiente ({envStatus?.app_env ?? "..."}). Configuração é feita por
            variáveis de ambiente no deploy, nunca pela interface.
          </p>
        </div>
        <div className="health-list">
          <div className="health-row">
            <GitBranch size={18} />
            <span>ClickUp API <small style={{ color: "var(--text-faint)" }}>· CLICKUP_API_TOKEN</small></span>
            {envStatus ? <EnvStatusPill configured={envStatus.clickup_token_configured} /> : <span className="status-pill draft">...</span>}
          </div>
          <div className="health-row">
            <Cloud size={18} />
            <span>Storage de arquivos (S3) <small style={{ color: "var(--text-faint)" }}>· STORAGE_S3_*</small></span>
            {envStatus ? <EnvStatusPill configured={envStatus.storage_configured} /> : <span className="status-pill draft">...</span>}
          </div>
          <div className="health-row">
            <KeyRound size={18} />
            <span>Login com Google (OAuth) <small style={{ color: "var(--text-faint)" }}>· GOOGLE_OAUTH_*</small></span>
            {envStatus ? <EnvStatusPill configured={envStatus.google_oauth_configured} /> : <span className="status-pill draft">...</span>}
          </div>
        </div>
      </section>}

      {/* Conexões por cliente */}
      {scope !== "environment" && <section>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={18} /> Conexões do cliente
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "4px 0 0 0" }}>
              Fontes de dados mapeadas por cliente. Meta Ads e LinkedIn entram como novos provedores após o Google.
            </p>
          </div>
          {!clientId && <label className="form-grid" style={{ minWidth: 220 }}>
            Cliente
            <select
              className="status-select"
              style={{ maxWidth: "none" }}
              value={selectedClientId ?? ""}
              onChange={(event) => setSelectedClientId(event.target.value || null)}
            >
              <option value="">— selecione —</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </label>}
        </div>

        {!selectedClient && <div className="empty-state compact">Selecione um cliente para gerenciar conexões.</div>}

        {selectedClient && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {/* ClickUp por cliente */}
            <article className="surface" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Link size={20} color="var(--accent)" />
                  <h4 style={{ margin: 0, fontSize: 15 }}>ClickUp</h4>
                </div>
                {selectedClient.clickup_folder_id
                  ? <span className="status-pill open">Mapeado</span>
                  : <span className="status-pill draft">Sem pasta</span>}
              </div>
              <p style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.4, margin: 0 }}>
                O ClickUp permanece como fonte de verdade. A sincronização manual lê tarefas e atualiza a projeção local do Bioma; nenhuma escrita externa é feita.
              </p>

              <div style={{ fontSize: 12, color: "var(--text-dim)", display: "grid", gap: 4 }}>
                <div>Pasta: <strong>{selectedClient.clickup_folder_id ?? "não mapeada (edite o cliente)"}</strong></div>
                <div>
                  Último sync:{" "}
                  <strong>
                    {clickupRun ? `${clickupRun.status} · ${formatDateTime(clickupRun.started_at)}` : "nunca executado"}
                  </strong>
                </div>
              </div>
              <button
                className="primary-button"
                style={{ padding: 8, fontSize: 13 }}
                type="button"
                onClick={() => syncClickUp.mutate(selectedClientId!)}
                disabled={!selectedClient.clickup_folder_id || syncClickUp.isPending}
              >
                <RefreshCw size={14} />
                {syncClickUp.isPending ? "Sincronizando..." : "Atualizar projeção do ClickUp"}
              </button>
            </article>

            {/* Kommo CRM */}
            <article className="surface" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Briefcase size={20} color={kommoConfig?.configured ? "var(--accent)" : "var(--text-dim)"} />
                  <h4 style={{ margin: 0, fontSize: 15 }}>Kommo CRM</h4>
                </div>
                {kommoConfig?.configured
                  ? <span className="status-pill open">Configurado</span>
                  : <span className="status-pill draft">Não configurado</span>}
              </div>

              {loadingKommo && <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Carregando...</div>}

              {!isEditingKommo && kommoConfig && (
                <div style={{ fontSize: 12, color: "var(--text-dim)", display: "grid", gap: 4 }}>
                  {kommoConfig.configured ? (
                    <>
                      <div>Subdomínio: <strong>{kommoConfig.subdomain}</strong></div>
                      <div style={{ color: "var(--text-muted)", marginTop: 8 }}>
                        Credenciais salvas e seguras no banco de dados.
                      </div>
                    </>
                  ) : (
                    <div>O Kommo não está configurado para a organização deste cliente.</div>
                  )}
                </div>
              )}

              {isEditingKommo && (
                <form className="form-grid" onSubmit={handleSaveKommo}>
                  <label>
                    Client ID (Integração)
                    <input
                      value={kommoClientId}
                      onChange={(e) => setKommoClientId(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Client Secret
                    <input
                      value={kommoClientSecret}
                      onChange={(e) => setKommoClientSecret(e.target.value)}
                      type="password"
                      required
                    />
                  </label>
                  <label>
                    Access Token (Longo prazo)
                    <input
                      value={kommoAccessToken}
                      onChange={(e) => setKommoAccessToken(e.target.value)}
                      type="password"
                      required
                    />
                  </label>
                  <label>
                    Subdomínio do Kommo (sem .kommo.com)
                    <input
                      value={kommoSubdomain}
                      onChange={(e) => setKommoSubdomain(e.target.value)}
                      placeholder="exemplo-empresa"
                      required
                    />
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="primary-button" type="submit" disabled={setupKommo.isPending} style={{ flex: 1, padding: 8, fontSize: 13 }}>
                      {setupKommo.isPending ? "Salvando..." : "Salvar"}
                    </button>
                    <button className="ghost-button" type="button" onClick={cancelEditKommo} style={{ padding: 8, fontSize: 13 }}>
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {!isEditingKommo && !loadingKommo && (
                <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
                  <button className="mini-button" type="button" onClick={startEditKommo}>
                    {kommoConfig?.configured ? <PenLine size={13} /> : <Plus size={13} />}
                    {kommoConfig?.configured ? "Editar credenciais" : "Configurar"}
                  </button>
                </div>
              )}
            </article>

            {/* Google providers (performance_connections reais) */}
            {PROVIDERS.map((provider) => {
              const meta = PROVIDER_META[provider];
              const Icon = meta.icon;
              const connection = connectionFor(provider);
              const isEditing = editingProvider === provider;
              return (
                <article key={provider} className="surface" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Icon size={20} color={connection?.status === "active" ? "var(--accent)" : "var(--text-dim)"} />
                      <h4 style={{ margin: 0, fontSize: 15 }}>{meta.label}</h4>
                    </div>
                    <ConnectionStatusPill connection={connection} />
                  </div>

                  {loadingConnections && <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Carregando...</div>}

                  {!isEditing && connection && (
                    <div style={{ fontSize: 12, color: "var(--text-dim)", display: "grid", gap: 4 }}>
                      <div>{meta.accountLabel}: <strong>{connection.external_account_id}</strong></div>
                      {connection.external_parent_id && <div>{meta.parentLabel ?? "Conta-pai"}: <strong>{connection.external_parent_id}</strong></div>}
                      {connection.display_name && <div>Nome: <strong>{connection.display_name}</strong></div>}
                      <div>
                        Último sync:{" "}
                        <strong>{connection.last_synced_at ? formatDateTime(connection.last_synced_at) : "nunca"}</strong>
                      </div>
                      {connection.last_error_message && (
                        <div style={{ color: "var(--danger-soft)" }}>Erro: {connection.last_error_message}</div>
                      )}
                      {!connection.credentials_configured && (
                        <div style={{ color: "var(--amber-soft)" }}>
                          Credencial Google (service account) ainda não configurada no worker.
                        </div>
                      )}
                    </div>
                  )}

                  {!isEditing && !connection && (
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                      Nenhuma conta {meta.label} mapeada para {selectedClient.name}.
                    </div>
                  )}

                  {isEditing && (
                    <form className="form-grid" onSubmit={handleSaveConnection}>
                      <label>
                        {meta.accountLabel}
                        <input
                          value={accountId}
                          onChange={(event) => setAccountId(event.target.value)}
                          placeholder={meta.accountPlaceholder}
                          required
                        />
                      </label>
                      {meta.parentLabel && (
                        <label>
                          {meta.parentLabel}
                          <input
                            value={parentId}
                            onChange={(event) => setParentId(event.target.value)}
                            placeholder={meta.parentPlaceholder}
                          />
                        </label>
                      )}
                      <label>
                        Nome de exibição (opcional)
                        <input
                          value={displayName}
                          onChange={(event) => setDisplayName(event.target.value)}
                          placeholder={`${meta.label} — ${selectedClient.name}`}
                        />
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="primary-button" type="submit" disabled={savingConnection} style={{ flex: 1, padding: 8, fontSize: 13 }}>
                          {savingConnection ? "Salvando..." : "Salvar conexão"}
                        </button>
                        <button className="ghost-button" type="button" onClick={cancelEdit} style={{ padding: 8, fontSize: 13 }}>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}

                  {!isEditing && (
                    <div style={{ marginTop: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="mini-button" type="button" onClick={() => startEdit(provider)}>
                        {connection ? <PenLine size={13} /> : <Plus size={13} />}
                        {connection ? "Editar" : "Conectar"}
                      </button>
                      {connection && (
                        <>
                          <button className="mini-button" type="button" onClick={() => handleToggleStatus(connection)} disabled={updateConnection.isPending}>
                            {connection.status === "active" ? "Desativar" : "Reativar"}
                          </button>
                          {connection.status === "active" && (
                            <button
                              className="mini-button approve"
                              type="button"
                              onClick={() => handleProviderSync(provider)}
                              disabled={requestSync.isPending}
                            >
                              <RefreshCw size={13} />
                              Sincronizar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {syncFeedback && <div className="form-success" style={{ marginTop: 12 }}>{syncFeedback}</div>}
      </section>}
    </div>
  );
}
