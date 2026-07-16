import { FormEvent, ReactNode, Suspense, lazy, useEffect, useState } from "react";
import { KeyRound, LogOut, Search } from "lucide-react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { enabledModulesFor, navItems, viewModule } from "./lib/app-config";
import { CockpitView } from "./views/CockpitView";
import { LoginView } from "./views/LoginView";
import { InviteView } from "./views/InviteView";
import { ResetPasswordView } from "./views/ResetPasswordView";
import { ArtifactModal } from "./components/ArtifactModal";
import { PasswordModal } from "./components/PasswordModal";
import { APP_VERSION } from "./lib/version";
import { useUiStore } from "./store/uiStore";
import { useApiHealth, useCurrentUser, useClients, useLogin, useLogout, useUpdateArtifact, useDeleteArtifact } from "./hooks/useBiomaApi";
import { normalizeArtifactPayload } from "./lib/format";
import { emptyArtifactDraft } from "./lib/app-config";

const ClientsView = lazy(() => import("./views/ClientsView").then((module) => ({ default: module.ClientsView })));
const ContentView = lazy(() => import("./views/ContentView").then((module) => ({ default: module.ContentView })));
const IntegrationsView = lazy(() => import("./views/IntegrationsView").then((module) => ({ default: module.IntegrationsView })));
const EngineeringView = lazy(() => import("./views/EngineeringView").then((module) => ({ default: module.EngineeringView })));
const AnalyticsView = lazy(() => import("./views/AnalyticsView").then((module) => ({ default: module.AnalyticsView })));
const OperationsView = lazy(() => import("./views/OperationsView").then((module) => ({ default: module.OperationsView })));

function ViewLoadingFallback() {
  return <div className="notice">Carregando módulo...</div>;
}

export function App() {
  const routerNavigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("eduardo@evergreengrowth.com.br");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const { data: healthData } = useApiHealth();
  const { data: user } = useCurrentUser();
  const login = useLogin();
  const logout = useLogout();

  const {
    selectedClientId,
    setSelectedClientId,
    selectedArtifact,
    setSelectedArtifact,
    artifactEditDraft,
    setArtifactEditDraft,
    dataError,
  } = useUiStore();

  const { data: clientsData } = useClients();
  const clients = clientsData ?? [];

  const updateArtifact = useUpdateArtifact();
  const deleteArtifact = useDeleteArtifact();

  const apiOnline = healthData?.status === "ok";
  const isEgAdmin = user?.organizations.some((organization) => organization.slug === "eg" && organization.role === "eg_admin") ?? false;

  useEffect(() => {
    if (
      !user &&
      location.pathname !== "/" &&
      !location.pathname.startsWith("/convite/") &&
      !location.pathname.startsWith("/redefinir/")
    ) {
      routerNavigate("/");
    }
  }, [user, location.pathname, routerNavigate]);

  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId, setSelectedClientId]);

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
  }, [selectedArtifact, setArtifactEditDraft]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          setPassword("");
          routerNavigate("/");
        },
        onError: (error) => {
          setLoginError(error instanceof Error ? error.message : "Credenciais inválidas ou banco não migrado.");
        }
      }
    );
  }

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        setSelectedClientId(null);
        routerNavigate("/");
      }
    });
  }

  function handleUpdateArtifact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClientId || !selectedArtifact) return;
    const payload = normalizeArtifactPayload(artifactEditDraft);
    updateArtifact.mutate({ clientId: selectedClientId, artifactId: selectedArtifact.id, payload }, {
      onSuccess: () => setSelectedArtifact(null)
    });
  }

  function handleDeleteArtifact() {
    if (!selectedClientId || !selectedArtifact) return;
    deleteArtifact.mutate({ clientId: selectedClientId, artifactId: selectedArtifact.id }, {
      onSuccess: () => setSelectedArtifact(null)
    });
  }

  const enabledModules = enabledModulesFor(user, isEgAdmin);
  const visibleNavItems = navItems.filter((item) => enabledModules.has(viewModule[item.id]));

  function guard(view: (typeof navItems)[number]["id"], element: ReactNode) {
    return enabledModules.has(viewModule[view]) ? element : <Navigate to="/" replace />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/convite/:token" element={<InviteView />} />
        <Route path="/redefinir/:token" element={<ResetPasswordView />} />
        <Route
          path="*"
          element={
            <LoginView
              email={email}
              password={password}
              loginError={loginError}
              apiOnline={apiOnline}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={handleLogin}
            />
          }
        />
      </Routes>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navegação principal">
        <div className="brand">
          <div className="brand-mark">
            <img src="/assets/brand/eg-symbol.png" alt="Símbolo EverGreen" width={52} height={52} />
          </div>
          <div>
            <strong>Bioma</strong>
            <span>v{APP_VERSION}</span>
          </div>
        </div>

        <nav className="nav-list">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const path = item.id === "cockpit" ? "/" : `/${item.id}`;
            const isActive = location.pathname === path || (item.id !== "cockpit" && location.pathname.startsWith(path));
            return (
              <button className={isActive ? "active" : ""} key={item.id} type="button" onClick={() => routerNavigate(path)}>
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
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
            <button
              className="ghost-button dark"
              type="button"
              onClick={() => setShowPasswordModal(true)}
              aria-label="Alterar senha"
              title="Alterar senha"
            >
              <KeyRound size={16} />
            </button>
            <button className="ghost-button dark" type="button" onClick={handleLogout} disabled={logout.isPending}>
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </header>

        {dataError && <div className="notice error">{dataError}</div>}

        <Routes>
          <Route path="/" element={<CockpitView />} />

          <Route path="/clientes" element={guard("clientes",
            <Suspense fallback={<ViewLoadingFallback />}>
              <ClientsView />
            </Suspense>,
          )} />

          <Route path="/conteudo" element={guard("conteudo",
            <Suspense fallback={<ViewLoadingFallback />}>
              <ContentView />
            </Suspense>,
          )} />

          <Route path="/comercial" element={guard("comercial",
            <Suspense fallback={<ViewLoadingFallback />}>
              <OperationsView />
            </Suspense>,
          )} />

          <Route path="/integracoes" element={guard("integracoes",
            <Suspense fallback={<ViewLoadingFallback />}>
              <IntegrationsView />
            </Suspense>,
          )} />

          <Route path="/engenharia" element={guard("engenharia",
            <Suspense fallback={<ViewLoadingFallback />}>
              <EngineeringView />
            </Suspense>,
          )} />

          <Route path="/analytics" element={guard("analytics",
            <Suspense fallback={<ViewLoadingFallback />}>
              <AnalyticsView />
            </Suspense>,
          )} />

          <Route path="/convite/:token" element={<InviteView />} />
          <Route path="/redefinir/:token" element={<ResetPasswordView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </section>

      {showPasswordModal && <PasswordModal onClose={() => setShowPasswordModal(false)} />}

      {selectedArtifact && (
        <ArtifactModal
          artifact={selectedArtifact}
          isEgAdmin={isEgAdmin}
          actionBusy={updateArtifact.isPending || deleteArtifact.isPending ? "artifact" : null}
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
