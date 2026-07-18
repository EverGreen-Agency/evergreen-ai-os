import { Suspense, lazy, useEffect } from "react";
import { ArrowLeft, Building2 } from "lucide-react";
import { NavLink, Outlet, useNavigate, useOutletContext, useParams } from "react-router-dom";

import { EmptyState } from "../components/shared";
import { clientHubNavItems } from "../lib/app-config";
import type { ClientSummary } from "../lib/api";
import { externalClients } from "../lib/client-scope";
import { useClients, useCurrentUser } from "../hooks/useBiomaApi";
import { useUiStore } from "../store/uiStore";

const AnalyticsView = lazy(() => import("./AnalyticsView").then((module) => ({ default: module.AnalyticsView })));
const CrmView = lazy(() => import("./CrmView").then((module) => ({ default: module.CrmView })));
const FinanceView = lazy(() => import("./FinanceView").then((module) => ({ default: module.FinanceView })));
const FilesPanel = lazy(() => import("../components/FilesPanel").then((module) => ({ default: module.FilesPanel })));
const IntegrationsTab = lazy(() => import("../components/IntegrationsTab").then((module) => ({ default: module.IntegrationsTab })));

type ClientWorkspaceContext = {
  client: ClientSummary;
  isEgAdmin: boolean;
};

function ModuleLoading() {
  return <EmptyState text="Carregando módulo do cliente..." />;
}

export function ClientWorkspaceView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: clientsData, isLoading } = useClients();
  const { data: user } = useCurrentUser();
  const setSelectedClientId = useUiStore((state) => state.setSelectedClientId);

  const clients = externalClients(clientsData ?? []);
  const client = clients.find((candidate) => candidate.id === id) ?? null;
  const isEgAdmin = user?.organizations.some((organization) => organization.role === "eg_admin") ?? false;

  useEffect(() => {
    if (!client) return;
    setSelectedClientId(client.id);
    return () => {
      if (useUiStore.getState().selectedClientId === client.id) {
        setSelectedClientId(null);
      }
    };
  }, [client, setSelectedClientId]);

  if (isLoading) {
    return <EmptyState text="Carregando Hub do Cliente..." />;
  }

  if (!client) {
    return (
      <section className="client-workspace-empty">
        <EmptyState text="Cliente não encontrado ou indisponível para esta sessão." />
        <button className="primary-button" type="button" onClick={() => navigate("/clientes")}>
          Voltar para a Carteira
        </button>
      </section>
    );
  }

  const enabledModules = new Set(client.enabled_modules ?? ["hub"]);
  enabledModules.add("hub");
  const visibleItems = clientHubNavItems.filter(
    (item) => (isEgAdmin || enabledModules.has(item.module)) && (item.id !== "integrations" || isEgAdmin),
  );

  return (
    <section className="client-workspace-shell">
      <header className="client-context-bar">
        <button className="icon-button" type="button" onClick={() => navigate("/clientes")} aria-label="Voltar para a Carteira">
          <ArrowLeft size={18} />
        </button>
        <div className="client-context-title">
          <span><Building2 size={14} /> Hub do Cliente</span>
          <strong>{client.name}</strong>
        </div>
        <nav className="client-context-nav" aria-label={`Módulos de ${client.name}`}>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const destination = item.path ? `/clientes/${client.id}/${item.path}` : `/clientes/${client.id}`;
            return (
              <NavLink key={item.id} to={destination} end={!item.path}>
                <Icon size={15} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </header>

      <div className="client-workspace-content">
        <Outlet context={{ client, isEgAdmin } satisfies ClientWorkspaceContext} />
      </div>
    </section>
  );
}

function useClientWorkspace() {
  return useOutletContext<ClientWorkspaceContext>();
}

export function ClientCrmRoute() {
  const { client } = useClientWorkspace();
  return <Suspense fallback={<ModuleLoading />}><CrmView clientId={client.id} /></Suspense>;
}

export function ClientFinanceRoute() {
  const { client } = useClientWorkspace();
  return <Suspense fallback={<ModuleLoading />}><FinanceView clientId={client.id} /></Suspense>;
}

export function ClientAnalyticsRoute() {
  const { client } = useClientWorkspace();
  return <Suspense fallback={<ModuleLoading />}><AnalyticsView clientId={client.id} /></Suspense>;
}

export function ClientFilesRoute() {
  const { client, isEgAdmin } = useClientWorkspace();
  return (
    <div className="client-module-panel">
      <Suspense fallback={<ModuleLoading />}><FilesPanel clientId={client.id} isEgAdmin={isEgAdmin} /></Suspense>
    </div>
  );
}

export function ClientIntegrationsRoute() {
  const { client } = useClientWorkspace();
  return (
    <div className="client-module-panel">
      <Suspense fallback={<ModuleLoading />}><IntegrationsTab clientId={client.id} scope="client" /></Suspense>
    </div>
  );
}
