import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { ClipboardCheck, CheckCircle2, AlertCircle, ArrowLeft, Settings } from "lucide-react";
import { SectionHeader, EmptyState } from "../components/shared";
import { statusLabel } from "../lib/app-config";
import { externalClients } from "../lib/client-scope";
import { AdminDock } from "../components/AdminDock";
import { useUiStore } from "../store/uiStore";
import { useClients, useClientPortal, useDecideApproval, useCurrentUser } from "../hooks/useBiomaApi";
import type { ClientWorkspaceOutletContext } from "./ClientWorkspaceView";

export function ClientHubView() {
  const { id } = useParams<{ id: string }>();
  const { workspace } = useOutletContext<ClientWorkspaceOutletContext>();
  const contextId = workspace.workspaceId;
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const { setSelectedClientId } = useUiStore();

  const { data: user, isLoading: loadingUser } = useCurrentUser();
  const isEgAdmin = !loadingUser && (user?.organizations.some(org => org.role === "eg_admin") ?? false);

  const { data: clientsData } = useClients();
  const clients = externalClients(clientsData ?? []);
  const selectedClient = clients.find((c) => c.id === id) ?? null;

  const { data: portalData, isLoading: loadingPortal } = useClientPortal(contextId);
  const portal = portalData ?? null;
  const decideApproval = useDecideApproval();
  
  const isBusy = decideApproval.isPending;

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
        </div>
      )}

      {selectedClient && (
        <AdminDock selectedClient={selectedClient} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      )}
    </section>
  );
}
