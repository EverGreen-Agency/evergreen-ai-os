import { FormEvent } from "react";
import { Building2, Plus, Save, FileText, CalendarCheck } from "lucide-react";
import { DockTitle } from "./shared";
import { statusLabel, deliverableStatusLabel } from "../lib/app-config";
import { useUiStore } from "../store/uiStore";
import { useCreateClient, useUpdateClient, useCreateArtifact, useCreateDeliverable } from "../hooks/useBiomaApi";
import type { ClientStatus, DeliverableStatus, ArtifactPayload } from "../lib/api";

export function AdminDock({ selectedClient }: { selectedClient: any }) {
  const {
    selectedClientId,
    actionBusy,
    newClientDraft,
    setNewClientDraft,
    clientDraft,
    setClientDraft,
    artifactDraft,
    setArtifactDraft,
    deliverableDraft,
    setDeliverableDraft,
  } = useUiStore();

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const createArtifact = useCreateArtifact();
  const createDeliverable = useCreateDeliverable();

  const handleCreateClient = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createClient.mutate(newClientDraft);
  };

  const handleUpdateClient = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClientId) return;
    updateClient.mutate({ id: selectedClientId, payload: clientDraft });
  };

  const handleCreateArtifact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClientId) return;
    createArtifact.mutate({ clientId: selectedClientId, payload: artifactDraft });
  };

  const handleCreateDeliverable = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClientId) return;
    createDeliverable.mutate({ clientId: selectedClientId, payload: deliverableDraft });
  };

  const isBusy = Boolean(actionBusy) || createClient.isPending || updateClient.isPending || createArtifact.isPending || createDeliverable.isPending;

  return (
    <section className="admin-dock" aria-label="Operações EG">
      <form className="dock-panel" onSubmit={handleCreateClient}>
        <DockTitle icon={Building2} title="Novo cliente" />
        <div className="form-grid two">
          <label>
            Cliente
            <input
              value={newClientDraft.name ?? ""}
              onChange={(event) => setNewClientDraft({ ...newClientDraft, name: event.target.value })}
            />
          </label>
          <label>
            Organização
            <input
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
        <button className="primary-button" type="submit" disabled={isBusy}>
          <Plus size={16} />
          Criar cliente
        </button>
      </form>

      {selectedClient && (
        <form className="dock-panel" onSubmit={handleUpdateClient}>
          <DockTitle icon={Save} title="Editar cliente selecionado" />
          <div className="form-grid two">
            <label>
              Nome
              <input value={clientDraft.name ?? ""} onChange={(event) => setClientDraft({ ...clientDraft, name: event.target.value })} />
            </label>
            <label>
              Status
              <select
                value={clientDraft.status ?? "onboarding"}
                onChange={(event) => setClientDraft({ ...clientDraft, status: event.target.value as ClientStatus })}
              >
                {Object.entries(statusLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Responsável
              <input
                value={clientDraft.responsible_name ?? ""}
                onChange={(event) => setClientDraft({ ...clientDraft, responsible_name: event.target.value })}
              />
            </label>
            <label>
              ClickUp folder
              <input
                value={clientDraft.clickup_folder_id ?? ""}
                onChange={(event) => setClientDraft({ ...clientDraft, clickup_folder_id: event.target.value })}
              />
            </label>
          </div>
          <button className="secondary-button" type="submit" disabled={isBusy}>
            <Save size={16} />
            Salvar cliente
          </button>
        </form>
      )}

      {selectedClientId && (
        <>
          <form className="dock-panel" onSubmit={handleCreateArtifact}>
            <DockTitle icon={FileText} title="Novo artefato" />
            <div className="form-grid">
              <label>
                Título
                <input value={artifactDraft.title} onChange={(event) => setArtifactDraft({ ...artifactDraft, title: event.target.value })} />
              </label>
              <div className="form-grid two">
                <label>
                  Tipo
                  <select value={artifactDraft.kind} onChange={(event) => setArtifactDraft({ ...artifactDraft, kind: event.target.value })}>
                    <option value="briefing">Briefing</option>
                    <option value="brand_book">Brand book</option>
                    <option value="calendar">Calendário</option>
                    <option value="integration_map">Mapa de integração</option>
                  </select>
                </label>
                <label>
                  Visibilidade
                  <select
                    value={artifactDraft.visibility}
                    onChange={(event) =>
                      setArtifactDraft({ ...artifactDraft, visibility: event.target.value as ArtifactPayload["visibility"] })
                    }
                  >
                    <option value="client">Cliente</option>
                    <option value="internal">Interno EG</option>
                  </select>
                </label>
              </div>
              <label>
                Conteúdo
                <textarea value={artifactDraft.content ?? ""} onChange={(event) => setArtifactDraft({ ...artifactDraft, content: event.target.value })} />
              </label>
            </div>
            <button className="primary-button" type="submit" disabled={isBusy}>
              <Plus size={16} />
              Publicar artefato
            </button>
          </form>

          <form className="dock-panel" onSubmit={handleCreateDeliverable}>
            <DockTitle icon={CalendarCheck} title="Nova entrega" />
            <div className="form-grid">
              <label>
                Título
                <input
                  value={deliverableDraft.title}
                  onChange={(event) => setDeliverableDraft({ ...deliverableDraft, title: event.target.value })}
                />
              </label>
              <div className="form-grid two">
                <label>
                  Status
                  <select
                    value={deliverableDraft.status}
                    onChange={(event) => setDeliverableDraft({ ...deliverableDraft, status: event.target.value as DeliverableStatus })}
                  >
                    {Object.entries(deliverableStatusLabel).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Prazo
                  <input
                    value={deliverableDraft.due_at ?? ""}
                    type="datetime-local"
                    onChange={(event) => setDeliverableDraft({ ...deliverableDraft, due_at: event.target.value })}
                  />
                </label>
              </div>
            </div>
            <button className="primary-button" type="submit" disabled={isBusy}>
              <Plus size={16} />
              Criar entrega
            </button>
          </form>
        </>
      )}
    </section>
  );
}
