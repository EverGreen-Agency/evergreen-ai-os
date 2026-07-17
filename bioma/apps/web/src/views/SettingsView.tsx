import { FormEvent, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Link2, ShieldCheck, User, Building2, GitBranch, Unlink } from "lucide-react";
import { IntegrationsTab } from "../components/IntegrationsTab";
import { api, apiUrl } from "../lib/api";
import { useCurrentUser } from "../hooks/useBiomaApi";
import { SectionHeader } from "../components/shared";

export function SettingsView() {
  const { data: user } = useCurrentUser();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"user" | "company">("user");
  const [activeSubTab, setActiveSubTab] = useState<"general" | "integrations">("general");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: identities } = useQuery({ queryKey: ["identities"], queryFn: api.identities });
  const googleIdentity = identities?.find((identity) => identity.provider === "google") ?? null;
  const [identityError, setIdentityError] = useState("");
  const [unlinking, setUnlinking] = useState(false);

  // Resultado do fluxo OAuth chega por redirect (?linked=google | ?oauth_error=...)
  const searchParams = new URLSearchParams(location.search);
  const linkedNow = searchParams.get("linked") === "google";
  const oauthError = searchParams.get("oauth_error");

  async function handleUnlink() {
    if (!googleIdentity) return;
    setIdentityError("");
    setUnlinking(true);
    try {
      await api.unlinkIdentity(googleIdentity.id);
      await queryClient.invalidateQueries({ queryKey: ["identities"] });
    } catch (err) {
      setIdentityError(err instanceof Error ? err.message : "Não foi possível desvincular.");
    } finally {
      setUnlinking(false);
    }
  }

  if (!user) return null;

  const initials = user.display_name.substring(0, 2).toUpperCase();
  const isEgAdmin = user.organizations.some(org => org.role === "eg_admin");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword.length < 8) {
      setError("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.changePassword(currentPassword, newPassword);
      setSuccess(
        result.revoked_sessions > 0
          ? `Senha alterada. ${result.revoked_sessions} outra(s) sessão(ões) foram encerradas.`
          : "Senha alterada com sucesso."
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível alterar a senha.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="profile-grid">
      <SectionHeader eyebrow="Ajustes" title="Configurações" icon={User} />

      <div className="tabs-container">
        <button 
          className={`tab-item ${activeTab === "user" ? "active" : ""}`}
          onClick={() => setActiveTab("user")}
          style={{ padding: "8px 16px", background: activeTab === "user" ? "var(--brand-accent)" : "transparent", color: activeTab === "user" ? "var(--text-main)" : "var(--text-muted)", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, marginRight: "8px" }}
        >
          Usuário
        </button>
        {isEgAdmin && (
          <button 
            className={`tab-item ${activeTab === "company" ? "active" : ""}`}
            onClick={() => setActiveTab("company")}
            style={{ padding: "8px 16px", background: activeTab === "company" ? "var(--brand-accent)" : "transparent", color: activeTab === "company" ? "var(--text-main)" : "var(--text-muted)", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, marginRight: "8px" }}
          >
            Perfil da Empresa
          </button>
        )}
      </div>

      <div className="profile-header surface">
        <div className="profile-avatar-large">{initials}</div>
        <div className="profile-title">
          <h2>{user.display_name}</h2>
          <span>{user.email}</span>
        </div>
      </div>

      {activeTab === "user" && (
        <div className="profile-content">
          <article className="surface profile-section">
            <div className="surface-header">
              <Link2 size={18} />
              <h3>Contas conectadas</h3>
            </div>
            <p className="panel-footnote" style={{ marginTop: 0 }}>
              Vincule sua conta Google para entrar no Bioma com um clique. Sua conta continua sendo a do convite EG —
              o vínculo pode ser desfeito a qualquer momento, e a senha continua valendo.
            </p>
            {linkedNow && <span className="form-success">Conta Google vinculada com sucesso.</span>}
            {oauthError && <span className="form-error">{oauthError}</span>}
            {identityError && <span className="form-error">{identityError}</span>}
            <div className="timeline-list" style={{ marginTop: 12 }}>
              {googleIdentity ? (
                <div className="timeline-row">
                  <span>Google</span>
                  <strong>{googleIdentity.email ?? "conta vinculada"}</strong>
                  <button
                    className="mini-button"
                    type="button"
                    onClick={handleUnlink}
                    disabled={unlinking}
                  >
                    <Unlink size={13} />
                    {unlinking ? "Desvinculando..." : "Desvincular"}
                  </button>
                </div>
              ) : (
                <div className="timeline-row">
                  <span>Google</span>
                  <strong>Nenhuma conta vinculada</strong>
                  <button
                    className="mini-button approve"
                    type="button"
                    onClick={() => {
                      window.location.href = apiUrl("/auth/oauth/google/start?mode=link");
                    }}
                  >
                    <Link2 size={13} />
                    Conectar Google
                  </button>
                </div>
              )}
            </div>
          </article>

          <article className="surface profile-section">
            <div className="surface-header">
              <KeyRound size={18} />
              <h3>Segurança</h3>
            </div>
            <form className="form-grid" onSubmit={handleSubmit}>
              <label>
                Senha atual
                <input
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </label>
              <label>
                Nova senha
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                />
              </label>
              <label>
                Confirmar nova senha
                <input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              {error && <span className="form-error">{error}</span>}
              {success && <span className="form-success">{success}</span>}
              <div className="modal-actions" style={{ marginTop: "16px" }}>
                <button className="primary-button" type="submit" disabled={submitting}>
                  Atualizar Senha
                </button>
              </div>
            </form>
          </article>
        </div>
      )}

      {activeTab === "company" && isEgAdmin && (
        <div className="profile-content">
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px", borderBottom: "1px solid var(--border-light)", paddingBottom: "16px" }}>
            <button
              onClick={() => setActiveSubTab("general")}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: activeSubTab === "general" ? "var(--text-main)" : "var(--text-muted)", fontWeight: activeSubTab === "general" ? 600 : 400, padding: "8px 0", borderBottom: activeSubTab === "general" ? "2px solid var(--brand-accent)" : "2px solid transparent" }}
            >
              Geral
            </button>
            <button
              onClick={() => setActiveSubTab("integrations")}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: activeSubTab === "integrations" ? "var(--text-main)" : "var(--text-muted)", fontWeight: activeSubTab === "integrations" ? 600 : 400, padding: "8px 0", borderBottom: activeSubTab === "integrations" ? "2px solid var(--brand-accent)" : "2px solid transparent" }}
            >
              Integrações MCP
            </button>
          </div>

          {activeSubTab === "general" && (
            <article className="surface profile-section" style={{ gridColumn: "1 / -1" }}>
            <div className="surface-header">
              <Building2 size={18} />
              <h3>EverGreen</h3>
            </div>
            <div style={{ padding: "16px 0" }}>
              <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
                Configurações da agência. Gerencie usuários internos e preferências globais.
              </p>
              
              <div className="timeline-list">
                <div className="timeline-row">
                  <span>Equipe</span>
                  <strong>{user.display_name}</strong>
                  <small>{user.email}</small>
                </div>
                {/* Aqui poderemos listar todos os usuários da EG buscando do backend */}
                <div className="timeline-row" style={{ opacity: 0.5 }}>
                  <span>+ Convidar</span>
                  <strong>Adicionar membro</strong>
                  <small>Funcionalidade em breve</small>
                </div>
              </div>
            </div>
          </article>
          )}

          {activeSubTab === "integrations" && (
            <IntegrationsTab />
          )}
        </div>
      )}
    </section>
  );
}
