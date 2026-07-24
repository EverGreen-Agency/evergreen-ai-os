import { FormEvent, useState } from "react";
import {
  Activity,
  BarChart3,
  Cloud,
  KeyRound,
  PenLine,
  Plus,
  RefreshCw,
  Search,
  Server,
  Tags,
  TrendingUp,
  Briefcase,
} from "lucide-react";
import { useUiStore } from "../store/uiStore";
import {
  useClients,
  useCreatePerformanceConnection,
  useIntegrationsStatus,
  usePerformanceConnections,
  useRequestPerformanceSync,
  useUpdatePerformanceConnection,
  useKommoConfig,
  useSetupKommoConfig,
} from "../hooks/useBiomaApi";
import { formatDateTime } from "../lib/format";
import type { PerformanceConnection, PerformanceProvider } from "../lib/api";
import { WhatsAppManager } from "./WhatsAppManager";

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
  const { data: envStatus } = useIntegrationsStatus();
  const { data: connections = [], isLoading: loadingConnections } = usePerformanceConnections(selectedClientId);

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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border-color, rgba(255,255,255,0.15))",
    background: "var(--surface-sunken, #0F172A)",
    color: "var(--text-normal, #F8FAFC)",
    fontSize: "13px",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, gridColumn: "1 / -1", width: "100%" }}>
      {/* Ambiente (flags reais, somente leitura) */}
      {scope !== "client" && (
        <section>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, color: "var(--text-normal, #F8FAFC)" }}>
              <Server size={18} /> Ambiente EverGreen
            </h3>
            <p style={{ color: "var(--text-muted, #94A3B8)", fontSize: 14, margin: "4px 0 0 0" }}>
              Estado real das credenciais deste ambiente ({envStatus?.app_env ?? "..."}). Configuração é feita por
              variáveis de ambiente no deploy, nunca pela interface.
            </p>
          </div>
          <div className="health-list">
            <div className="health-row">
              <Cloud size={18} />
              <span>Storage de arquivos (S3) <small style={{ color: "var(--text-faint, #64748B)" }}>· STORAGE_S3_*</small></span>
              {envStatus ? <EnvStatusPill configured={envStatus.storage_configured} /> : <span className="status-pill draft">...</span>}
            </div>
            <div className="health-row">
              <KeyRound size={18} />
              <span>Login com Google (OAuth) <small style={{ color: "var(--text-faint, #64748B)" }}>· GOOGLE_OAUTH_*</small></span>
              {envStatus ? <EnvStatusPill configured={envStatus.google_oauth_configured} /> : <span className="status-pill draft">...</span>}
            </div>
          </div>
        </section>
      )}

      {/* Conexões por cliente */}
      {scope !== "environment" && (
        <section>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, color: "var(--text-normal, #F8FAFC)" }}>
                <Activity size={18} /> Conexões do cliente
              </h3>
              <p style={{ color: "var(--text-muted, #94A3B8)", fontSize: 14, margin: "4px 0 0 0" }}>
                Fontes de dados e integrações ativas por cliente.
              </p>
            </div>
            {!clientId && (
              <label className="form-grid" style={{ minWidth: 220 }}>
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
              </label>
            )}
          </div>

          {!selectedClient && <div className="empty-state compact">Selecione um cliente para gerenciar conexões.</div>}

          {selectedClient && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* WhatsApp Multi-provider Section */}
              <WhatsAppManager workspaceId={selectedClient.id} />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                {/* Kommo CRM */}
                <article className="surface" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Briefcase size={20} color={kommoConfig?.configured ? "var(--brand-accent, #3B82F6)" : "var(--text-dim, #64748B)"} />
                      <h4 style={{ margin: 0, fontSize: 15, color: "var(--text-normal, #F8FAFC)" }}>Kommo CRM</h4>
                    </div>
                    {kommoConfig?.configured
                      ? <span className="status-pill open">Configurado</span>
                      : <span className="status-pill draft">Não configurado</span>}
                  </div>

                  {loadingKommo && <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Carregando...</div>}

                  {!isEditingKommo && kommoConfig && (
                    <div style={{ fontSize: 12, color: "var(--text-muted)", display: "grid", gap: 4 }}>
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
                    <form onSubmit={handleSaveKommo} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>Client ID</label>
                        <input
                          value={kommoClientId}
                          onChange={(e) => setKommoClientId(e.target.value)}
                          style={inputStyle}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>Client Secret</label>
                        <input
                          value={kommoClientSecret}
                          onChange={(e) => setKommoClientSecret(e.target.value)}
                          type="password"
                          style={inputStyle}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>Access Token</label>
                        <input
                          value={kommoAccessToken}
                          onChange={(e) => setKommoAccessToken(e.target.value)}
                          type="password"
                          style={inputStyle}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>Subdomínio Kommo</label>
                        <input
                          value={kommoSubdomain}
                          onChange={(e) => setKommoSubdomain(e.target.value)}
                          placeholder="exemplo-empresa"
                          style={inputStyle}
                          required
                        />
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
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
                    <div style={{ marginTop: "auto", display: "flex", gap: 8, paddingTop: 8 }}>
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
                          <Icon size={20} color={connection?.status === "active" ? "var(--brand-accent, #3B82F6)" : "var(--text-dim, #64748B)"} />
                          <h4 style={{ margin: 0, fontSize: 15, color: "var(--text-normal, #F8FAFC)" }}>{meta.label}</h4>
                        </div>
                        <ConnectionStatusPill connection={connection} />
                      </div>

                      {loadingConnections && <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Carregando...</div>}

                      {!isEditing && connection && (
                        <div style={{ fontSize: 12, color: "var(--text-muted)", display: "grid", gap: 4 }}>
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
                        <form onSubmit={handleSaveConnection} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <div>
                            <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>{meta.accountLabel}</label>
                            <input
                              value={accountId}
                              onChange={(event) => setAccountId(event.target.value)}
                              placeholder={meta.accountPlaceholder}
                              style={inputStyle}
                              required
                            />
                          </div>
                          {meta.parentLabel && (
                            <div>
                              <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>{meta.parentLabel}</label>
                              <input
                                value={parentId}
                                onChange={(event) => setParentId(event.target.value)}
                                placeholder={meta.parentPlaceholder}
                                style={inputStyle}
                              />
                            </div>
                          )}
                          <div>
                            <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>Nome de exibição</label>
                            <input
                              value={displayName}
                              onChange={(event) => setDisplayName(event.target.value)}
                              placeholder={`${meta.label} — ${selectedClient.name}`}
                              style={inputStyle}
                            />
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
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
                        <div style={{ marginTop: "auto", display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 8 }}>
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
            </div>
          )}

          {syncFeedback && <div className="form-success" style={{ marginTop: 12 }}>{syncFeedback}</div>}
        </section>
      )}
    </div>
  );
}
