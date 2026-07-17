import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ClipboardCheck, GitBranch, CalendarCheck, CircleDashed, CheckCircle2, AlertCircle, FileText, ArrowRight, Trash2, RefreshCw, ArrowLeft } from "lucide-react";
import { SectionHeader, EmptyState } from "../components/shared";
import { statusLabel, deliverableStatusLabel } from "../lib/app-config";
import { clickUpSummary, formatDueDate, artifactKindLabel } from "../lib/format";
import type { DeliverableStatus } from "../lib/api";
import { AdminDock } from "../components/AdminDock";
import { useUiStore } from "../store/uiStore";
import { useClients, useClientPortal, useSyncClickUp, useUpdateDeliverable, useDeleteDeliverable, useCreateApproval, useDecideApproval, useCurrentUser } from "../hooks/useBiomaApi";

export function ClientHubView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("resumo");
  
  const { setSelectedArtifact, setSelectedClientId } = useUiStore();

  const { data: user } = useCurrentUser();
  const isEgAdmin = user?.email?.endsWith("@evergreenmkt.com.br") ?? false;

  const { data: clientsData } = useClients();
  const clients = clientsData ?? [];
  const selectedClient = clients.find((c) => c.id === id) ?? null;

  const { data: portalData, isLoading: loadingPortal } = useClientPortal(id ?? null);
  const portal = portalData ?? null;
  const latestSync = portal?.sync_runs.find((run) => run.source === "clickup")?.status;

  const syncClickUp = useSyncClickUp();
  const updateDeliverable = useUpdateDeliverable();
  const deleteDeliverable = useDeleteDeliverable();
  const createApproval = useCreateApproval();
  const decideApproval = useDecideApproval();

  const isBusy = syncClickUp.isPending || updateDeliverable.isPending || deleteDeliverable.isPending || createApproval.isPending || decideApproval.isPending;

  // Atualiza o estado global se o admin dock for usado (já que ele usa o selectedClient do UiStore)
  // Mas para não causar bugs de render loop, apenas se não bater.
  if (id && useUiStore.getState().selectedClientId !== id) {
    setSelectedClientId(id);
  }

  if (!selectedClient) {
    return (
      <section style={{ padding: '24px' }}>
        <EmptyState text="Cliente não encontrado." />
        <button className="primary-button" type="button" onClick={() => navigate('/clientes')} style={{ marginTop: '16px' }}>Voltar para a lista</button>
      </section>
    );
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px 24px 0 24px' }}>
        <button 
          type="button"
          className="icon-button" 
          onClick={() => {
            setSelectedClientId(null);
            navigate("/clientes");
          }} 
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)' }}
        >
          <ArrowLeft size={18} />
        </button>
        <SectionHeader eyebrow="Hub do cliente" title={selectedClient.name} icon={ClipboardCheck} />
      </div>

      {loadingPortal && <EmptyState text="Carregando hub..." />}
      {!loadingPortal && portal && (
        <div style={{ padding: '24px' }}>
          <div className="tabs" style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-soft)', paddingBottom: '0', marginBottom: '24px' }}>
            {[
              { id: 'resumo', label: 'Resumo' },
              { id: 'entregas', label: 'Entregas' },
              { id: 'artefatos', label: 'Artefatos' },
              { id: 'projetos', label: 'Projetos e Contratos' },
              { id: 'score', label: 'Score' }
            ].map(tab => {
               return (
                <button 
                  key={tab.id} 
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: activeTab === tab.id ? 'var(--brand-accent)' : 'var(--text-muted)',
                    fontWeight: activeTab === tab.id ? '600' : '400',
                    cursor: 'pointer',
                    paddingBottom: '12px',
                    marginBottom: '-1px',
                    borderBottom: activeTab === tab.id ? '2px solid var(--brand-accent)' : '2px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {activeTab === 'resumo' && (
            <div className="bento-grid">
              <article className="bento-card col-span-1" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)' }}>
                <div className="bento-header">
                  <h3>{selectedClient.organization_name}</h3>
                  <span className={`status-pill ${selectedClient.status}`}>{statusLabel[selectedClient.status]}</span>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <p>Responsável: <strong>{selectedClient.responsible_name ?? "não definido"}</strong></p>
                </div>
                <div className="sync-summary" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <GitBranch size={16} />
                  <span style={{ fontSize: '13px' }}>{clickUpSummary(selectedClient.clickup_folder_id, latestSync)}</span>
                  {isEgAdmin && (
                    <button className="sync-button" type="button" onClick={() => syncClickUp.mutate(selectedClient.id)} disabled={isBusy} style={{ marginLeft: 'auto' }}>
                      <RefreshCw size={14} /> Sincronizar
                    </button>
                  )}
                </div>
              </article>
              
              <article className="bento-card col-span-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)' }}>
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
                      <button className="mini-button approve" type="button" onClick={() => decideApproval.mutate({ clientId: selectedClient.id, approvalId: approval.id, status: "approved" })} disabled={isBusy}>
                        Aprovar
                      </button>
                      <button className="mini-button reject" type="button" onClick={() => decideApproval.mutate({ clientId: selectedClient.id, approvalId: approval.id, status: "rejected" })} disabled={isBusy}>
                        Reprovar
                      </button>
                    </div>
                  </div>
                ))}
              </article>
            </div>
          )}

          {activeTab === 'entregas' && (
            <div className="bento-grid">
              <article className="bento-card col-span-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)' }}>
                <div className="bento-header">
                  <h3>Todas as Entregas</h3>
                  <CalendarCheck size={16} color="var(--brand-accent)" />
                </div>
                {portal.deliverables.length === 0 && <EmptyState compact text="Nenhuma entrega cadastrada." />}
                {portal.deliverables.map((deliverable) => (
                  <div className="work-row" key={deliverable.id}>
                    <CircleDashed size={16} />
                    <div>
                      <strong>{deliverable.title}</strong>
                      <small>{formatDueDate(deliverable.due_at)} · {deliverable.clickup_task_id ?? "sem ClickUp"}</small>
                      {deliverable.assignee_emails?.length > 0 && (
                        <small style={{ color: 'var(--brand-accent)', display: 'block', marginTop: '4px' }}>
                          Atribuído: {deliverable.assignee_emails.join(", ")}
                        </small>
                      )}
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
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`status-pill ${deliverable.status}`}>{deliverableStatusLabel[deliverable.status]}</span>
                      )}
                      {isEgAdmin && deliverable.status !== "done" && !portal.approvals.some((approval) => approval.deliverable_id === deliverable.id && approval.status === "pending") && (
                        <button className="mini-button approve" type="button" onClick={() => createApproval.mutate({ clientId: selectedClient.id, deliverableId: deliverable.id })} disabled={isBusy}>
                          Pedir aprovação
                        </button>
                      )}
                      {isEgAdmin && (
                        <button className="icon-button danger" type="button" onClick={() => deleteDeliverable.mutate({ clientId: selectedClient.id, deliverableId: deliverable.id })} aria-label={`Excluir ${deliverable.title}`} disabled={isBusy}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </article>
            </div>
          )}

          {activeTab === 'artefatos' && (
            <div className="bento-grid">
              <article className="bento-card col-span-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)' }}>
                <div className="bento-header">
                  <h3>Todos os Artefatos</h3>
                  <FileText size={16} color="var(--brand-accent)" />
                </div>
                {portal.artifacts.length === 0 && <EmptyState compact text="Nenhum artefato publicado." />}
                {portal.artifacts.map((artifact) => (
                  <button className="artifact-row" key={artifact.id} type="button" onClick={() => setSelectedArtifact(artifact)}>
                    <div>
                      <strong>{artifact.title}</strong>
                      <small>{artifactKindLabel(artifact.kind)} · {artifact.visibility === "client" ? "cliente" : "interno"}</small>
                    </div>
                    <ArrowRight size={16} />
                  </button>
                ))}
              </article>
            </div>
          )}

          {(activeTab === 'projetos' || activeTab === 'score') && (
            <div className="bento-grid">
              <article className="bento-card col-span-3" style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-soft)', textAlign: 'center', padding: '40px' }}>
                <h3>Módulo em Desenvolvimento</h3>
                <p style={{ color: 'var(--text-muted)' }}>Esta funcionalidade ficará disponível em breve. Aqui você poderá consultar {activeTab === 'projetos' ? 'os projetos contratados e assinaturas' : 'o score do seu projeto'}.</p>
              </article>
            </div>
          )}
        </div>
      )}

      {isEgAdmin && <AdminDock selectedClient={selectedClient} />}
    </section>
  );
}
