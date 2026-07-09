import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Building2,
  CalendarCheck,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  FileText,
  GitBranch,
  LayoutDashboard,
  Link,
  LockKeyhole,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  api,
  type ApiHealth,
  type ArtifactPayload,
  type ArtifactSummary,
  type ClientPayload,
  type ClientPortal,
  type ClientStatus,
  type ClientSummary,
  type CurrentUser,
  type DeliverablePayload,
  type DeliverableStatus,
  type DeliverableSummary,
} from "./lib/api";

type ViewId = "cockpit" | "clientes" | "conteudo" | "integracoes" | "engenharia";

const navItems: Array<{ id: ViewId; label: string; icon: LucideIcon }> = [
  { id: "cockpit", label: "Cockpit", icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "conteudo", label: "Conteúdo", icon: BookOpen },
  { id: "integracoes", label: "Integrações", icon: GitBranch },
  { id: "engenharia", label: "Engenharia", icon: FileText },
];

const statusLabel: Record<ClientStatus, string> = {
  onboarding: "Onboarding",
  active: "Ativo",
  paused: "Pausado",
  archived: "Arquivado",
};

const deliverableStatusLabel: Record<DeliverableStatus, string> = {
  planned: "Planejado",
  in_progress: "Em execução",
  waiting_approval: "Aguardando aprovação",
  done: "Concluído",
  blocked: "Bloqueado",
};

const integrationRows = [
  { name: "ClickUp", status: "MVP", detail: "dry-run manual; próximo passo é leitura real de tasks por lista" },
  { name: "Drive", status: "Backlog", detail: "centralizar links e arquivos do cliente no hub" },
  { name: "LinkedIn/Analytics", status: "Backlog", detail: "apenas quando houver fonte real, sem métricas inventadas" },
  { name: "Autentique", status: "Backlog", detail: "contratos e assinaturas sem duplicar ferramenta jurídica" },
];

const emptyClientDraft: ClientPayload = {
  name: "",
  organization_name: "",
  status: "onboarding",
  responsible_name: "",
  clickup_folder_id: "",
};

const emptyArtifactDraft: ArtifactPayload = {
  title: "",
  kind: "briefing",
  visibility: "client",
  content: "",
  url: "",
};

const emptyDeliverableDraft: DeliverablePayload = {
  title: "",
  status: "planned",
  due_at: "",
  clickup_task_id: "",
};

function currentViewFromHash(): ViewId {
  const id = window.location.hash.replace("#", "") as ViewId;
  return navItems.some((item) => item.id === id) ? id : "cockpit";
}

