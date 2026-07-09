import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  FileText,
  GitBranch,
  LayoutDashboard,
  LockKeyhole,
  LogIn,
  LogOut,
  Search,
  Server,
  ShieldCheck,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  api,
  type ApiHealth,
  type ArtifactSummary,
  type ClientPortal,
  type ClientSummary,
  type CurrentUser,
  type DeliverableStatus,
  type DeliverableSummary,
} from "./lib/api";

const navItems = [
  { label: "Cockpit", icon: LayoutDashboard },
  { label: "Clientes", icon: Users },
  { label: "Engenharia", icon: FileText },
  { label: "Integrações", icon: GitBranch },
];

const integrations = [
  { name: "ClickUp", status: "prioridade", detail: "sincronização read-only primeiro" },
  { name: "Drive", status: "próximo", detail: "links e arquivos do cliente" },
  { name: "Ads", status: "backlog", detail: "snapshots de performance" },
  { name: "Autentique", status: "backlog", detail: "contratos e assinaturas" },
];

const statusLabel: Record<ClientSummary["status"], string> = {
  onboarding: "Onboarding",
  active: "Ativo",
  paused: "Pausado",
  archived: "Arquivado",
};

const deliverableStatusLabel: Record<DeliverableSummary["status"], string> = {
  planned: "Planejado",
  in_progress: "Em execução",
  waiting_approval: "Aguardando aprovação",
  done: "Concluído",
  blocked: "Bloqueado",
};

