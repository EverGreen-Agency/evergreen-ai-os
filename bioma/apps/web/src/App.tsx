import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  FileText,
  GitBranch,
  LayoutDashboard,
  LockKeyhole,
  LogIn,
  Search,
  Server,
  ShieldCheck,
  Users,
  Zap,
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

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const metrics = [
  { label: "Clientes", value: "1", delta: "HM demo", tone: "green" },
  { label: "Pendências", value: "4", delta: "2 aprovações", tone: "amber" },
  { label: "Integrações", value: "1/5", delta: "ClickUp primeiro", tone: "mint" },
];

const timeline = [
  { time: "Hoje", title: "Validar auth e modelo base", tag: "M2", status: "Em andamento" },
  { time: "Próximo", title: "Carteira EG + cliente demo HM", tag: "M3", status: "Planejado" },
  { time: "Depois", title: "ClickUp read-only por cliente", tag: "M4", status: "Planejado" },
];

const integrations = [
  { name: "ClickUp", status: "prioridade", detail: "read-only -> HITL" },
  { name: "Drive", status: "backlog", detail: "links e arquivos" },
  { name: "Ads", status: "backlog", detail: "snapshots primeiro" },
  { name: "Autentique", status: "backlog", detail: "contratos depois" },
];

const navItems = [
  { label: "Cockpit", icon: LayoutDashboard },
  { label: "Clientes", icon: Users },
  { label: "Engenharia", icon: FileText },
  { label: "Integrações", icon: GitBranch },
];

export function App() {
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [email, setEmail] = useState("eduardo@evergreengrowth.com.br");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const apiOnline = health?.status === "ok";

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

  const activeOrg = useMemo(() => {
    if (!user?.organizations.length) return null;
    return user.organizations[0];
  }, [user]);

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
            <span>{apiOnline ? "127.0.0.1:8000" : "health indisponível"}</span>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <p className="eyebrow">Cockpit operacional</p>
            <h1>Controle interno EG</h1>
          </div>
          <div className="search-shell">
            <Search size={18} />
            <span>Clientes, specs, entregas, integrações</span>
          </div>
        </header>

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

        <section className="content-grid">
          <article className="surface large">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">Operação</p>
                <h2>Fila de construção</h2>
              </div>
              <CalendarCheck size={22} />
            </div>
            <div className="timeline">
              {timeline.map((item) => (
                <div className="timeline-row" key={item.title}>
                  <span className="timeline-time">{item.time}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.status}</small>
                  </div>
                  <span className="tag">{item.tag}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="surface">
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

          <article className="surface large">
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

          <article className="surface">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">Risco</p>
                <h2>Gates</h2>
              </div>
              <AlertCircle size={22} />
            </div>
            <ul className="gate-list">
              <li>
                <CheckCircle2 size={16} />
                ADRs v0 criados
              </li>
              <li>
                <CheckCircle2 size={16} />
                Branding EG aplicado
              </li>
              <li>
                <AlertCircle size={16} />
                LGPD antes de produção real
              </li>
            </ul>
          </article>
        </section>
      </section>
    </main>
  );
}

function HealthRow({
  icon: Icon,
  label,
  ok,
  value,
}: {
  icon: typeof Activity;
  label: string;
  ok: boolean;
  value: string;
}) {
  return (
    <div className="health-row">
      <Icon size={18} />
      <span>{label}</span>
      <strong className={ok ? "ok" : "bad"}>{value}</strong>
    </div>
  );
}
