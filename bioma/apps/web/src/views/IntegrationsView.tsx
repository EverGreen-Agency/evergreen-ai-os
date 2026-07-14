import { GitBranch, Link, Activity, ShieldCheck, RefreshCw } from "lucide-react";
import { SectionHeader, HealthRow } from "../components/shared";
import { integrationRows } from "../lib/app-config";
import { useUiStore } from "../store/uiStore";
import { useApiHealth, useCurrentUser, useClients, useClientPortal, useSyncClickUp } from "../hooks/useBiomaApi";

export function IntegrationsView() {
  const { selectedClientId } = useUiStore();
  const { data: healthData } = useApiHealth();
  const { data: user } = useCurrentUser();
  const { data: clientsData } = useClients();
  const { data: portalData } = useClientPortal(selectedClientId);
  
  const syncClickUp = useSyncClickUp();

  const apiOnline = healthData?.status === "ok";
  const userRole = user?.organizations[0]?.role;
  const isEgAdmin = user?.organizations.some((organization) => organization.slug === "eg" && organization.role === "eg_admin") ?? false;
  
  const clients = clientsData ?? [];
  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;
  const portal = portalData ?? null;
  const latestSync = portal?.sync_runs.find((run) => run.source === "clickup") ?? null;

  function handleClickUpSync() {
    if (selectedClientId) {
      syncClickUp.mutate(selectedClientId);
    }
  }

  return (
    <section className="content-grid">
      <article className="surface">
        <SectionHeader eyebrow="Sistema" title="Status do Bioma" icon={Activity} />
        <div className="health-list">
          <HealthRow icon={Activity} label="API Backend" ok={apiOnline} value={apiOnline ? "online" : "offline"} />
          <HealthRow icon={ShieldCheck} label="Nível de acesso" ok={true} value={userRole === "eg_admin" ? "EG admin" : "Cliente"} />
        </div>
      </article>
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
        {isEgAdmin && selectedClient && (
          <button className="primary-button wide" type="button" onClick={handleClickUpSync} disabled={syncClickUp.isPending}>
            <RefreshCw size={16} />
            Rodar sync dry-run
          </button>
        )}
      </article>
    </section>
  );
}
