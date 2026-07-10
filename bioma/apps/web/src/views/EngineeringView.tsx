import { FileText, Server, Activity, ShieldCheck } from "lucide-react";
import { SectionHeader, HealthRow, EmptyState } from "../components/shared";
import { formatDateTime, auditLabel, compactMetadata } from "../lib/format";
import type { ClientPortal, CurrentUser, ClientSummary } from "../lib/api";

export function EngineeringView({
  portal,
  apiOnline,
  user,
  clients,
}: {
  portal: ClientPortal | null;
  apiOnline: boolean;
  user: CurrentUser | null;
  clients: ClientSummary[];
}) {
  return (
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
          {!portal?.audit_logs?.length && <EmptyState text="Sem eventos de auditoria para o cliente selecionado." />}
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
  );
}
