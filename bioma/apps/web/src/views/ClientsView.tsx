import React, { useState } from "react";
import { Users, ClipboardCheck, GitBranch, CalendarCheck, CircleDashed, CheckCircle2, AlertCircle, FileText, ArrowRight, Trash2, RefreshCw, ArrowLeft, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SectionHeader, EmptyState, HubBlock } from "../components/shared";
import { statusLabel, deliverableStatusLabel } from "../lib/app-config";
import { clickUpSummary, formatDueDate, approvalStatusLabel, artifactKindLabel } from "../lib/format";
import type { ArtifactSummary, DeliverableStatus } from "../lib/api";
import { externalClients } from "../lib/client-scope";
import { useUiStore } from "../store/uiStore";
import { useClients, useClientPortal, useSyncClickUp, useUpdateDeliverable, useDeleteDeliverable, useCreateApproval, useDecideApproval, useCurrentUser, useCreateClient, useDeleteClient } from "../hooks/useBiomaApi";

export function ClientsView() {
  const navigate = useNavigate();
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  const { data: user, isLoading: loadingUser } = useCurrentUser();
  const isEgAdmin = !loadingUser && (user?.organizations.some(org => org.role === "eg_admin") ?? false);

  const { newClientDraft, setNewClientDraft } = useUiStore();
  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();

  const handleCreateClient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createClient.mutate(newClientDraft, {
      onSuccess: () => {
        setShowNewClientModal(false);
        setNewClientDraft({ name: "", organization_name: "", responsible_name: "", clickup_folder_id: "" });
      }
    });
  };

  const { data: clientsData, isLoading: loadingClients } = useClients();
  const clients = externalClients(clientsData ?? []);

  const handleDeleteClient = (e: React.MouseEvent, clientId: string, clientName: string) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir permanentemente o cliente "${clientName}" e todas as suas tarefas/workspaces?`)) {
      deleteClient.mutate(clientId);
    }
  };

  return (
    <section style={{ padding: '32px', width: '100%' }}>
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionHeader eyebrow="Client Hub" title="Carteira" icon={Users} />
          {isEgAdmin && (
            <button className="primary-button" onClick={() => setShowNewClientModal(true)}>
              <Plus size={16} /> Novo Cliente
            </button>
          )}
        </div>
        {loadingClients && <EmptyState text="Carregando clientes..." />}
        {!loadingClients && clients.length === 0 && <EmptyState text="Nenhum cliente disponível para esta sessão." />}
        <div className="bento-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {clients.map((client) => (
            <div
              className="client-card"
              key={client.id}
              style={{ cursor: "pointer", position: "relative" }}
              onClick={() => navigate(`/clientes/${client.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '8px' }}>
                <strong style={{ fontSize: '1.05rem', lineHeight: 1.3 }}>{client.name}</strong>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span className={`status-pill ${client.status}`}>{statusLabel[client.status]}</span>
                  {isEgAdmin && (
                    <button
                      className="icon-button"
                      type="button"
                      title="Excluir cliente"
                      onClick={(e) => handleDeleteClient(e, client.id, client.name)}
                      style={{ color: "var(--danger-soft)", padding: 4 }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
              <small style={{ display: 'block', textAlign: 'left', marginBottom: '16px', color: 'var(--text-muted)' }}>
                Responsável: {client.responsible_name ?? "Sem responsável"}
              </small>
              <div className="client-card-meta" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', opacity: 0.8 }}>
                <span>{client.deliverables_total} entregas</span>
                <span>{client.approvals_pending} aprovações</span>
                <span>{client.artifacts_client} artefatos</span>
              </div>
            </div>
          ))}
        </div>

        {showNewClientModal && (
          <div className="modal-overlay" onClick={() => setShowNewClientModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Novo Cliente</h3>
                <button className="icon-btn" onClick={() => setShowNewClientModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-grid two">
                    <label>
                      Cliente
                      <input
                        required
                        value={newClientDraft.name ?? ""}
                        onChange={(event) => setNewClientDraft({ ...newClientDraft, name: event.target.value })}
                      />
                    </label>
                    <label>
                      Organização
                      <input
                        required
                        value={newClientDraft.organization_name ?? ""}
                        onChange={(event) => setNewClientDraft({ ...newClientDraft, organization_name: event.target.value })}
                      />
                    </label>
                    <label>
                      Responsável EG
                      <input
                        value={newClientDraft.responsible_name ?? ""}
                        onChange={(event) => setNewClientDraft({ ...newClientDraft, responsible_name: event.target.value })}
                      />
                    </label>
                    <label>
                      ClickUp folder
                      <input
                        value={newClientDraft.clickup_folder_id ?? ""}
                        onChange={(event) => setNewClientDraft({ ...newClientDraft, clickup_folder_id: event.target.value })}
                      />
                    </label>
                  </div>
                  <button className="primary-button" type="submit" disabled={createClient.isPending} style={{ alignSelf: 'flex-start' }}>
                    <Plus size={16} />
                    Criar cliente
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
    </section>
  );
}