export function App() {
  const [view, setView] = useState<ViewId>(currentViewFromHash());
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
  const [newClientDraft, setNewClientDraft] = useState<ClientPayload>(emptyClientDraft);
  const [clientDraft, setClientDraft] = useState<ClientPayload>(emptyClientDraft);
  const [artifactDraft, setArtifactDraft] = useState<ArtifactPayload>(emptyArtifactDraft);
  const [deliverableDraft, setDeliverableDraft] = useState<DeliverablePayload>(emptyDeliverableDraft);
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactSummary | null>(null);
  const [artifactEditDraft, setArtifactEditDraft] = useState<ArtifactPayload>(emptyArtifactDraft);

  const apiOnline = health?.status === "ok";
  const activeOrg = user?.organizations[0] ?? null;
  const selectedClient = portal?.client ?? clients.find((client) => client.id === selectedClientId) ?? null;
  const isEgAdmin =
    user?.organizations.some((organization) => organization.slug === "eg" && organization.role === "eg_admin") ?? false;
  const latestSync = portal?.sync_runs[0] ?? null;

  const pendingApprovals = portal?.approvals.filter((approval) => approval.status === "pending") ?? [];
  const activeDeliverables =
    portal?.deliverables.filter((deliverable) => deliverable.status !== "done" && deliverable.status !== "blocked") ?? [];

  const metrics = useMemo(
    () => [
      { label: "Clientes", value: String(clients.length), delta: "carteira no Bioma", tone: "green" },
      { label: "Aprovações", value: String(pendingApprovals.length), delta: "pendências abertas", tone: "amber" },
      { label: "Entregas", value: String(activeDeliverables.length), delta: "ativas ou planejadas", tone: "mint" },
      { label: "Artefatos", value: String(portal?.artifacts.length ?? 0), delta: "briefing, brand book e mapas", tone: "cream" },
    ],
    [activeDeliverables.length, clients.length, pendingApprovals.length, portal?.artifacts.length],
  );

  useEffect(() => {
    const handleHash = () => setView(currentViewFromHash());
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

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
    if (!user && window.location.hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      setView("cockpit");
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setClients([]);
      setSelectedClientId(null);
      setPortal(null);
      return;
    }

    setDataError("");
    refreshClients().catch((error: Error) => setDataError(error.message));
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

  useEffect(() => {
    if (!selectedClient) {
      setClientDraft(emptyClientDraft);
      return;
    }
    setClientDraft({
      name: selectedClient.name,
      organization_name: selectedClient.organization_name,
      status: selectedClient.status,
      responsible_name: selectedClient.responsible_name ?? "",
      clickup_folder_id: selectedClient.clickup_folder_id ?? "",
    });
  }, [selectedClient]);

  useEffect(() => {
    if (!selectedArtifact) {
      setArtifactEditDraft(emptyArtifactDraft);
      return;
    }
    setArtifactEditDraft({
      title: selectedArtifact.title,
      kind: selectedArtifact.kind,
      visibility: selectedArtifact.visibility,
      content: selectedArtifact.content ?? "",
      url: selectedArtifact.url ?? "",
    });
  }, [selectedArtifact]);

  function navigate(nextView: ViewId) {
    setView(nextView);
    window.history.replaceState(null, "", `#${nextView}`);
  }

  async function refreshClients(preferredId?: string) {
    if (!user) return;
    const data = await api.clients();
    setClients(data);
    const nextId = preferredId ?? selectedClientId ?? data[0]?.id ?? null;
    setSelectedClientId(data.some((client) => client.id === nextId) ? nextId : data[0]?.id ?? null);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      setPassword("");
      navigate("cockpit");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Credenciais inválidas ou banco não migrado.");
    }
  }

  async function handleLogout() {
    await api.logout().catch(() => {});
    setUser(null);
    setPortal(null);
    setClients([]);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }

  async function runPortalAction(key: string, action: () => Promise<ClientPortal>) {
    setActionBusy(key);
    setDataError("");
    try {
      const data = await action();
      setPortal(data);
      await refreshClients(data.client.id);
      return data;
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Não foi possível concluir a ação.");
      return null;
    } finally {
      setActionBusy(null);
    }
  }

  async function handleCreateClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = normalizeClientPayload(newClientDraft);
    const data = await runPortalAction("client:create", () => api.createClient(payload));
    if (data) {
      setNewClientDraft(emptyClientDraft);
      navigate("clientes");
    }
  }

  async function handleUpdateClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClientId) return;
    await runPortalAction("client:update", () => api.updateClient(selectedClientId, normalizeClientPayload(clientDraft)));
  }

  async function handleCreateArtifact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClientId) return;
    const payload = normalizeArtifactPayload(artifactDraft);
    const data = await runPortalAction("artifact:create", () => api.createArtifact(selectedClientId, payload));
    if (data) setArtifactDraft(emptyArtifactDraft);
  }

  async function handleUpdateArtifact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClientId || !selectedArtifact) return;
    const payload = normalizeArtifactPayload(artifactEditDraft);
    await runPortalAction("artifact:update", () => api.updateArtifact(selectedClientId, selectedArtifact.id, payload));
    setSelectedArtifact(null);
  }

  async function handleDeleteArtifact() {
    if (!selectedClientId || !selectedArtifact) return;
    await runPortalAction("artifact:delete", () => api.deleteArtifact(selectedClientId, selectedArtifact.id));
    setSelectedArtifact(null);
  }

  async function handleCreateDeliverable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClientId) return;
    const payload = normalizeDeliverablePayload(deliverableDraft);
    const data = await runPortalAction("deliverable:create", () => api.createDeliverable(selectedClientId, payload));
    if (data) setDeliverableDraft(emptyDeliverableDraft);
  }

  async function handleDeliverableStatus(deliverableId: string, status: DeliverableStatus) {
    if (!selectedClientId) return;
    await runPortalAction(`deliverable:${deliverableId}:${status}`, () =>
      api.updateDeliverable(selectedClientId, deliverableId, { status }),
    );
  }

  async function handleDeleteDeliverable(deliverableId: string) {
    if (!selectedClientId) return;
    await runPortalAction(`deliverable:${deliverableId}:delete`, () => api.deleteDeliverable(selectedClientId, deliverableId));
  }

  async function handleApprovalDecision(approvalId: string, status: "approved" | "rejected") {
    if (!selectedClientId) return;
    await runPortalAction(`approval:${approvalId}:${status}`, () => api.decideApproval(selectedClientId, approvalId, status));
  }

  async function handleClickUpSync() {
    if (!selectedClientId) return;
    await runPortalAction("clickup:sync", () => api.syncClickUp(selectedClientId));
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
          <div>
            <p className="eyebrow invert">Plataforma operacional</p>
            <h1>Operação, cliente e dados no mesmo lugar.</h1>
            <p className="login-subtitle">
              O primeiro MVP conecta o cockpit interno da EG ao Client Hub e às integrações que sustentam a entrega.
            </p>
          </div>
          <div className="login-proof">
            <ProofItem icon={Users} title="Client Hub" detail="Briefing, entregas e aprovações" />
            <ProofItem icon={GitBranch} title="ClickUp Bridge" detail="Operação espelhada com controle" />
            <ProofItem icon={ShieldCheck} title="Governança" detail="Sessão, escopo e auditoria" />
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
          <form className="form-grid" onSubmit={handleLogin}>
            <label>
              E-mail
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
            </label>
            <label>
              Senha
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
            </label>
            {loginError && <span className="form-error">{loginError}</span>}
            <button type="submit" className="primary-button">
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
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button className={view === item.id ? "active" : ""} key={item.id} type="button" onClick={() => navigate(item.id)}>
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <span className={apiOnline ? "dot online" : "dot"} />
          <div>
            <strong>{apiOnline ? "API online" : "API offline"}</strong>
            <span>{activeOrg?.role === "eg_admin" ? "EG admin" : "Cliente"}</span>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <p className="eyebrow">Cockpit operacional</p>
            <h1>Bioma EG</h1>
          </div>
          <div className="topbar-actions">
            <div className="search-shell">
              <Search size={18} />
              <span>Clientes, entregas, artefatos e integrações</span>
            </div>
            <button className="ghost-button dark" type="button" onClick={handleLogout}>
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </header>

        {dataError && <div className="notice error">{dataError}</div>}

        {view === "cockpit" && (
          <CockpitView
            user={user}
            selectedClient={selectedClient}
            metrics={metrics}
            pendingApprovals={pendingApprovals}
            activeDeliverables={activeDeliverables}
            latestSync={latestSync?.status}
            onGoClients={() => navigate("clientes")}
            onGoContent={() => navigate("conteudo")}
          />
        )}

        {view === "clientes" && (
          <section className="client-layout">
            <article className="surface client-list-panel">
              <SectionHeader eyebrow="Client Hub" title="Carteira" icon={Users} />
              {clients.length === 0 && <EmptyState text="Nenhum cliente disponível para esta sessão." />}
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
                      <span>{client.artifacts_client} artefatos</span>
                    </div>
                  </button>
                ))}
              </div>
            </article>

            <article className="surface hub-panel">
              <SectionHeader eyebrow="Hub do cliente" title={selectedClient?.name ?? "Selecione um cliente"} icon={ClipboardCheck} />
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
                          disabled={actionBusy === "clickup:sync"}
                        >
                          <RefreshCw size={14} />
                          Sincronizar
                        </button>
                      )}
                    </div>
                  </section>

                  <HubBlock title="Entregas" icon={CalendarCheck}>
                    {portal.deliverables.length === 0 && <EmptyState compact text="Nenhuma entrega cadastrada." />}
                    {portal.deliverables.map((deliverable) => (
                      <div className="work-row" key={deliverable.id}>
                        <CircleDashed size={16} />
                        <div>
                          <strong>{deliverable.title}</strong>
                          <small>{formatDueDate(deliverable.due_at)} · {deliverable.clickup_task_id ?? "sem ClickUp"}</small>
                        </div>
                        <div className="row-tail">
                          {isEgAdmin ? (
                            <select
                              className="status-select"
                              value={deliverable.status}
                              onChange={(event) => handleDeliverableStatus(deliverable.id, event.target.value as DeliverableStatus)}
                              disabled={Boolean(actionBusy)}
                              aria-label={`Status de ${deliverable.title}`}
                            >
                              {Object.entries(deliverableStatusLabel).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className={`status-pill ${deliverable.status}`}>{deliverableStatusLabel[deliverable.status]}</span>
                          )}
                          {isEgAdmin && (
                            <button
                              className="icon-button danger"
                              type="button"
                              onClick={() => handleDeleteDeliverable(deliverable.id)}
                              aria-label={`Excluir ${deliverable.title}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </HubBlock>

                  <HubBlock title="Aprovações" icon={CheckCircle2}>
                    {portal.approvals.length === 0 && <EmptyState compact text="Nenhuma aprovação aberta." />}
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
                    {portal.artifacts.length === 0 && <EmptyState compact text="Nenhum artefato publicado." />}
                    {portal.artifacts.map((artifact) => (
                      <button className="artifact-row" key={artifact.id} type="button" onClick={() => setSelectedArtifact(artifact)}>
                        <div>
                          <strong>{artifact.title}</strong>
                          <small>
                            {artifactKindLabel(artifact.kind)} · {artifact.visibility === "client" ? "cliente" : "interno"}
                          </small>
                        </div>
                        <ArrowRight size={16} />
                      </button>
                    ))}
                  </HubBlock>
                </div>
              )}
            </article>
          </section>
        )}

        {view === "conteudo" && selectedClient && portal && (
          <section className="content-layout">
            <article className="surface">
              <SectionHeader eyebrow="Base estratégica" title="Briefing, brand book e calendário" icon={BookOpen} />
              <div className="artifact-board">
                {portal.artifacts.map((artifact) => (
                  <button className="artifact-tile" key={artifact.id} type="button" onClick={() => setSelectedArtifact(artifact)}>
                    <span>{artifactKindLabel(artifact.kind)}</span>
                    <strong>{artifact.title}</strong>
                    <small>{artifact.content ?? "Sem conteúdo textual cadastrado."}</small>
                  </button>
                ))}
                {portal.artifacts.length === 0 && <EmptyState text="Cadastre o primeiro briefing ou brand book deste cliente." />}
              </div>
            </article>

            <article className="surface">
              <SectionHeader eyebrow="Agenda editorial" title="Próximas entregas" icon={CalendarCheck} />
              <div className="timeline-list">
                {portal.deliverables.map((deliverable) => (
                  <div className="timeline-row" key={deliverable.id}>
                    <span>{formatDueDate(deliverable.due_at)}</span>
                    <strong>{deliverable.title}</strong>
                    <small>{deliverableStatusLabel[deliverable.status]}</small>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {view === "conteudo" && (!selectedClient || !portal) && <EmptyState text="Selecione um cliente para ver conteúdo." />}

        {view === "integracoes" && (
          <section className="content-grid">
            <article className="surface large">
              <SectionHeader eyebrow="Integrações" title="Backlog técnico" icon={GitBranch} />
              <div className="integration-list">
                {integrationRows.map((integration) => (
                  <div className="integration-row" key={integration.name}>
                    <strong>{integration.name}</strong>
                    <span>{integration.detail}</span>
                    <small>{integration.status}</small>
                  </div>
                ))}
              </div>
            </article>
            <article className="surface">
              <SectionHeader eyebrow="ClickUp Bridge" title="Estado atual" icon={Link} />
              <div className="health-list">
                <HealthRow icon={GitBranch} label="Mapeamento" ok={Boolean(selectedClient?.clickup_folder_id)} value={selectedClient?.clickup_folder_id ?? "pendente"} />
                <HealthRow icon={Activity} label="Último sync" ok={latestSync?.status !== "error"} value={latestSync?.status ?? "sem execução"} />
                <HealthRow icon={ShieldCheck} label="Escrita automática" ok={false} value="bloqueada no MVP" />
              </div>
              {isEgAdmin && selectedClientId && (
                <button className="primary-button wide" type="button" onClick={handleClickUpSync} disabled={actionBusy === "clickup:sync"}>
                  <RefreshCw size={16} />
                  Rodar sync dry-run
                </button>
              )}
            </article>
          </section>
        )}

        {view === "engenharia" && (
          <section className="content-grid">
            <article className="surface large">
              <SectionHeader eyebrow="Auditoria" title="Histórico recente" icon={FileText} />
              <div className="timeline-list">
                {portal?.audit_logs.map((log) => (
                  <div className="timeline-row" key={log.id}>
                    <span>{formatDateTime(log.created_at)}</span>
                    <strong>{auditLabel(log.event_type)}</strong>
                    <small>{compactMetadata(log.metadata)}</small>
                  </div>
                ))}
                {!portal?.audit_logs.length && <EmptyState text="Sem eventos de auditoria para o cliente selecionado." />}
              </div>
            </article>
            <article className="surface">
              <SectionHeader eyebrow="Saúde local" title="Runtime" icon={Server} />
              <div className="health-list">
                <HealthRow icon={Activity} label="API" ok={apiOnline} value={apiOnline ? "ok" : "down"} />
                <HealthRow icon={ShieldCheck} label="Auth" ok={Boolean(user)} value={user ? "sessão ativa" : "sem sessão"} />
                <HealthRow icon={Server} label="Dados" ok={clients.length > 0} value={`${clients.length} cliente(s)`} />
              </div>
            </article>
          </section>
        )}

        {isEgAdmin && (
          <section className="admin-dock" aria-label="Operações EG">
            <form className="dock-panel" onSubmit={handleCreateClient}>
              <DockTitle icon={Building2} title="Novo cliente" />
              <div className="form-grid two">
                <label>
                  Cliente
                  <input
                    value={newClientDraft.name ?? ""}
                    onChange={(event) => setNewClientDraft({ ...newClientDraft, name: event.target.value })}
                  />
                </label>
                <label>
                  Organização
                  <input
                    value={newClientDraft.organization_name ?? ""}
                    onChange={(event) => setNewClientDraft({ ...newClientDraft, organization_name: event.target.value })}
                  />
                </label>
                <label>
                  Responsável EG
                  <input
                    value={newClientDraft.responsible_name ?? ""}
                    onChange={(event) => setNewClientDraft({ ...newClientDraft, responsible_name: event.target.value })}
                  />
                </label>
                <label>
                  ClickUp folder
                  <input
                    value={newClientDraft.clickup_folder_id ?? ""}
                    onChange={(event) => setNewClientDraft({ ...newClientDraft, clickup_folder_id: event.target.value })}
                  />
                </label>
              </div>
              <button className="primary-button" type="submit" disabled={actionBusy === "client:create"}>
                <Plus size={16} />
                Criar cliente
              </button>
            </form>

            {selectedClient && (
              <form className="dock-panel" onSubmit={handleUpdateClient}>
                <DockTitle icon={Save} title="Editar cliente selecionado" />
                <div className="form-grid two">
                  <label>
                    Nome
                    <input value={clientDraft.name ?? ""} onChange={(event) => setClientDraft({ ...clientDraft, name: event.target.value })} />
                  </label>
                  <label>
                    Status
                    <select
                      value={clientDraft.status ?? "onboarding"}
                      onChange={(event) => setClientDraft({ ...clientDraft, status: event.target.value as ClientStatus })}
                    >
                      {Object.entries(statusLabel).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Responsável
                    <input
                      value={clientDraft.responsible_name ?? ""}
                      onChange={(event) => setClientDraft({ ...clientDraft, responsible_name: event.target.value })}
                    />
                  </label>
                  <label>
                    ClickUp folder
                    <input
                      value={clientDraft.clickup_folder_id ?? ""}
                      onChange={(event) => setClientDraft({ ...clientDraft, clickup_folder_id: event.target.value })}
                    />
                  </label>
                </div>
                <button className="secondary-button" type="submit" disabled={actionBusy === "client:update"}>
                  <Save size={16} />
                  Salvar cliente
                </button>
              </form>
            )}

            {selectedClientId && (
              <>
                <form className="dock-panel" onSubmit={handleCreateArtifact}>
                  <DockTitle icon={FileText} title="Novo artefato" />
                  <div className="form-grid">
                    <label>
                      Título
                      <input value={artifactDraft.title} onChange={(event) => setArtifactDraft({ ...artifactDraft, title: event.target.value })} />
                    </label>
                    <div className="form-grid two">
                      <label>
                        Tipo
                        <select value={artifactDraft.kind} onChange={(event) => setArtifactDraft({ ...artifactDraft, kind: event.target.value })}>
                          <option value="briefing">Briefing</option>
                          <option value="brand_book">Brand book</option>
                          <option value="calendar">Calendário</option>
                          <option value="integration_map">Mapa de integração</option>
                        </select>
                      </label>
                      <label>
                        Visibilidade
                        <select
                          value={artifactDraft.visibility}
                          onChange={(event) =>
                            setArtifactDraft({ ...artifactDraft, visibility: event.target.value as ArtifactPayload["visibility"] })
                          }
                        >
                          <option value="client">Cliente</option>
                          <option value="internal">Interno EG</option>
                        </select>
                      </label>
                    </div>
                    <label>
                      Conteúdo
                      <textarea value={artifactDraft.content ?? ""} onChange={(event) => setArtifactDraft({ ...artifactDraft, content: event.target.value })} />
                    </label>
                  </div>
                  <button className="primary-button" type="submit" disabled={actionBusy === "artifact:create"}>
                    <Plus size={16} />
                    Publicar artefato
                  </button>
                </form>

                <form className="dock-panel" onSubmit={handleCreateDeliverable}>
                  <DockTitle icon={CalendarCheck} title="Nova entrega" />
                  <div className="form-grid">
                    <label>
                      Título
                      <input
                        value={deliverableDraft.title}
                        onChange={(event) => setDeliverableDraft({ ...deliverableDraft, title: event.target.value })}
                      />
                    </label>
                    <div className="form-grid two">
                      <label>
                        Status
                        <select
                          value={deliverableDraft.status}
                          onChange={(event) => setDeliverableDraft({ ...deliverableDraft, status: event.target.value as DeliverableStatus })}
                        >
                          {Object.entries(deliverableStatusLabel).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Prazo
                        <input
                          value={deliverableDraft.due_at ?? ""}
                          type="datetime-local"
                          onChange={(event) => setDeliverableDraft({ ...deliverableDraft, due_at: event.target.value })}
                        />
                      </label>
                    </div>
                  </div>
                  <button className="primary-button" type="submit" disabled={actionBusy === "deliverable:create"}>
                    <Plus size={16} />
                    Criar entrega
                  </button>
                </form>
              </>
            )}
          </section>
        )}
      </section>

      {selectedArtifact && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedArtifact(null)}>
          <section
            className="artifact-modal"
            role="dialog"
            aria-modal="true"
            aria-label={selectedArtifact.title}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" type="button" onClick={() => setSelectedArtifact(null)} aria-label="Fechar artefato">
              <X size={18} />
            </button>
            {isEgAdmin ? (
              <form className="form-grid" onSubmit={handleUpdateArtifact}>
                <p className="eyebrow">{artifactKindLabel(selectedArtifact.kind)}</p>
                <label>
                  Título
                  <input
                    value={artifactEditDraft.title}
                    onChange={(event) => setArtifactEditDraft({ ...artifactEditDraft, title: event.target.value })}
                  />
                </label>
                <div className="form-grid two">
                  <label>
                    Tipo
                    <select
                      value={artifactEditDraft.kind}
                      onChange={(event) => setArtifactEditDraft({ ...artifactEditDraft, kind: event.target.value })}
                    >
                      <option value="briefing">Briefing</option>
                      <option value="brand_book">Brand book</option>
                      <option value="calendar">Calendário</option>
                      <option value="integration_map">Mapa de integração</option>
                    </select>
                  </label>
                  <label>
                    Visibilidade
                    <select
                      value={artifactEditDraft.visibility}
                      onChange={(event) =>
                        setArtifactEditDraft({ ...artifactEditDraft, visibility: event.target.value as ArtifactPayload["visibility"] })
                      }
                    >
                      <option value="client">Cliente</option>
                      <option value="internal">Interno EG</option>
                    </select>
                  </label>
                </div>
                <label>
                  Conteúdo
                  <textarea
                    value={artifactEditDraft.content ?? ""}
                    onChange={(event) => setArtifactEditDraft({ ...artifactEditDraft, content: event.target.value })}
                  />
                </label>
                <div className="modal-actions">
                  <button className="primary-button" type="submit" disabled={actionBusy === "artifact:update"}>
                    <Save size={16} />
                    Salvar
                  </button>
                  <button className="danger-button" type="button" onClick={handleDeleteArtifact} disabled={actionBusy === "artifact:delete"}>
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="eyebrow">{artifactKindLabel(selectedArtifact.kind)}</p>
                <h2>{selectedArtifact.title}</h2>
                <p>{selectedArtifact.content ?? "Artefato sem conteúdo textual cadastrado."}</p>
                <small>{selectedArtifact.visibility === "client" ? "Visível para cliente" : "Uso interno EG"}</small>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function CockpitView({
  user,
  selectedClient,
  metrics,
  pendingApprovals,
  activeDeliverables,
  latestSync,
  onGoClients,
  onGoContent,
}: {
  user: CurrentUser;
  selectedClient: ClientSummary | null;
  metrics: Array<{ label: string; value: string; delta: string; tone: string }>;
  pendingApprovals: Array<{ id: string; deliverable_title: string | null; comment: string | null }>;
  activeDeliverables: DeliverableSummary[];
  latestSync: string | undefined;
  onGoClients: () => void;
  onGoContent: () => void;
}) {
  return (
    <>
      <section className="hero-grid">
        <article className="command-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Sessão</p>
              <h2>{user.display_name}</h2>
            </div>
            <LockKeyhole size={24} />
          </div>
          <div className="session-card">
            <strong>{selectedClient?.name ?? "Nenhum cliente selecionado"}</strong>
            <span>{user.email}</span>
            <small>{selectedClient ? `${selectedClient.organization_name} · ${statusLabel[selectedClient.status]}` : "Escolha um cliente para operar"}</small>
          </div>
          <div className="quick-actions">
            <button type="button" onClick={onGoClients}>
              <Users size={16} />
              Abrir clientes
            </button>
            <button type="button" onClick={onGoContent}>
              <BookOpen size={16} />
              Ver conteúdo
            </button>
          </div>
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

      <section className="content-grid">
        <article className="surface large">
          <SectionHeader eyebrow="Fila de trabalho" title="Próximas ações" icon={CalendarCheck} />
          <div className="timeline-list">
            {pendingApprovals.map((approval) => (
              <div className="timeline-row" key={approval.id}>
                <span>Aprovação</span>
                <strong>{approval.deliverable_title ?? "Aprovação pendente"}</strong>
                <small>{approval.comment ?? "Sem comentário"}</small>
              </div>
            ))}
            {activeDeliverables.slice(0, 5).map((deliverable) => (
              <div className="timeline-row" key={deliverable.id}>
                <span>{formatDueDate(deliverable.due_at)}</span>
                <strong>{deliverable.title}</strong>
                <small>{deliverableStatusLabel[deliverable.status]}</small>
              </div>
            ))}
            {pendingApprovals.length === 0 && activeDeliverables.length === 0 && <EmptyState text="Nenhuma ação pendente." />}
          </div>
        </article>

        <article className="surface">
          <SectionHeader eyebrow="Operação" title="Sinais do MVP" icon={Sparkles} />
          <div className="health-list">
            <HealthRow icon={ClipboardCheck} label="Client Hub" ok={Boolean(selectedClient)} value={selectedClient?.name ?? "sem cliente"} />
            <HealthRow icon={GitBranch} label="ClickUp" ok={latestSync !== "error"} value={latestSync ?? "dry-run pendente"} />
            <HealthRow icon={ShieldCheck} label="Escopo" ok value="EG admin + cliente" />
          </div>
        </article>
      </section>
    </>
  );
}

function ProofItem({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return (
    <div>
      <Icon size={20} />
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}

function SectionHeader({ eyebrow, title, icon: Icon }: { eyebrow: string; title: string; icon: LucideIcon }) {
  return (
    <div className="panel-heading compact">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <Icon size={22} />
    </div>
  );
}

function DockTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="dock-title">
      <Icon size={16} />
      <strong>{title}</strong>
    </div>
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

function EmptyState({ text, compact = false }: { text: string; compact?: boolean }) {
  return <div className={compact ? "empty-state compact" : "empty-state"}>{text}</div>;
}

function normalizeClientPayload(payload: ClientPayload): ClientPayload {
  return {
    ...payload,
    name: payload.name.trim(),
    organization_name: normalizeOptional(payload.organization_name) ?? payload.name.trim(),
    responsible_name: normalizeOptional(payload.responsible_name),
    clickup_folder_id: normalizeOptional(payload.clickup_folder_id),
  };
}

function normalizeArtifactPayload(payload: ArtifactPayload): ArtifactPayload {
  return {
    ...payload,
    title: payload.title.trim(),
    kind: payload.kind.trim() || "briefing",
    content: normalizeOptional(payload.content),
    url: normalizeOptional(payload.url),
  };
}

function normalizeDeliverablePayload(payload: DeliverablePayload): DeliverablePayload {
  return {
    ...payload,
    title: payload.title.trim(),
    due_at: normalizeOptional(payload.due_at),
    clickup_task_id: normalizeOptional(payload.clickup_task_id),
  };
}

function normalizeOptional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function formatDueDate(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(
    new Date(value),
  );
}

function approvalStatusLabel(status: string) {
  const labels: Record<string, string> = {
    approved: "Aprovado",
    rejected: "Reprovado",
    cancelled: "Cancelado",
  };
  return labels[status] ?? status;
}

function artifactKindLabel(kind: string) {
  const labels: Record<string, string> = {
    briefing: "Briefing",
    brand_book: "Brand book",
    calendar: "Calendário",
    integration_map: "Mapa de integração",
  };
  return labels[kind] ?? kind;
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

function auditLabel(eventType: string) {
  const labels: Record<string, string> = {
    "auth.login": "Login",
    "client.created": "Cliente criado",
    "client.updated": "Cliente atualizado",
    "artifact.created": "Artefato criado",
    "artifact.updated": "Artefato atualizado",
    "artifact.deleted": "Artefato excluído",
    "deliverable.created": "Entrega criada",
    "deliverable.updated": "Entrega atualizada",
    "deliverable.deleted": "Entrega excluída",
    "approval.decided": "Aprovação decidida",
    "clickup.sync_requested": "Sync ClickUp solicitado",
  };
  return labels[eventType] ?? eventType;
}

function compactMetadata(metadata: Record<string, unknown>) {
  const keys = Object.keys(metadata);
  if (keys.length === 0) return "sem metadados";
  return keys
    .slice(0, 3)
    .map((key) => `${key}: ${String(metadata[key])}`)
    .join(" · ");
}