export function App() {
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [email, setEmail] = useState("eduardo@evergreengrowth.com.br");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [portal, setPortal] = useState<ClientPortal | null>(null);
  const [dataError, setDataError] = useState("");
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactSummary | null>(null);

  const apiOnline = health?.status === "ok";
  const activeOrg = user?.organizations[0] ?? null;
  const selectedClient = portal?.client ?? clients.find((client) => client.id === selectedClientId) ?? null;
  const isEgAdmin = user?.organizations.some((organization) => organization.slug === "eg" && organization.role === "eg_admin") ?? false;
  const latestSync = portal?.sync_runs[0] ?? null;

  const metrics = useMemo(
    () => [
      {
        label: "Clientes",
        value: String(clients.length),
        delta: clients.length === 1 ? "1 conta ativa no MVP" : "carteira conectada",
        tone: "green",
      },
      {
        label: "Aprovações",
        value: String(portal?.approvals.filter((approval) => approval.status === "pending").length ?? 0),
        delta: "pendências do cliente",
        tone: "amber",
      },
      {
        label: "Artefatos",
        value: String(portal?.artifacts.length ?? 0),
        delta: "briefing, brand book, mapas",
        tone: "mint",
      },
    ],
    [clients.length, portal],
  );

  useEffect(() => {
    api
      .health()
      .then(setHealth)
      .catch(() => setHealth(null));

    api
      .me()
      .then(setUser)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) {
      setClients([]);
      setSelectedClientId(null);
      setPortal(null);
      return;
    }

    setDataError("");
    api
      .clients()
      .then((data) => {
        setClients(data);
        setSelectedClientId((current) => current ?? data[0]?.id ?? null);
      })
      .catch((error: Error) => setDataError(error.message));
  }, [user]);

  useEffect(() => {
    if (!selectedClientId) {
      setPortal(null);
      return;
    }

    setLoadingPortal(true);
    setDataError("");
    api
      .clientPortal(selectedClientId)
      .then(setPortal)
      .catch((error: Error) => setDataError(error.message))
      .finally(() => setLoadingPortal(false));
  }, [selectedClientId]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      setPassword("");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Credenciais inválidas ou banco não migrado.");
    }
  }

  async function handleLogout() {
    await api.logout().catch(() => {});
    setUser(null);
  }

  async function refreshClients() {
    if (!user) return;
    const data = await api.clients();
    setClients(data);
  }

  async function handleApprovalDecision(approvalId: string, status: "approved" | "rejected") {
    if (!selectedClientId) return;
    const actionKey = `${approvalId}:${status}`;
    setActionBusy(actionKey);
    setDataError("");
    try {
      const data = await api.decideApproval(selectedClientId, approvalId, status);
      setPortal(data);
      await refreshClients();
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Não foi possível decidir a aprovação.");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleDeliverableStatus(deliverableId: string, status: DeliverableStatus) {
    if (!selectedClientId) return;
    const actionKey = `${deliverableId}:${status}`;
    setActionBusy(actionKey);
    setDataError("");
    try {
      const data = await api.updateDeliverableStatus(selectedClientId, deliverableId, status);
      setPortal(data);
      await refreshClients();
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Não foi possível atualizar a entrega.");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleClickUpSync() {
    if (!selectedClientId) return;
    setActionBusy("clickup-sync");
    setDataError("");
    try {
      const data = await api.syncClickUp(selectedClientId);
      setPortal(data);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Não foi possível sincronizar o ClickUp.");
    } finally {
      setActionBusy(null);
    }
  }

  if (!user) {
    return (
      <main className="login-shell">
        <section className="login-copy">
          <div className="brand large">
            <div className="brand-mark">EG</div>
            <div>
              <strong>Bioma</strong>
              <span>EverGreen</span>
            </div>
          </div>
          <h1>Operação e cliente no mesmo lugar.</h1>
          <div className="login-proof">
            <div>
              <Users size={20} />
              <span>Client Hub</span>
            </div>
            <div>
              <GitBranch size={20} />
              <span>ClickUp Bridge</span>
            </div>
            <div>
              <ShieldCheck size={20} />
              <span>Controle EG</span>
            </div>
          </div>
        </section>

        <section className="login-card" aria-label="Entrar no Bioma">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Acesso</p>
              <h2>Entrar no Bioma</h2>
            </div>
            <LockKeyhole size={24} />
          </div>
          <form className="login-form" onSubmit={handleLogin}>
            <label>
              E-mail
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
            </label>
            <label>
              Senha
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
            </label>
            {loginError && <span className="form-error">{loginError}</span>}
            <button type="submit">
              <LogIn size={18} />
              Entrar
            </button>
          </form>
          <div className="login-health">
            <span className={apiOnline ? "dot online" : "dot"} />
            {apiOnline ? "API online" : "API offline"}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navegação principal">
        <div className="brand">
          <div className="brand-mark">EG</div>
          <div>
            <strong>Bioma</strong>
            <span>MVP v0</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <a href={`#${item.label.toLowerCase()}`} className={index === 0 ? "active" : ""} key={item.label}>
                <Icon size={18} />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <span className={apiOnline ? "dot online" : "dot"} />
          <div>
            <strong>{apiOnline ? "API online" : "API offline"}</strong>
            <span>{apiOnline ? "FastAPI + Postgres" : "health indisponível"}</span>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <p className="eyebrow">Cockpit operacional</p>
            <h1>Bioma EG</h1>
          </div>
          <div className="search-shell">
            <Search size={18} />
            <span>Clientes, specs, entregas e integrações</span>
          </div>
        </header>

        {dataError && <div className="notice error">{dataError}</div>}

        <section className="hero-grid">
          <article className="command-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Sessão</p>
                <h2>{user ? user.display_name : "Entrar no Bioma"}</h2>
              </div>
              <LockKeyhole size={24} />
            </div>

            {user ? (
              <div className="session-card">
                <strong>{activeOrg?.name ?? "EverGreen"}</strong>
                <span>{user.email}</span>
                <small>{activeOrg?.role === "eg_admin" ? "EG admin" : "Cliente"}</small>
                <button className="ghost-button" type="button" onClick={handleLogout}>
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            ) : (
              <form className="login-form" onSubmit={handleLogin}>
                <label>
                  E-mail
                  <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
                </label>
                <label>
                  Senha
                  <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
                </label>
                {loginError && <span className="form-error">{loginError}</span>}
                <button type="submit">
                  <LogIn size={18} />
                  Entrar
                </button>
              </form>
            )}
          </article>

          <section className="metrics" aria-label="Indicadores iniciais">
            {metrics.map((metric) => (
              <article className={`metric-card ${metric.tone}`} key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.delta}</small>
              </article>
            ))}
          </section>
        </section>

        <section className="client-layout" id="clientes">
          <article className="surface client-list-panel">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">Client Hub</p>
                <h2>Carteira</h2>
              </div>
              <Users size={22} />
            </div>

            {!user && <EmptyState text="Entre para carregar a carteira EG." />}
            {user && clients.length === 0 && <EmptyState text="Nenhum cliente disponível para esta sessão." />}
            <div className="client-list">
              {clients.map((client) => (
                <button
                  className={client.id === selectedClientId ? "client-card selected" : "client-card"}
                  key={client.id}
                  type="button"
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <span className={`status-pill ${client.status}`}>{statusLabel[client.status]}</span>
                  <strong>{client.name}</strong>
                  <small>{client.responsible_name ?? "Sem responsável"}</small>
                  <div className="client-card-meta">
                    <span>{client.deliverables_total} entregas</span>
                    <span>{client.approvals_pending} aprovações</span>
                  </div>
                </button>
              ))}
            </div>
          </article>

          <article className="surface hub-panel">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">Hub do cliente</p>
                <h2>{selectedClient?.name ?? "Selecione um cliente"}</h2>
              </div>
              <ClipboardCheck size={22} />
            </div>

            {loadingPortal && <EmptyState text="Carregando hub..." />}
            {!loadingPortal && selectedClient && portal && (
              <div className="hub-grid">
                <section className="hub-block highlight">
                  <div>
                    <span className={`status-pill ${selectedClient.status}`}>{statusLabel[selectedClient.status]}</span>
                    <h3>{selectedClient.organization_name}</h3>
                    <p>
                      Responsável: <strong>{selectedClient.responsible_name ?? "não definido"}</strong>
                    </p>
                  </div>
                  <div className="sync-summary">
                    <GitBranch size={18} />
                    <span>{clickUpSummary(selectedClient.clickup_folder_id, latestSync?.status)}</span>
                    {isEgAdmin && (
                      <button
                        className="sync-button"
                        type="button"
                        onClick={handleClickUpSync}
                        disabled={actionBusy === "clickup-sync"}
                      >
                        Sincronizar
                      </button>
                    )}
                  </div>
                </section>

                <HubBlock title="Entregáveis" icon={CalendarCheck}>
                  {portal.deliverables.map((deliverable) => (
                    <div className="work-row" key={deliverable.id}>
                      <CircleDashed size={16} />
                      <div>
                        <strong>{deliverable.title}</strong>
                        <small>{deliverableStatusLabel[deliverable.status]}</small>
                      </div>
                      <div className="row-tail">
                        <span>{formatDueDate(deliverable.due_at)}</span>
                        {isEgAdmin && (
                          <select
                            className="status-select"
                            value={deliverable.status}
                            onChange={(event) =>
                              handleDeliverableStatus(deliverable.id, event.target.value as DeliverableStatus)
                            }
                            disabled={Boolean(actionBusy)}
                            aria-label={`Status de ${deliverable.title}`}
                          >
                            {Object.entries(deliverableStatusLabel).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </HubBlock>

                <HubBlock title="Aprovações" icon={CheckCircle2}>
                  {portal.approvals.map((approval) => (
                    <div className="work-row" key={approval.id}>
                      <AlertCircle size={16} />
                      <div>
                        <strong>{approval.deliverable_title ?? "Aprovação"}</strong>
                        <small>{approval.comment ?? "Sem comentário"}</small>
                      </div>
                      {approval.status === "pending" ? (
                        <div className="row-actions">
                          <button
                            className="mini-button approve"
                            type="button"
                            onClick={() => handleApprovalDecision(approval.id, "approved")}
                            disabled={Boolean(actionBusy)}
                          >
                            Aprovar
                          </button>
                          <button
                            className="mini-button reject"
                            type="button"
                            onClick={() => handleApprovalDecision(approval.id, "rejected")}
                            disabled={Boolean(actionBusy)}
                          >
                            Reprovar
                          </button>
                        </div>
                      ) : (
                        <span className={`decision-pill ${approval.status}`}>{approvalStatusLabel(approval.status)}</span>
                      )}
                    </div>
                  ))}
                </HubBlock>

                <HubBlock title="Artefatos" icon={FileText}>
                  {portal.artifacts.map((artifact) => (
                    <button className="artifact-row" key={artifact.id} type="button" onClick={() => setSelectedArtifact(artifact)}>
                      <div>
                        <strong>{artifact.title}</strong>
                        <small>{artifact.kind} · {artifact.visibility === "client" ? "cliente" : "interno"}</small>
                      </div>
                      <ArrowRight size={16} />
                    </button>
                  ))}
                </HubBlock>
              </div>
            )}
          </article>
        </section>

        <section className="content-grid">
          <article className="surface large" id="integrações">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">Integrações</p>
                <h2>Backlog técnico</h2>
              </div>
              <GitBranch size={22} />
            </div>
            <div className="integration-list">
              {integrations.map((integration) => (
                <div className="integration-row" key={integration.name}>
                  <strong>{integration.name}</strong>
                  <span>{integration.detail}</span>
                  <small>{integration.status}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="surface" id="engenharia">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">Infra</p>
                <h2>Saúde local</h2>
              </div>
              <Server size={22} />
            </div>
            <div className="health-list">
              <HealthRow icon={Activity} label="API" ok={apiOnline} value={apiOnline ? "ok" : "down"} />
              <HealthRow icon={ShieldCheck} label="Auth" ok={Boolean(user)} value={user ? "sessão ativa" : "sem sessão"} />
              <HealthRow icon={Zap} label="Docker" ok value="Postgres + Redis" />
            </div>
          </article>
        </section>
      </section>

      {selectedArtifact && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedArtifact(null)}>
          <section className="artifact-modal" role="dialog" aria-modal="true" aria-label={selectedArtifact.title} onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setSelectedArtifact(null)} aria-label="Fechar artefato">
              <X size={18} />
            </button>
            <p className="eyebrow">{selectedArtifact.kind}</p>
            <h2>{selectedArtifact.title}</h2>
            <p>{selectedArtifact.content ?? "Artefato sem conteúdo textual cadastrado."}</p>
            <small>{selectedArtifact.visibility === "client" ? "Visível para cliente" : "Uso interno EG"}</small>
          </section>
        </div>
      )}
    </main>
  );
}

function HubBlock({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <section className="hub-block">
      <div className="hub-block-title">
        <Icon size={18} />
        <h3>{title}</h3>
      </div>
      <div className="hub-block-list">{children}</div>
    </section>
  );
}

function HealthRow({ icon: Icon, label, ok, value }: { icon: LucideIcon; label: string; ok: boolean; value: string }) {
  return (
    <div className="health-row">
      <Icon size={18} />
      <span>{label}</span>
      <strong className={ok ? "ok" : "bad"}>{value}</strong>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function formatDueDate(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}

function approvalStatusLabel(status: string) {
  const labels: Record<string, string> = {
    approved: "Aprovado",
    rejected: "Reprovado",
    cancelled: "Cancelado",
  };
  return labels[status] ?? status;
}

function clickUpSummary(folderId: string | null, status: string | undefined) {
  if (!folderId) return "ClickUp sem mapeamento";
  if (!status) return "ClickUp mapeado";
  const labels: Record<string, string> = {
    ok: "ClickUp sincronizado",
    partial: "ClickUp parcial",
    error: "ClickUp com erro",
  };
  return labels[status] ?? "ClickUp mapeado";
}
