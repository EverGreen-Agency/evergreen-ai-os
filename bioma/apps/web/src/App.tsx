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
  Zap,
  type LucideIcon,
} from "lucide-react";

type ApiHealth = {
  status: string;
  checked_at: string;
};

type CurrentUser = {
  id: string;
  email: string;
  display_name: string;
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    role: "eg_admin" | "client_user";
  }>;
};

type ClientSummary = {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  name: string;
  status: "onboarding" | "active" | "paused" | "archived";
  responsible_name: string | null;
  clickup_folder_id: string | null;
  deliverables_total: number;
  approvals_pending: number;
  artifacts_client: number;
};

type ArtifactSummary = {
  id: string;
  title: string;
  kind: string;
  visibility: "internal" | "client";
  content: string | null;
  url: string | null;
  created_at: string;
};

type DeliverableSummary = {
  id: string;
  title: string;
  status: "planned" | "in_progress" | "waiting_approval" | "done" | "blocked";
  due_at: string | null;
  clickup_task_id: string | null;
  updated_at: string;
};

type ApprovalSummary = {
  id: string;
  deliverable_title: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  comment: string | null;
  created_at: string;
};

type SyncRunSummary = {
  id: string;
  source: string;
  status: "ok" | "error" | "partial";
  summary: Record<string, unknown>;
  started_at: string;
  finished_at: string | null;
};

type ClientPortal = {
  client: ClientSummary;
  artifacts: ArtifactSummary[];
  deliverables: DeliverableSummary[];
  approvals: ApprovalSummary[];
  sync_runs: SyncRunSummary[];
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

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

  const apiOnline = health?.status === "ok";
  const activeOrg = user?.organizations[0] ?? null;
  const selectedClient = portal?.client ?? clients.find((client) => client.id === selectedClientId) ?? null;

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
    fetch(`${apiBaseUrl}/health`)
      .then((response) => response.json())
      .then(setHealth)
      .catch(() => setHealth(null));

    fetch(`${apiBaseUrl}/auth/me`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => data && setUser(data))
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
    fetch(`${apiBaseUrl}/clients`, { credentials: "include" })
      .then((response) => {
        if (!response.ok) throw new Error("Falha ao carregar clientes.");
        return response.json();
      })
      .then((data: ClientSummary[]) => {
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
    fetch(`${apiBaseUrl}/clients/${selectedClientId}`, { credentials: "include" })
      .then((response) => {
        if (!response.ok) throw new Error("Falha ao carregar hub do cliente.");
        return response.json();
      })
      .then(setPortal)
      .catch((error: Error) => setDataError(error.message))
      .finally(() => setLoadingPortal(false));
  }, [selectedClientId]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    const response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      setLoginError("Credenciais inválidas ou banco não migrado.");
      return;
    }
    const data = await response.json();
    setUser(data.user);
    setPassword("");
  }

  async function handleLogout() {
    await fetch(`${apiBaseUrl}/auth/logout`, { method: "POST", credentials: "include" });
    setUser(null);
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
                    <span>
                      {selectedClient.clickup_folder_id ? "ClickUp conectado" : "ClickUp aguardando credencial"}
                    </span>
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
                      <span>{formatDueDate(deliverable.due_at)}</span>
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
                      <span>{approval.status === "pending" ? "Pendente" : approval.status}</span>
                    </div>
                  ))}
                </HubBlock>

                <HubBlock title="Artefatos" icon={FileText}>
                  {portal.artifacts.map((artifact) => (
                    <div className="artifact-row" key={artifact.id}>
                      <div>
                        <strong>{artifact.title}</strong>
                        <small>{artifact.kind} · {artifact.visibility === "client" ? "cliente" : "interno"}</small>
                      </div>
                      <ArrowRight size={16} />
                    </div>
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
