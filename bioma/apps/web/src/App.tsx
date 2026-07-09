import { FormEvent, useEffect, useMemo, useState } from "react";
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
  Trash2,
  Users,
  X,
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
} from "./lib/api";
import { DockTitle, EmptyState, HealthRow, HubBlock, ProofItem, SectionHeader } from "./components/shared";
import {
  currentViewFromHash,
  deliverableStatusLabel,
  emptyArtifactDraft,
  emptyClientDraft,
  emptyDeliverableDraft,
  integrationRows,
  navItems,
  statusLabel,
  type ViewId,
} from "./lib/app-config";
import {
  approvalStatusLabel,
  artifactKindLabel,
  auditLabel,
  clickUpSummary,
  compactMetadata,
  formatDateTime,
  formatDueDate,
  isSessionError,
  normalizeArtifactPayload,
  normalizeClientPayload,
  normalizeDeliverablePayload,
} from "./lib/format";
import { CockpitView } from "./views/CockpitView";

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
    refreshClients().catch((error: Error) => handleAppError(error, "Não foi possível carregar clientes."));
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
      .then((data) => {
        setPortal(data);
        setDataError("");
      })
      .catch((error: Error) => handleAppError(error, "Não foi possível carregar o hub."))
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
    setDataError("");
    const nextId = preferredId ?? selectedClientId ?? data[0]?.id ?? null;
    setSelectedClientId(data.some((client) => client.id === nextId) ? nextId : data[0]?.id ?? null);
  }

  function resetSession(message = "Sua sessão expirou. Entre novamente para continuar.") {
    setUser(null);
    setPortal(null);
    setClients([]);
    setSelectedClientId(null);
    setDataError("");
    setLoginError(message);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    setView("cockpit");
  }

  function handleAppError(error: Error, fallback: string) {
    if (isSessionError(error)) {
      resetSession();
      return;
    }
    setDataError(error.message || fallback);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      setPassword("");
      setDataError("");
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
    setSelectedClientId(null);
    setDataError("");
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }

  async function runPortalAction(key: string, action: () => Promise<ClientPortal>) {
    setActionBusy(key);
    setDataError("");
    try {
      const data = await action();
      setPortal(data);
      setDataError("");
      await refreshClients(data.client.id);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        handleAppError(error, "Não foi possível concluir a ação.");
      } else {
        setDataError("Não foi possível concluir a ação.");
      }
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
