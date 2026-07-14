import { Users, ClipboardCheck, GitBranch, CalendarCheck, CircleDashed, CheckCircle2, AlertCircle, FileText, ArrowRight, Trash2, RefreshCw } from "lucide-react";
import { SectionHeader, EmptyState, HubBlock } from "../components/shared";
import { statusLabel, deliverableStatusLabel } from "../lib/app-config";
import { clickUpSummary, formatDueDate, approvalStatusLabel, artifactKindLabel } from "../lib/format";
import type { ArtifactSummary, DeliverableStatus } from "../lib/api";
import { AdminDock } from "../components/AdminDock";
import { useUiStore } from "../store/uiStore";
import { useClients, useClientPortal, useSyncClickUp, useUpdateDeliverable, useDeleteDeliverable, useCreateApproval, useDecideApproval, useCurrentUser } from "../hooks/useBiomaApi";

export function ClientsView() {
  const {
    selectedClientId,
    setSelectedClientId,
    setSelectedArtifact,
  } = useUiStore();

  const { data: user } = useCurrentUser();
  const isEgAdmin = user?.email?.endsWith("@evergreenmkt.com.br") ?? false;

  const { data: clientsData, isLoading: loadingClients } = useClients();
  const clients = clientsData ?? [];
  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;

  const { data: portalData, isLoading: loadingPortal } = useClientPortal(selectedClientId);
  const portal = portalData ?? null;
  const latestSync = portal?.sync_runs.find((run) => run.source === "clickup")?.status;

  const syncClickUp = useSyncClickUp();
  const updateDeliverable = useUpdateDeliverable();
  const deleteDeliverable = useDeleteDeliverable();
  const createApproval = useCreateApproval();
  const decideApproval = useDecideApproval();

  const isBusy = syncClickUp.isPending || updateDeliverable.isPending || deleteDeliverable.isPending || createApproval.isPending || decideApproval.isPending;

  return (
    <section className="client-layout">
      <article className="surface client-list-panel">
        <SectionHeader eyebrow="Client Hub" title="Carteira" icon={Users} />
        {loadingClients && <EmptyState text="Carregando clientes..." />}
        {!loadingClients && clients.length === 0 && <EmptyState text="Nenhum cliente disponível para esta sessão." />}
        <div className="client-list">
          {clients.map((client) => (
            <button
              className={client.id === selectedClientId ? "client-card selected" : "client-card"}
              key={client.id}
              type="button"
              onClick={() => setSelectedClientId(client.id)}
            >
              <span className={`status-pill ${client.status}`}>{statusLabel[client.status]}</span>
              <strong>{client.name}</strong>
              <small>{client.responsible_name ?? "Sem responsável"}</small>
              <div className="client-card-meta">
                <span>{client.deliverables_total} entregas</span>
                <span>{client.approvals_pending} aprovações</span>
                <span>{client.artifacts_client} artefatos</span>
              </div>
            </button>
          ))}
        </div>
      </article>

      <article className="surface hub-panel">
        <SectionHeader eyebrow="Hub do cliente" title={selectedClient?.name ?? "Selecione um cliente"} icon={ClipboardCheck} />
        {loadingPortal && <EmptyState text="Carregando hub..." />}
        {!loadingPortal && selectedClient && portal && (
          <div className="hub-grid">
            <section className="hub-block highlight">
              <div>
                <span className={`status-pill ${selectedClient.status}`}>{statusLabel[selectedClient.status]}</span>
                <h3>{selectedClient.organization_name}</h3>
                <p>
                  Responsável: <strong>{selectedClient.responsible_name ?? "não definido"}</strong>
                </p>
              </div>
              <div className="sync-summary">
                <GitBranch size={18} />
                <span>{clickUpSummary(selectedClient.clickup_folder_id, latestSync)}</span>
                {isEgAdmin && (
                  <button
                    className="sync-button"
                    type="button"
                    onClick={() => syncClickUp.mutate(selectedClient.id)}
                    disabled={isBusy}
                  >
                    <RefreshCw size={14} />
                    Sincronizar
                  </button>
                )}
              </div>
            </section>

            <HubBlock title="Entregas" icon={CalendarCheck}>
              {portal.deliverables.length === 0 && <EmptyState compact text="Nenhuma entrega cadastrada." />}
              {portal.deliverables.map((deliverable) => (
                <div className="work-row" key={deliverable.id}>
                  <CircleDashed size={16} />
                  <div>
                    <strong>{deliverable.title}</strong>
                    <small>{formatDueDate(deliverable.due_at)} · {deliverable.clickup_task_id ?? "sem ClickUp"}</small>
                  </div>
                  <div className="row-tail">
                    {isEgAdmin ? (
                      <select
                        className="status-select"
                        value={deliverable.status}
                        onChange={(event) => updateDeliverable.mutate({ clientId: selectedClient.id, deliverableId: deliverable.id, payload: { status: event.target.value as DeliverableStatus } })}
                        disabled={isBusy}
                        aria-label={`Status de ${deliverable.title}`}
                      >
                        {Object.entries(deliverableStatusLabel).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`status-pill ${deliverable.status}`}>{deliverableStatusLabel[deliverable.status]}</span>
                    )}
                    {isEgAdmin &&
                      deliverable.status !== "done" &&
                      !portal.approvals.some(
                        (approval) => approval.deliverable_id === deliverable.id && approval.status === "pending",
                      ) && (
                        <button
                          className="mini-button approve"
                          type="button"
                          onClick={() => createApproval.mutate({ clientId: selectedClient.id, deliverableId: deliverable.id })}
                          disabled={isBusy}
                        >
                          Pedir aprovação
                        </button>
                      )}
                    {isEgAdmin && (
                      <button
                        className="icon-button danger"
                        type="button"
                        onClick={() => deleteDeliverable.mutate({ clientId: selectedClient.id, deliverableId: deliverable.id })}
                        aria-label={`Excluir ${deliverable.title}`}
                        disabled={isBusy}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </HubBlock>

            <HubBlock title="Aprovações" icon={CheckCircle2}>
              {portal.approvals.length === 0 && <EmptyState compact text="Nenhuma aprovação aberta." />}
              {portal.approvals.map((approval) => (
                <div className="work-row" key={approval.id}>
                  <AlertCircle size={16} />
                  <div>
                    <strong>{approval.deliverable_title ?? "Aprovação"}</strong>
                    <small>{approval.comment ?? "Sem comentário"}</small>
                  </div>
                  {approval.status === "pending" ? (
                    <div className="row-actions">
                      <button
                        className="mini-button approve"
                        type="button"
                        onClick={() => decideApproval.mutate({ clientId: selectedClient.id, approvalId: approval.id, status: "approved" })}
                        disabled={isBusy}
                      >
                        Aprovar
                      </button>
                      <button
                        className="mini-button reject"
                        type="button"
                        onClick={() => decideApproval.mutate({ clientId: selectedClient.id, approvalId: approval.id, status: "rejected" })}
                        disabled={isBusy}
                      >
                        Reprovar
                      </button>
                    </div>
                  ) : (
                    <span className={`decision-pill ${approval.status}`}>{approvalStatusLabel(approval.status)}</span>
                  )}
                </div>
              ))}
            </HubBlock>

            <HubBlock title="Artefatos" icon={FileText}>
              {portal.artifacts.length === 0 && <EmptyState compact text="Nenhum artefato publicado." />}
              {portal.artifacts.map((artifact) => (
                <button className="artifact-row" key={artifact.id} type="button" onClick={() => setSelectedArtifact(artifact)}>
                  <div>
                    <strong>{artifact.title}</strong>
                    <small>
                      {artifactKindLabel(artifact.kind)} · {artifact.visibility === "client" ? "cliente" : "interno"}
                    </small>
                  </div>
                  <ArrowRight size={16} />
                </button>
              ))}
            </HubBlock>
          </div>
        )}
      </article>

      {isEgAdmin && (
        <AdminDock selectedClient={selectedClient} />
      )}
    </section>
  );
}
