import {
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  GitBranch,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { deliverableStatusLabel, statusLabel } from "../lib/app-config";
import type { ClientSummary, CurrentUser, DeliverableSummary } from "../lib/api";
import { formatDueDate } from "../lib/format";
import { EmptyState, HealthRow, SectionHeader } from "../components/shared";

export function CockpitView({
  user,
  selectedClient,
  metrics,
  pendingApprovals,
  activeDeliverables,
  latestSync,
  onGoClients,
  onGoContent,
}: {
  user: CurrentUser;
  selectedClient: ClientSummary | null;
  metrics: Array<{ label: string; value: string; delta: string; tone: string }>;
  pendingApprovals: Array<{ id: string; deliverable_title: string | null; comment: string | null }>;
  activeDeliverables: DeliverableSummary[];
  latestSync: string | undefined;
  onGoClients: () => void;
  onGoContent: () => void;
}) {
  return (
    <>
      <section className="hero-grid">
        <article className="command-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Sessão</p>
              <h2>{user.display_name}</h2>
            </div>
            <LockKeyhole size={24} />
          </div>
          <div className="session-card">
            <strong>{selectedClient?.name ?? "Nenhum cliente selecionado"}</strong>
            <span>{user.email}</span>
            <small>
              {selectedClient
                ? `${selectedClient.organization_name} · ${statusLabel[selectedClient.status]}`
                : "Escolha um cliente para operar"}
            </small>
          </div>
          <div className="quick-actions">
            <button type="button" onClick={onGoClients}>
              <Users size={16} />
              Abrir clientes
            </button>
            <button type="button" onClick={onGoContent}>
              <BookOpen size={16} />
              Ver conteúdo
            </button>
          </div>
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
          <SectionHeader eyebrow="Fila de trabalho" title="Próximas ações" icon={CalendarCheck} />
          <div className="timeline-list">
            {pendingApprovals.map((approval) => (
              <div className="timeline-row" key={approval.id}>
                <span>Aprovação</span>
                <strong>{approval.deliverable_title ?? "Aprovação pendente"}</strong>
                <small>{approval.comment ?? "Sem comentário"}</small>
              </div>
            ))}
            {activeDeliverables.slice(0, 5).map((deliverable) => (
              <div className="timeline-row" key={deliverable.id}>
                <span>{formatDueDate(deliverable.due_at)}</span>
                <strong>{deliverable.title}</strong>
                <small>{deliverableStatusLabel[deliverable.status]}</small>
              </div>
            ))}
            {pendingApprovals.length === 0 && activeDeliverables.length === 0 && <EmptyState text="Nenhuma ação pendente." />}
          </div>
        </article>

        <article className="surface">
          <SectionHeader eyebrow="Operação" title="Sinais do MVP" icon={Sparkles} />
          <div className="health-list">
            <HealthRow icon={ClipboardCheck} label="Client Hub" ok={Boolean(selectedClient)} value={selectedClient?.name ?? "sem cliente"} />
            <HealthRow icon={GitBranch} label="ClickUp" ok={latestSync !== "error"} value={latestSync ?? "dry-run pendente"} />
            <HealthRow icon={ShieldCheck} label="Escopo" ok value="EG admin + cliente" />
          </div>
        </article>
      </section>
    </>
  );
}
