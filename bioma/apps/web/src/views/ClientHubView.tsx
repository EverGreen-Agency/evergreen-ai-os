import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { ClipboardCheck, CheckCircle2, AlertCircle, ArrowLeft, CalendarDays, Settings, Trash2 } from "lucide-react";
import { SectionHeader, EmptyState } from "../components/shared";
import { statusLabel } from "../lib/app-config";
import { externalClients } from "../lib/client-scope";
import { AdminDock } from "../components/AdminDock";
import { BriefingPanel } from "../components/BriefingPanel";
import { EditorialCalendar } from "../components/EditorialCalendar";
import { RaioXScorePanel } from "../components/RaioXScorePanel";
import { useUiStore } from "../store/uiStore";
import {
  useClients,
  useClientPortal,
  useCommercialPortal,
  useCreateApproval,
  useCreateArtifact,
  useDecideApproval,
  useDeleteDeliverable,
  useUpdateDeliverable,
  useCurrentUser,
} from "../hooks/useBiomaApi";
import { deliverableStatusLabel } from "../lib/app-config";
import type { DeliverableStatus } from "../lib/api";
import type { ClientWorkspaceOutletContext } from "./ClientWorkspaceView";

export function ClientHubView() {
  const { id } = useParams<{ id: string }>();
  const { workspace } = useOutletContext<ClientWorkspaceOutletContext>();
  const contextId = workspace.workspaceId;
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const { setSelectedClientId, setSelectedArtifact } = useUiStore();

  const { data: user, isLoading: loadingUser } = useCurrentUser();
  const isEgAdmin = !loadingUser && (user?.organizations.some((org: { role: string }) => org.role === "eg_admin") ?? false);

  const { data: clientsData } = useClients();
  const clients = externalClients(clientsData ?? []);
  const selectedClient = clients.find((c) => c.id === id) ?? null;

  const { data: portalData, isLoading: loadingPortal } = useClientPortal(contextId);
  const portal = portalData ?? null;
  const decideApproval = useDecideApproval();
  const createArtifact = useCreateArtifact();
  const createApproval = useCreateApproval();
  const updateDeliverable = useUpdateDeliverable();
  const deleteDeliverable = useDeleteDeliverable();
  const { data: commercialData, refetch: refetchCommercial } = useCommercialPortal(contextId);
  
  const isBusy =
    decideApproval.isPending ||
    createApproval.isPending ||
    updateDeliverable.isPending ||
    deleteDeliverable.isPending;

  useEffect(() => {
    if (id && useUiStore.getState().selectedClientId !== id) {
      setSelectedClientId(id);
    }
  }, [id, setSelectedClientId]);

  if (!selectedClient) {
    return (
      <section style={{ padding: '24px' }}>
        <EmptyState text="Cliente não encontrado." />
        <button className="primary-button" type="button" onClick={() => navigate('/clientes')} style={{ marginTop: '16px' }}>Voltar para a lista</button>
      </section>
    );
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px 32px 0 32px' }}>
        <button 
          type="button"
          className="icon-button" 
          onClick={() => {
            setSelectedClientId(null);
            navigate("/");
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <SectionHeader eyebrow="Dashboard" title="Visão Geral" icon={ClipboardCheck} />
          {isEgAdmin && (
            <button 
              className="secondary-button" 
              type="button" 
              onClick={() => setDrawerOpen(true)}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Settings size={16} />
              Gerenciar Cliente
            </button>
          )}
        </div>
      </div>

      {loadingPortal && <EmptyState text="Carregando hub..." />}
      {!loadingPortal && portal && (
        <div style={{ padding: '24px 32px', flex: 1 }}>
          <div className="bento-grid">
            <article className="bento-card col-span-1">
              <div className="bento-header">
                <h3>{selectedClient.organization_name}</h3>
                <span className={`status-pill ${selectedClient.status}`}>{statusLabel[selectedClient.status]}</span>
              </div>
              <div style={{ marginTop: '16px' }}>
                <p>Responsável: <strong>{selectedClient.responsible_name ?? "não definido"}</strong></p>
              </div>
            </article>
            
            <article className="bento-card col-span-2">
              <div className="bento-header">
                <h3>Aprovações Pendentes</h3>
                <CheckCircle2 size={16} color="var(--brand-accent)" />
              </div>
              {portal.approvals.filter(a => a.status === 'pending').length === 0 && <EmptyState compact text="Tudo em dia." />}
              {portal.approvals.filter(a => a.status === 'pending').map((approval) => (
                <div className="work-row" key={approval.id}>
                  <AlertCircle size={16} />
                  <div>
                    <strong>{approval.deliverable_title ?? "Aprovação"}</strong>
                    <small>{approval.comment ?? "Sem comentário"}</small>
                  </div>
                  <div className="row-actions">
                    <button className="mini-button approve" type="button" onClick={() => decideApproval.mutate({ clientId: contextId, approvalId: approval.id, status: "approved" })} disabled={isBusy}>
                      Aprovar
                    </button>
                    <button className="mini-button reject" type="button" onClick={() => decideApproval.mutate({ clientId: contextId, approvalId: approval.id, status: "rejected" })} disabled={isBusy}>
                      Reprovar
                    </button>
                  </div>
                </div>
              ))}
            </article>
          </div>

          <article className="surface" style={{ marginTop: "24px" }}>
            <div className="surface-header">
              <CalendarDays size={18} />
              <h3>Entregas da semana</h3>
            </div>
            <div style={{ padding: "0 20px 16px" }}>
              <EditorialCalendar deliverables={portal.deliverables} />
            </div>

            <div style={{ padding: "0 20px 20px" }}>
              {portal.deliverables.length === 0 && (
                <EmptyState compact text="Nenhuma entrega cadastrada para este cliente." />
              )}
              {portal.deliverables.map((deliverable) => {
                const awaitingApproval = portal.approvals.some(
                  (approval) => approval.status === "pending" && approval.deliverable_id === deliverable.id,
                );
                return (
                  <div className="work-row" key={deliverable.id}>
                    <div>
                      <strong>{deliverable.title}</strong>
                      <small>
                        {deliverableStatusLabel[deliverable.status]}
                        {deliverable.due_at
                          ? ` · vence ${new Date(deliverable.due_at).toLocaleDateString("pt-BR")}`
                          : " · sem prazo"}
                      </small>
                    </div>
                    {isEgAdmin && (
                      <div className="row-actions">
                        <select
                          value={deliverable.status}
                          disabled={isBusy}
                          onChange={(event) =>
                            updateDeliverable.mutate({
                              clientId: contextId,
                              deliverableId: deliverable.id,
                              payload: { status: event.target.value as DeliverableStatus },
                            })
                          }
                        >
                          {(Object.keys(deliverableStatusLabel) as DeliverableStatus[]).map((status) => (
                            <option key={status} value={status}>
                              {deliverableStatusLabel[status]}
                            </option>
                          ))}
                        </select>
                        {/* Uma entrega so pode ter uma aprovacao pendente por vez;
                            sem esse guard o cliente recebia pedidos duplicados. */}
                        <button
                          className="mini-button"
                          type="button"
                          disabled={isBusy || awaitingApproval}
                          title={awaitingApproval ? "Ja existe aprovacao pendente" : "Pedir aprovacao ao cliente"}
                          onClick={() =>
                            createApproval.mutate({ clientId: contextId, deliverableId: deliverable.id })
                          }
                        >
                          {awaitingApproval ? "Aguardando cliente" : "Pedir aprovação"}
                        </button>
                        <button
                          className="mini-button reject"
                          type="button"
                          disabled={isBusy}
                          onClick={() => {
                            if (!window.confirm(`Excluir a entrega "${deliverable.title}"?`)) return;
                            deleteDeliverable.mutate({ clientId: contextId, deliverableId: deliverable.id });
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </article>

          <div style={{ marginTop: "24px" }}>
            <RaioXScorePanel
              workspaceId={contextId}
              data={commercialData ?? null}
              onUpdate={refetchCommercial}
              canEdit={isEgAdmin}
            />
          </div>

          <article className="surface" style={{ marginTop: "24px" }}>
            <BriefingPanel
              briefing={portal.artifacts.find((artifact) => artifact.kind === "briefing") ?? null}
              onEdit={setSelectedArtifact}
            />
            {isEgAdmin && !portal.artifacts.some((artifact) => artifact.kind === "briefing") && (
              <button
                className="secondary-button"
                type="button"
                style={{ marginTop: "12px" }}
                disabled={createArtifact.isPending}
                onClick={() =>
                  createArtifact.mutate({
                    clientId: contextId,
                    payload: { title: "Briefing estratégico", kind: "briefing", visibility: "internal", content: "" },
                  })
                }
              >
                {createArtifact.isPending ? "Criando..." : "Criar briefing"}
              </button>
            )}
          </article>
        </div>
      )}

      {selectedClient && (
        <AdminDock selectedClient={selectedClient} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      )}
    </section>
  );
}
