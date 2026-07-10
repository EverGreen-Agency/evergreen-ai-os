import { FormEvent, useEffect, useMemo, useState } from "react";
import { LogOut, Search } from "lucide-react";
import {
  api,
  type ApiHealth,
  type ArtifactPayload,
  type ArtifactSummary,
  type ClientPayload,
  type ClientPortal,
  type ClientSummary,
  type CurrentUser,
  type DeliverablePayload,
  type DeliverableStatus,
} from "./lib/api";
import {
  currentViewFromHash,
  emptyArtifactDraft,
  emptyClientDraft,
  emptyDeliverableDraft,
  navItems,
  type ViewId,
} from "./lib/app-config";
import {
  isSessionError,
  normalizeArtifactPayload,
  normalizeClientPayload,
  normalizeDeliverablePayload,
} from "./lib/format";
import { CockpitView } from "./views/CockpitView";
import { LoginView } from "./views/LoginView";
import { ClientsView } from "./views/ClientsView";
import { ContentView } from "./views/ContentView";
import { IntegrationsView } from "./views/IntegrationsView";
import { EngineeringView } from "./views/EngineeringView";
import { AnalyticsView } from "./views/AnalyticsView";
import { AdminDock } from "./components/AdminDock";
import { ArtifactModal } from "./components/ArtifactModal";

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
      <LoginView
        email={email}
        password={password}
        loginError={loginError}
        apiOnline={apiOnline}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navegação principal">
        <div className="brand">
          <div className="brand-mark">
            <img src="/assets/brand/eg-symbol.svg" alt="Símbolo EverGreen" width={52} height={52} />
          </div>
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
          <ClientsView
            clients={clients}
            selectedClientId={selectedClientId}
            selectedClient={selectedClient}
            portal={portal}
            loadingPortal={loadingPortal}
            latestSync={latestSync?.status}
            isEgAdmin={isEgAdmin}
            actionBusy={actionBusy}
            onSelectClient={setSelectedClientId}
            onClickUpSync={handleClickUpSync}
            onDeliverableStatus={handleDeliverableStatus}
            onDeleteDeliverable={handleDeleteDeliverable}
            onApprovalDecision={handleApprovalDecision}
            onSelectArtifact={setSelectedArtifact}
          />
        )}

        {view === "conteudo" && (
          <ContentView
            selectedClient={selectedClient}
            portal={portal}
            onSelectArtifact={setSelectedArtifact}
          />
        )}

        {view === "integracoes" && (
          <IntegrationsView
            selectedClient={selectedClient}
            latestSync={latestSync}
            isEgAdmin={isEgAdmin}
            actionBusy={actionBusy}
            onClickUpSync={handleClickUpSync}
          />
        )}

        {view === "engenharia" && (
          <EngineeringView
            portal={portal}
            apiOnline={apiOnline}
            user={user}
            clients={clients}
          />
        )}

        {view === "analytics" && (
          <AnalyticsView />
        )}

        {isEgAdmin && (
          <AdminDock
            selectedClient={selectedClient}
            selectedClientId={selectedClientId}
            actionBusy={actionBusy}
            newClientDraft={newClientDraft}
            setNewClientDraft={setNewClientDraft}
            clientDraft={clientDraft}
            setClientDraft={setClientDraft}
            artifactDraft={artifactDraft}
            setArtifactDraft={setArtifactDraft}
            deliverableDraft={deliverableDraft}
            setDeliverableDraft={setDeliverableDraft}
            handleCreateClient={handleCreateClient}
            handleUpdateClient={handleUpdateClient}
            handleCreateArtifact={handleCreateArtifact}
            handleCreateDeliverable={handleCreateDeliverable}
          />
        )}
      </section>

      {selectedArtifact && (
        <ArtifactModal
          artifact={selectedArtifact}
          isEgAdmin={isEgAdmin}
          actionBusy={actionBusy}
          draft={artifactEditDraft}
          setDraft={setArtifactEditDraft}
          onSubmit={handleUpdateArtifact}
          onDelete={handleDeleteArtifact}
          onClose={() => setSelectedArtifact(null)}
        />
      )}
    </main>
  );
}
