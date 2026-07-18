import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ClipboardCheck, GitBranch, CalendarCheck, CircleDashed, CheckCircle2, AlertCircle, FileText, ArrowRight, Trash2, RefreshCw, ArrowLeft, BarChart3, Leaf, TreePine, Trees, Settings, Plus, X } from "lucide-react";
import { SectionHeader, EmptyState } from "../components/shared";
import { statusLabel, deliverableStatusLabel } from "../lib/app-config";
import { clickUpSummary, formatDueDate, artifactKindLabel } from "../lib/format";
import type { DeliverableStatus } from "../lib/api";
import { AdminDock } from "../components/AdminDock";
import { useUiStore } from "../store/uiStore";
import { useClients, useClientPortal, useSyncClickUp, useUpdateDeliverable, useDeleteDeliverable, useCreateApproval, useDecideApproval, useCurrentUser, useCreateArtifact, useCreateDeliverable } from "../hooks/useBiomaApi";

export function ClientHubView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("resumo");
  
  const { setSelectedArtifact, setSelectedClientId } = useUiStore();

  // Score / Raio-X — armazenado localmente por cliente até o backend suportar
  const scoreKey = `raio_x_${id}`;
  const [scoreData, setScoreData] = useState<{
    oferta: number | null;
    demanda: number | null;
    conversao: number | null;
    updatedAt?: string;
  }>(() => {
    try {
      const stored = localStorage.getItem(scoreKey);
      return stored ? JSON.parse(stored) : { oferta: null, demanda: null, conversao: null };
    } catch { return { oferta: null, demanda: null, conversao: null }; }
  });

  const saveScore = (updated: typeof scoreData) => {
    const withDate = { ...updated, updatedAt: new Date().toISOString() };
    setScoreData(withDate);
    localStorage.setItem(scoreKey, JSON.stringify(withDate));
  };

  const { data: user, isLoading: loadingUser } = useCurrentUser();
  const isEgAdmin = !loadingUser && (user?.organizations.some(org => org.role === "eg_admin") ?? false);

  const [drawerOpen, setDrawerOpen] = useState(false);

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
  
  const createArtifact = useCreateArtifact();
  const createDeliverable = useCreateDeliverable();
  const { artifactDraft, setArtifactDraft, deliverableDraft, setDeliverableDraft } = useUiStore();
  const [showArtifactModal, setShowArtifactModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);

  const handleCreateArtifact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    createArtifact.mutate({ clientId: id, payload: artifactDraft }, {
      onSuccess: () => setShowArtifactModal(false)
    });
  };

  const handleCreateDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    createDeliverable.mutate({ clientId: id, payload: deliverableDraft }, {
      onSuccess: () => setShowDeliverableModal(false)
    });
  };

  const isBusy = syncClickUp.isPending || updateDeliverable.isPending || deleteDeliverable.isPending || createApproval.isPending || decideApproval.isPending || createArtifact.isPending || createDeliverable.isPending;

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
    <section style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px 32px 0 32px' }}>
        <button 
          type="button"
          className="icon-button" 
          onClick={() => {
            setSelectedClientId(null);
            navigate("/clientes");
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <SectionHeader eyebrow="Hub do cliente" title={selectedClient.name} icon={ClipboardCheck} />
          {isEgAdmin && (
            <button className="secondary-button" onClick={() => setDrawerOpen(true)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={16} />
              Gerenciar Cliente
            </button>
          )}
        </div>
      </div>

      {loadingPortal && <EmptyState text="Carregando hub..." />}
      {!loadingPortal && portal && (
        <div style={{ padding: '24px 32px', flex: 1 }}>
          <div className="tabs" style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0', marginBottom: '28px', flexWrap: 'wrap' }}>
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
              <article className="bento-card col-span-1">
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
              <article className="bento-card col-span-3">
                <div className="bento-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3>Todas as Entregas</h3>
                    <CalendarCheck size={16} color="var(--brand-accent)" />
                  </div>
                  {isEgAdmin && (
                    <button className="primary-button" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={() => setShowDeliverableModal(true)}>
                      <Plus size={14} /> Nova Entrega
                    </button>
                  )}
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
              <article className="bento-card col-span-3">
                <div className="bento-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3>Todos os Artefatos</h3>
                    <FileText size={16} color="var(--brand-accent)" />
                  </div>
                  {isEgAdmin && (
                    <button className="primary-button" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={() => setShowArtifactModal(true)}>
                      <Plus size={14} /> Novo Artefato
                    </button>
                  )}
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

          {activeTab === 'projetos' && (
            <div className="bento-grid">
              <article className="bento-card" style={{ borderStyle: 'dashed', textAlign: 'center', padding: '40px', gridColumn: '1 / -1' }}>
                <h3>Projetos e Contratos</h3>
                <p style={{ color: 'var(--text-muted)' }}>Esta funcionalidade ficará disponível em breve. Aqui você poderá consultar os projetos contratados e assinaturas.</p>
              </article>
            </div>
          )}

          {activeTab === 'score' && (
            <ScoreTab
              scoreData={scoreData}
              onSave={saveScore}
              isAdmin={isEgAdmin}
            />
          )}
        </div>
      )}

      {isEgAdmin && <AdminDock selectedClient={selectedClient} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />}
      
      {/* Modals for new creations */}
      {showDeliverableModal && (
        <div className="modal-overlay" onClick={() => setShowDeliverableModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nova Entrega</h3>
              <button className="icon-btn" onClick={() => setShowDeliverableModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateDeliverable} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-grid two">
                  <label>
                    Título / Resumo
                    <input
                      required
                      value={deliverableDraft.title ?? ""}
                      onChange={(event) => setDeliverableDraft({ ...deliverableDraft, title: event.target.value })}
                    />
                  </label>
                  <label>
                    Data de Vencimento
                    <input
                      type="date"
                      value={deliverableDraft.due_at ?? ""}
                      onChange={(event) => setDeliverableDraft({ ...deliverableDraft, due_at: event.target.value })}
                    />
                  </label>
                  <label>
                    ClickUp Task ID
                    <input
                      value={deliverableDraft.clickup_task_id ?? ""}
                      onChange={(event) => setDeliverableDraft({ ...deliverableDraft, clickup_task_id: event.target.value })}
                    />
                  </label>
                </div>
                <button className="primary-button" type="submit" disabled={isBusy} style={{ alignSelf: 'flex-start' }}>
                  <Plus size={16} />
                  Cadastrar entrega
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showArtifactModal && (
        <div className="modal-overlay" onClick={() => setShowArtifactModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Novo Artefato</h3>
              <button className="icon-btn" onClick={() => setShowArtifactModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateArtifact} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-grid two">
                  <label>
                    Título
                    <input
                      required
                      value={artifactDraft.title ?? ""}
                      onChange={(event) => setArtifactDraft({ ...artifactDraft, title: event.target.value })}
                    />
                  </label>
                  <label>
                    Tipo
                    <select
                      value={artifactDraft.kind ?? "link"}
                      onChange={(event) => setArtifactDraft({ ...artifactDraft, kind: event.target.value as any })}
                    >
                      <option value="link">Link Externo</option>
                      <option value="text">Texto Rico</option>
                      <option value="image">Imagem</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </label>
                  <label>
                    Visibilidade
                    <select
                      value={artifactDraft.visibility ?? "client"}
                      onChange={(event) => setArtifactDraft({ ...artifactDraft, visibility: event.target.value as "client" | "internal" })}
                    >
                      <option value="client">Visível para o cliente</option>
                      <option value="internal">Apenas interno EG</option>
                    </select>
                  </label>
                  <label>
                    ClickUp Task ID
                    <input
                      value={artifactDraft.clickup_task_id ?? ""}
                      onChange={(event) => setArtifactDraft({ ...artifactDraft, clickup_task_id: event.target.value })}
                    />
                  </label>
                </div>
                <label>
                  Conteúdo / URL
                  <input
                    required
                    style={{ width: '100%' }}
                    value={artifactDraft.content ?? ""}
                    onChange={(event) => setArtifactDraft({ ...artifactDraft, content: event.target.value })}
                  />
                </label>
                <button className="primary-button" type="submit" disabled={isBusy} style={{ alignSelf: 'flex-start' }}>
                  <Plus size={16} />
                  Criar artefato
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Score Tab Component (Raio-X Comercial EG) ───────────────────────────────

type ScoreData = { oferta: number | null; demanda: number | null; conversao: number | null; updatedAt?: string; };

function pillarClass(note: number | null): string {
  if (note === null) return '';
  if (note <= 3) return 'critico';
  if (note <= 6) return 'fragil';
  if (note <= 8) return 'saudavel';
  return 'maduro';
}
function pillarLabel(note: number | null): string {
  if (note === null) return '—';
  if (note <= 3) return '🔴 Crítico';
  if (note <= 6) return '🟡 Frágil';
  if (note <= 8) return '🟢 Saudável';
  return '⭐ Maduro';
}
function generalLevel(avg: number | null): { label: string; icon: React.ReactNode } {
  if (avg === null) return { label: 'Semente', icon: <Leaf size={14} /> };
  if (avg < 3.5) return { label: 'Semente', icon: <Leaf size={14} /> };
  if (avg < 6) return { label: 'Muda', icon: <TreePine size={14} /> };
  if (avg < 8.5) return { label: 'Árvore', icon: <TreePine size={14} /> };
  return { label: 'Floresta', icon: <Trees size={14} /> };
}

function PillarBar({ label, note, isBottleneck, isAdmin, onChange }: {
  label: string; note: number | null; isBottleneck: boolean;
  isAdmin: boolean; onChange: (v: number) => void;
}) {
  const cls = pillarClass(note);
  const pct = note !== null ? (note / 10) * 100 : 0;
  return (
    <article className="bento-card pillar-card">
      <div className="pillar-title">
        <h4>{label}</h4>
        {isBottleneck && note !== null && <span className="gargalo-badge">Gargalo</span>}
      </div>
      <div className="pillar-note">{note !== null ? note.toFixed(1) : '—'}<span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-dim)' }}>/10</span></div>
      <div className="pillar-bar-track">
        <div className={`pillar-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`pillar-reading ${cls}`}>{pillarLabel(note)}</span>
      {isAdmin && (
        <div style={{ marginTop: '4px' }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
            Nota (1–5 por pergunta → 0–10):
          </label>
          <input
            type="number" min={0} max={10} step={0.1}
            value={note ?? ''}
            onChange={e => onChange(Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)))}
            style={{
              width: '80px', padding: '4px 8px', borderRadius: '8px',
              background: 'var(--bg-deep)', border: '1px solid var(--glass-border)',
              color: 'var(--text)', fontSize: '0.85rem'
            }}
          />
        </div>
      )}
    </article>
  );
}

function ScoreTab({ scoreData, onSave, isAdmin }: {
  scoreData: ScoreData; onSave: (d: ScoreData) => void; isAdmin: boolean;
}) {
  const [draft, setDraft] = useState(scoreData);
  useEffect(() => { setDraft(scoreData); }, [scoreData]);

  const hasData = draft.oferta !== null || draft.demanda !== null || draft.conversao !== null;
  const notes = [draft.oferta, draft.demanda, draft.conversao].filter((n): n is number => n !== null);
  const avg = notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : null;
  const minNote = Math.min(...(notes.length > 0 ? notes : [Infinity]));
  const level = generalLevel(avg);

  const handleSave = () => onSave(draft);

  // Apenas clientes não-admins veem o estado vazio — admin sempre pode preencher
  if (!hasData && !isAdmin) {
    return (
      <div className="bento-grid">
        <div className="score-rescore-cta">
          <BarChart3 size={32} style={{ opacity: 0.4 }} />
          <h4>Score ainda não preenchido</h4>
          <p>O Raio-X Comercial EG mede 3 pilares — Oferta, Demanda e Conversão — em uma escala de 0 a 10.<br />Aguarde o seu responsável de conta preencher o diagnóstico.</p>
        </div>
      </div>
    );
  }

  // Admin sem dados: mostra banner de início + pilares para preencher
  const showEmptyBanner = isAdmin && !hasData;

  return (
    <div className="bento-grid">
      {/* Hero / Onboarding banner */}
      {showEmptyBanner ? (
        <div className="score-rescore-cta" style={{ border: '1.5px solid rgba(58,201,123,0.25)', background: 'rgba(58,201,123,0.04)' }}>
          <BarChart3 size={28} color="var(--mint)" style={{ opacity: 0.7 }} />
          <h4 style={{ color: 'var(--mint-soft)' }}>Primeiro Raio-X</h4>
          <p>Preencha as notas dos 3 pilares abaixo para registrar o diagnóstico inicial deste cliente.<br />
          <strong>Fórmula:</strong> some as notas de 5 perguntas (1–5 cada) → divide por 5 → multiplica por 2 → resultado 0–10.</p>
        </div>
      ) : (
        <div className="score-hero">
          <span className="score-hero-label">Raio-X Comercial EG</span>
          <span className="score-hero-number">{avg !== null ? avg.toFixed(1) : '—'}</span>
          <span className={`pillar-reading ${pillarClass(avg)}`}>{pillarLabel(avg)}</span>
          <span className="level-badge" style={{ marginTop: '8px' }}>{level.icon} {level.label}</span>
          {scoreData.updatedAt && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Último re-score: {new Date(scoreData.updatedAt).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      )}

      {/* Pilares */}
      <PillarBar
        label="Oferta" note={draft.oferta}
        isBottleneck={draft.oferta !== null && draft.oferta === minNote && notes.length === 3}
        isAdmin={isAdmin}
        onChange={v => setDraft(d => ({ ...d, oferta: v }))}
      />
      <PillarBar
        label="Demanda" note={draft.demanda}
        isBottleneck={draft.demanda !== null && draft.demanda === minNote && notes.length === 3}
        isAdmin={isAdmin}
        onChange={v => setDraft(d => ({ ...d, demanda: v }))}
      />
      <PillarBar
        label="Conversão" note={draft.conversao}
        isBottleneck={draft.conversao !== null && draft.conversao === minNote && notes.length === 3}
        isAdmin={isAdmin}
        onChange={v => setDraft(d => ({ ...d, conversao: v }))}
      />

      {/* Admin CTA */}
      {isAdmin && (
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: 0 }}>
            Dados salvos localmente por enquanto · integração com backend em breve
          </p>
          <button
            type="button"
            className="sync-button"
            onClick={handleSave}
            style={{ padding: '8px 20px' }}
          >
            Salvar Score
          </button>
        </div>
      )}

      {/* Legenda metodológica */}
      <article className="bento-card" style={{ gridColumn: '1 / -1', background: 'rgba(9,35,27,0.6)' }}>
        <div className="bento-header">
          <h3>Como interpretar</h3>
          <BarChart3 size={16} color="var(--brand-accent)" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {[
            { range: '0–3', label: 'Crítico', desc: 'Sem estrutura. Prioridade máxima.', cls: 'critico' },
            { range: '4–6', label: 'Frágil', desc: 'Existe, mas inconsistente. Ganhos rápidos possíveis.', cls: 'fragil' },
            { range: '7–8', label: 'Saudável', desc: 'Funciona. Otimização fina.', cls: 'saudavel' },
            { range: '9–10', label: 'Maduro', desc: 'Referência. Manter e proteger.', cls: 'maduro' },
          ].map(item => (
            <div key={item.cls} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)' }}>{item.range}</span>
              <span className={`pillar-reading ${item.cls}`} style={{ fontWeight: 700 }}>{item.label}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>{item.desc}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0, lineHeight: 1.6, borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
          O gargalo prioritário é o pilar de <strong>menor nota</strong> — é por ele que o plano de 90 dias começa.
          O Raio-X é revisado trimestralmente (3 pilares) com pulso mensal no pilar-gargalo.
        </p>
      </article>
    </div>
  );
}
