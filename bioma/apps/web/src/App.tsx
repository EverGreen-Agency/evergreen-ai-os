import { FormEvent, ReactNode, Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { enabledModulesFor, navItems, viewModule, type ViewId } from "./lib/app-config";
import { externalClients } from "./lib/client-scope";
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
import {
  ClientAnalyticsRoute,
  ClientCrmRoute,
  ClientFilesRoute,
  ClientFinanceRoute,
  ClientIntegrationsRoute,
  ClientWorkspaceView,
} from "./views/ClientWorkspaceView";

const ClientsView = lazy(() => import("./views/ClientsView").then((module) => ({ default: module.ClientsView })));
const ClientHubView = lazy(() => import("./views/ClientHubView").then((module) => ({ default: module.ClientHubView })));
const WikiEgView = lazy(() => import("./views/admin/WikiEgView").then((module) => ({ default: module.WikiEgView })));
const EngineeringView = lazy(() => import("./views/EngineeringView").then((module) => ({ default: module.EngineeringView })));
const AgencyWorkspaceView = lazy(() => import("./views/AgencyWorkspaceView").then((module) => ({ default: module.AgencyWorkspaceView })));
const AgencyOverviewRoute = lazy(() => import("./views/AgencyWorkspaceView").then((module) => ({ default: module.AgencyOverviewRoute })));
const AgencyCrmRoute = lazy(() => import("./views/AgencyWorkspaceView").then((module) => ({ default: module.AgencyCrmRoute })));
const AgencyFinanceRoute = lazy(() => import("./views/AgencyWorkspaceView").then((module) => ({ default: module.AgencyFinanceRoute })));
const AgencyAnalyticsRoute = lazy(() => import("./views/AgencyWorkspaceView").then((module) => ({ default: module.AgencyAnalyticsRoute })));

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

  const { data: clientsData, isLoading: loadingClients } = useClients();
  const allClients = clientsData ?? [];
  const clients = externalClients(allClients);

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
  const visibleNavItems = navItems
    .filter((item) => enabledModules.has(viewModule[item.id]))
    .filter((item) => isEgAdmin || item.id === "clientes")
    .map((item) => !isEgAdmin && item.id === "clientes" ? { ...item, label: "Meu Hub" } : item);
  const clientHomePath = !isEgAdmin && clients.length === 1 ? `/clientes/${clients[0].id}` : "/clientes";

  function guard(view: ViewId, element: ReactNode) {
    return enabledModules.has(viewModule[view]) ? element : <Navigate to="/" replace />;
  }

  function guardAdmin(element: ReactNode) {
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
        clientHomePath={clientHomePath}
      />

      <section className="workspace">
        <Topbar user={user} clients={allClients} isLoadingClients={loadingClients} />

        {dataError && <div className="notice error">{dataError}</div>}

        <Routes>
          <Route
            path="/"
            element={
              isEgAdmin
                ? <CockpitView />
                : loadingClients
                  ? <ViewLoadingFallback />
                  : <Navigate to={clientHomePath} replace />
            }
          />
          <Route path="/configuracoes" element={<SettingsView />} />

          <Route path="/operacao" element={guardAdmin(
            <Suspense fallback={<ViewLoadingFallback />}>
              <AgencyWorkspaceView />
            </Suspense>,
          )}>
            <Route index element={<AgencyOverviewRoute />} />
            <Route path="crm" element={<AgencyCrmRoute />} />
            <Route path="financeiro" element={<AgencyFinanceRoute />} />
            <Route path="metricas" element={<AgencyAnalyticsRoute />} />
          </Route>

          <Route path="/clientes" element={guard("clientes",
            <Suspense fallback={<ViewLoadingFallback />}>
              <ClientsView />
            </Suspense>,
          )} />
          
          <Route path="/clientes/:id" element={guard("clientes", <ClientWorkspaceView />)}>
            <Route index element={
              <Suspense fallback={<ViewLoadingFallback />}>
                <ClientHubView />
              </Suspense>
            } />
            <Route path="crm" element={<ClientCrmRoute />} />
            <Route path="financeiro" element={<ClientFinanceRoute />} />
            <Route path="analytics" element={<ClientAnalyticsRoute />} />
            <Route path="documentos" element={<ClientFilesRoute />} />
            <Route path="integracoes" element={guardAdmin(<ClientIntegrationsRoute />)} />
          </Route>

          {/* Compatibilidade: módulos operacionais sempre resolvem um workspace explícito. */}
          <Route path="/crm" element={<Navigate to={isEgAdmin ? "/operacao/crm" : clientHomePath} replace />} />
          <Route path="/finance" element={<Navigate to={isEgAdmin ? "/operacao/financeiro" : clientHomePath} replace />} />
          <Route path="/analytics" element={<Navigate to={isEgAdmin ? "/operacao/metricas" : clientHomePath} replace />} />

          <Route path="/engenharia" element={guardAdmin(
            <Suspense fallback={<ViewLoadingFallback />}>
              <EngineeringView />
            </Suspense>,
          )} />

          {/* Rotas Administrativas EG */}
          <Route path="/eg-wiki" element={guardAdmin(
            <Suspense fallback={<ViewLoadingFallback />}>
              <WikiEgView />
            </Suspense>,
          )} />
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
