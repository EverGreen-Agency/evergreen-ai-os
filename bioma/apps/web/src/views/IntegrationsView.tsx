import { GitBranch, Link, Activity, ShieldCheck, RefreshCw } from "lucide-react";
import { SectionHeader, HealthRow } from "../components/shared";
import { integrationRows } from "../lib/app-config";
import type { ClientSummary, SyncRunSummary } from "../lib/api";

export function IntegrationsView({
  selectedClient,
  latestSync,
  isEgAdmin,
  actionBusy,
  onClickUpSync,
}: {
  selectedClient: ClientSummary | null;
  latestSync: SyncRunSummary | null;
  isEgAdmin: boolean;
  actionBusy: string | null;
  onClickUpSync: () => void;
}) {
  return (
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
        {isEgAdmin && selectedClient && (
          <button className="primary-button wide" type="button" onClick={onClickUpSync} disabled={actionBusy === "clickup:sync"}>
            <RefreshCw size={16} />
            Rodar sync dry-run
          </button>
        )}
      </article>
    </section>
  );
}
