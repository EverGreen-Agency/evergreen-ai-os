import { FormEvent, useEffect, useState } from "react";
import { Building2, Plus, Save, FileText, CalendarCheck, Check, Copy, KeyRound, UserPlus, X, Settings, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DockTitle } from "./shared";
import { statusLabel, deliverableStatusLabel, moduleLabels, toggleableModules } from "../lib/app-config";
import { useUiStore } from "../store/uiStore";
import { useCreateClient, useUpdateClient, useCreateInvite, useDeleteClient } from "../hooks/useBiomaApi";
import { api } from "../lib/api";
import type { ClientModule, ClientStatus, ClientSummary } from "../lib/api";

export function AdminDock({ selectedClient, isOpen, onClose }: { selectedClient: ClientSummary | null, isOpen: boolean, onClose: () => void }) {
  const navigate = useNavigate();
  const {
    selectedClientId,
    actionBusy,
    clientDraft,
    setClientDraft,
  } = useUiStore();

  const updateClient = useUpdateClient();
  const createInvite = useCreateInvite();
  const deleteClient = useDeleteClient();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [resetCopied, setResetCopied] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  // Pré-preenche o formulário de edição com o cliente selecionado.
  useEffect(() => {
    setInviteLink("");
    setInviteCopied(false);
    if (!selectedClient) return;
    setClientDraft({
      name: selectedClient.name,
      organization_name: selectedClient.organization_name,
      status: selectedClient.status,
      responsible_name: selectedClient.responsible_name ?? "",
      clickup_folder_id: selectedClient.clickup_folder_id ?? "",
      enabled_modules: selectedClient.enabled_modules,
    });
  }, [selectedClient, setClientDraft, isOpen]);

  const handleCreateInvite = () => {
    if (!selectedClientId) return;
    createInvite.mutate(
      { clientId: selectedClientId, email: inviteEmail.trim() || null },
      {
        onSuccess: (invite) => {
          setInviteLink(`${window.location.origin}${invite.path}`);
          setInviteCopied(false);
          setInviteEmail("");
        },
      },
    );
  };

  const handleCopyInvite = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
  };

  const handleCreateReset = async () => {
    if (!resetEmail.trim()) return;
    setResetError("");
    setResetBusy(true);
    try {
      const reset = await api.createPasswordReset(resetEmail.trim());
      setResetLink(`${window.location.origin}${reset.path}`);
      setResetCopied(false);
      setResetEmail("");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Não foi possível gerar o link.");
    } finally {
      setResetBusy(false);
    }
  };

  const handleCopyReset = async () => {
    if (!resetLink) return;
    await navigator.clipboard.writeText(resetLink);
    setResetCopied(true);
  };

  const toggleModule = (module: ClientModule) => {
    const current = new Set(clientDraft.enabled_modules ?? selectedClient?.enabled_modules ?? []);
    if (current.has(module)) {
      current.delete(module);
    } else {
      current.add(module);
    }
    current.add("hub");
    setClientDraft({ ...clientDraft, enabled_modules: Array.from(current) });
  };

  const handleUpdateClient = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClientId) return;
    updateClient.mutate({ id: selectedClientId, payload: clientDraft });
  };

  const isBusy = Boolean(actionBusy) || updateClient.isPending;

  if (!isOpen || !selectedClient) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <h2><Settings size={20} color="var(--brand-accent)" /> Gerenciar Cliente</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        
        <div className="drawer-body">
          <form onSubmit={handleUpdateClient}>
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

            <fieldset className="module-toggles" style={{ marginTop: '20px', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <legend style={{ padding: '0 8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                Módulos habilitados para o cliente
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                {toggleableModules.map(mod => (
                  <label key={mod} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={clientDraft.enabled_modules?.includes(mod) ?? selectedClient?.enabled_modules?.includes(mod) ?? false}
                      onChange={() => toggleModule(mod)}
                    />
                    {moduleLabels[mod]}
                  </label>
                ))}
              </div>
            </fieldset>

            <button className="primary-button" type="submit" disabled={isBusy} style={{ marginTop: '20px', width: '100%' }}>
              <Save size={16} />
              Salvar cliente
            </button>
          </form>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '8px 0' }} />

          <div>
            <DockTitle icon={UserPlus} title="Convidar usuário do cliente" />
            <p style={{ fontSize: "0.8rem", color: "var(--text-faint)", marginTop: 0, marginBottom: "12px" }}>
              Gera um link de uso único (expira em 7 dias). Envie por WhatsApp; a pessoa define a própria senha.
            </p>
            <div className="form-grid" style={{ display: "flex", gap: "12px", flexDirection: "column" }}>
              <label>
                E-mail (opcional, restringe o convite)
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="pessoa@cliente.com.br"
                />
              </label>
              <button
                className="primary-button"
                type="button"
                onClick={handleCreateInvite}
                disabled={isBusy || createInvite.isPending}
                style={{ alignSelf: 'flex-start' }}
              >
                <UserPlus size={16} />
                Gerar link de convite
              </button>
            </div>
            {inviteLink && (
              <div style={{ marginTop: "12px", background: "var(--bg-inset)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
                <input readOnly value={inviteLink} style={{ flex: 1, padding: "8px", fontSize: "0.85rem", background: "transparent", border: "none", color: "var(--text)" }} />
                <button type="button" onClick={handleCopyInvite} className="secondary-button" style={{ padding: "8px" }} title="Copiar link">
                  {inviteCopied ? <Check size={16} color="var(--brand-accent)" /> : <Copy size={16} />}
                </button>
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '8px 0' }} />

          <div>
            <DockTitle icon={KeyRound} title="Redefinir senha de usuário" />
            <p style={{ fontSize: "0.8rem", color: "var(--text-faint)", marginTop: 0, marginBottom: "12px" }}>
              Gera um link de uso único (expira em 2 horas) que encerra as sessões antigas do usuário. Envie por WhatsApp.
            </p>
            <div className="form-grid" style={{ display: "flex", gap: "12px", flexDirection: "column" }}>
              <label>
                E-mail do usuário
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="pessoa@cliente.com.br"
                />
              </label>
              <button
                className="primary-button"
                type="button"
                onClick={handleCreateReset}
                disabled={resetBusy || isBusy || !resetEmail.trim()}
                style={{ alignSelf: 'flex-start' }}
              >
                <KeyRound size={16} />
                Gerar link de redefinição
              </button>
              {resetError && <span className="form-error">{resetError}</span>}
            </div>
            {resetLink && (
              <div style={{ marginTop: "12px", background: "var(--bg-inset)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
                <input readOnly value={resetLink} style={{ flex: 1, padding: "8px", fontSize: "0.85rem", background: "transparent", border: "none", color: "var(--text)" }} />
                <button type="button" onClick={handleCopyReset} className="secondary-button" style={{ padding: "8px" }} title="Copiar link">
                  {resetCopied ? <Check size={16} color="var(--brand-accent)" /> : <Copy size={16} />}
                </button>
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(239, 68, 68, 0.2)', margin: '20px 0' }} />

          <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "8px", padding: "16px" }}>
            <DockTitle icon={Trash2} title="Excluir Cliente" />
            <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: 4, marginBottom: "14px", lineHeight: 1.4 }}>
              Esta ação excluirá permanentemente a organização <strong>{selectedClient.name}</strong>, seus workspaces e todo o histórico associado.
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Tem certeza que deseja excluir permanentemente o cliente "${selectedClient.name}"? Esta ação não pode ser desfeita.`)) {
                  deleteClient.mutate(selectedClient.id, {
                    onSuccess: () => {
                      onClose();
                      navigate("/clientes");
                    }
                  });
                }
              }}
              disabled={deleteClient.isPending}
              style={{
                background: "#ef4444",
                color: "#ffffff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.85rem"
              }}
            >
              <Trash2 size={16} />
              {deleteClient.isPending ? "Excluindo..." : "Excluir este cliente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
