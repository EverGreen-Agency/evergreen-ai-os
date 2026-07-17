import { Users, ClipboardCheck, GitBranch, CalendarCheck, CircleDashed, CheckCircle2, AlertCircle, FileText, ArrowRight, Trash2, RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SectionHeader, EmptyState, HubBlock } from "../components/shared";
import { statusLabel, deliverableStatusLabel } from "../lib/app-config";
import { clickUpSummary, formatDueDate, approvalStatusLabel, artifactKindLabel } from "../lib/format";
import type { ArtifactSummary, DeliverableStatus } from "../lib/api";
import { AdminDock } from "../components/AdminDock";
import { useUiStore } from "../store/uiStore";
import { useClients, useClientPortal, useSyncClickUp, useUpdateDeliverable, useDeleteDeliverable, useCreateApproval, useDecideApproval, useCurrentUser } from "../hooks/useBiomaApi";

export function ClientsView() {
  const navigate = useNavigate();

  const { data: clientsData, isLoading: loadingClients } = useClients();
  const clients = clientsData ?? [];

  return (
    <section style={{ padding: '32px', width: '100%' }}>
        <div style={{ marginBottom: '28px' }}>
          <SectionHeader eyebrow="Client Hub" title="Carteira" icon={Users} />
        </div>
        {loadingClients && <EmptyState text="Carregando clientes..." />}
        {!loadingClients && clients.length === 0 && <EmptyState text="Nenhum cliente disponível para esta sessão." />}
        <div className="bento-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {clients.map((client) => (
            <button
              className="client-card"
              key={client.id}
              type="button"
              onClick={() => navigate(`/clientes/${client.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '8px' }}>
                <strong style={{ fontSize: '1.05rem', lineHeight: 1.3 }}>{client.name}</strong>
                <span className={`status-pill ${client.status}`}>{statusLabel[client.status]}</span>
              </div>
              <small style={{ display: 'block', textAlign: 'left', marginBottom: '16px', color: 'var(--text-muted)' }}>
                Responsável: {client.responsible_name ?? "Sem responsável"}
              </small>
              <div className="client-card-meta" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', opacity: 0.8 }}>
                <span>{client.deliverables_total} entregas</span>
                <span>{client.approvals_pending} aprovações</span>
                <span>{client.artifacts_client} artefatos</span>
              </div>
            </button>
          ))}
        </div>
    </section>
  );
}
