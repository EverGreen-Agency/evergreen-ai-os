import { FormEvent, ReactNode, Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { enabledModulesFor, navItems, viewModule } from "./lib/app-config";
import { SettingsView } from "./views/SettingsView";
import { CockpitView } from "./views/CockpitView";
import { LoginView } from "./views/LoginView";
import { InviteView } from "./views/InviteView";
import { ResetPasswordView } from "./views/ResetPasswordView";
import { PrivacyView } from "./views/PrivacyView";
import { ArtifactModal } from "./components/ArtifactModal";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { useUiStore } from "./store/uiStore";
import { useApiHealth, useCurrentUser, useClients, useLogin, useLogout, useUpdateArtifact, useDeleteArtifact } from "./hooks/useBiomaApi";
import { normalizeArtifactPayload } from "./lib/format";
import { emptyArtifactDraft } from "./lib/app-config";

const ClientsView = lazy(() => import("./views/ClientsView").then((module) => ({ default: module.ClientsView })));
const ContentView = lazy(() => import("./views/ContentView").then((module) => ({ default: module.ContentView })));
const EngineeringView = lazy(() => import("./views/EngineeringView").then((module) => ({ default: module.EngineeringView })));
const AnalyticsView = lazy(() => import("./views/AnalyticsView").then((module) => ({ default: module.AnalyticsView })));
const OperationsView = lazy(() => import("./views/OperationsView").then((module) => ({ default: module.OperationsView })));

// Views administrativas EG — lazy obrigatório: o Escritório carrega o Phaser
// (~1,2 MB), que não pode entrar no bundle inicial dos clientes.
const OfficeView = lazy(() => import("./views/admin/office/PhaserGame").then((module) => ({ default: module.PhaserGame })));
const IdeaBankView = lazy(() => import("./views/admin/idea-bank/IdeaBank").then((module) => ({ default: module.IdeaBank })));
const TechRadarView = lazy(() => import("./views/admin/tech-radar/TechRadar").then((module) => ({ default: module.TechRadar })));
const ArchitectureView = lazy(() =>
  import("./views/admin/architecture/ArchitectureView").then((module) => ({ default: module.ArchitectureView })),
);

function ViewLoadingFallback() {
  return <div className="notice">Carregando módulo...</div>;
}

export function App() {
  const routerNavigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("eduardo@evergreengrowth.com.br");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
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
      location.pathname !== "/privacidade" &&
      !location.pathname.startsWith("/convite/") &&
      !location.pathname.startsWith("/redefinir/")
    ) {
      routerNavigate("/");
    }
  }, [user, location.pathname, routerNavigate]);

  // Erros do fluxo OAuth chegam por redirect (?oauth_error=...) porque o
  // callback é navegação de página, não fetch.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthError = params.get("oauth_error");
    if (oauthError && !user) {
      setLoginError(oauthError);
      window.history.replaceState(null, "", location.pathname);
    }
  }, [location.search, location.pathname, user]);

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

  function guardAdmin(element: ReactNode) {
    const isEgAdmin = user?.organizations?.some(org => org.role === "eg_admin") ?? false;
    return isEgAdmin ? element : <Navigate to="/" replace />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/convite/:token" element={<InviteView />} />
        <Route path="/redefinir/:token" element={<ResetPasswordView />} />
        <Route path="/privacidade" element={<PrivacyView />} />
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
      <Sidebar
        visibleNavItems={visibleNavItems}
        user={user}
        onLogout={handleLogout}
        isLoggingOut={logout.isPending}
      />

      <section className="workspace">
        <Topbar />

        {dataError && <div className="notice error">{dataError}</div>}

        <Routes>
          <Route path="/" element={<CockpitView />} />
          <Route path="/configuracoes" element={<SettingsView />} />

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

          {/* Rotas Administrativas EG */}
          <Route path="/eg-office" element={guardAdmin(
            <Suspense fallback={<ViewLoadingFallback />}>
              <OfficeView />
            </Suspense>,
          )} />
          <Route path="/eg-ideas" element={guardAdmin(
            <Suspense fallback={<ViewLoadingFallback />}>
              <IdeaBankView />
            </Suspense>,
          )} />
          <Route path="/eg-tech" element={guardAdmin(
            <Suspense fallback={<ViewLoadingFallback />}>
              <TechRadarView />
            </Suspense>,
          )} />
          <Route path="/eg-architecture" element={guardAdmin(
            <Suspense fallback={<ViewLoadingFallback />}>
              <ArchitectureView />
            </Suspense>,
          )} />

          <Route path="/convite/:token" element={<InviteView />} />
          <Route path="/redefinir/:token" element={<ResetPasswordView />} />
          <Route path="/privacidade" element={<PrivacyView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </section>

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
