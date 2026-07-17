import { FormEvent, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, KeyRound, Link2, User, Building2, Unlink, Phone, Briefcase, Mail } from "lucide-react";
import { IntegrationsTab } from "../components/IntegrationsTab";
import { api, apiUrl } from "../lib/api";
import { useCurrentUser } from "../hooks/useBiomaApi";
import { SectionHeader } from "../components/shared";

export function SettingsView() {
  const { data: user } = useCurrentUser();
  const location = useLocation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"user" | "company">("user");
  const [activeSubTab, setActiveSubTab] = useState<"general" | "integrations">("general");

  // Avatar local (base64 em localStorage até endpoint de upload existir no backend)
  const avatarKey = user ? `bioma_avatar_${user.id}` : null;
  const [avatarSrc, setAvatarSrc] = useState<string | null>(() => {
    if (!avatarKey) return null;
    try { return localStorage.getItem(avatarKey); } catch { return null; }
  });

  // Campos de perfil local
  const profileKey = user ? `bioma_profile_${user.id}` : null;
  const loadProfile = () => {
    if (!profileKey) return { cargo: '', telefone: '' };
    try { return JSON.parse(localStorage.getItem(profileKey) ?? '{}'); } catch { return {}; }
  };
  const [cargo, setCargo] = useState<string>(() => loadProfile().cargo ?? '');
  const [telefone, setTelefone] = useState<string>(() => loadProfile().telefone ?? '');
  const [profileSaved, setProfileSaved] = useState(false);

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

  const searchParams = new URLSearchParams(location.search);
  const linkedNow = searchParams.get("linked") === "google";
  const oauthError = searchParams.get("oauth_error");

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !avatarKey) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setAvatarSrc(src);
      localStorage.setItem(avatarKey, src);
    };
    reader.readAsDataURL(file);
  }

  function handleSaveProfile() {
    if (!profileKey) return;
    localStorage.setItem(profileKey, JSON.stringify({ cargo, telefone }));
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

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

      {/* Tabs principais */}
      <div className="settings-tabs">
        {(["user", "company"] as const)
          .filter(t => t === "user" || isEgAdmin)
          .map(t => (
            <button
              key={t}
              type="button"
              className={`settings-tab-btn ${activeTab === t ? "active" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t === "user" ? "Meu Perfil" : "Empresa"}
            </button>
          ))}
      </div>

      {/* Hero do perfil */}
      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-large" style={{ backgroundImage: avatarSrc ? `url(${avatarSrc})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', color: avatarSrc ? 'transparent' : undefined }}>
            {!avatarSrc && initials}
          </div>
          <button
            type="button"
            className="avatar-upload-btn"
            title="Trocar foto"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={14} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>
        <div className="profile-hero-info">
          <h2 className="profile-hero-name">{user.display_name}</h2>
          <span className="profile-hero-email">{user.email}</span>
          {cargo && <span className="profile-hero-role">{cargo}</span>}
        </div>
        <div className="profile-hero-badges">
          {isEgAdmin && (
            <span className="level-badge" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              EG Admin
            </span>
          )}
          {!isEgAdmin && user.organizations.map(org => (
            <span key={org.id} className="level-badge" style={{ fontSize: '0.7rem' }}>
              {org.role}
            </span>
          ))}
        </div>
      </div>

      {activeTab === "user" && (
        <div className="profile-content">

          {/* Informações pessoais */}
          <article className="surface profile-section" style={{ gridColumn: '1 / -1' }}>
            <div className="surface-header">
              <User size={18} />
              <h3>Informações pessoais</h3>
            </div>
            <p className="panel-footnote" style={{ marginTop: 0 }}>
              Dados locais por enquanto — em breve sincronizados com o backend.
            </p>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  <Mail size={13} /> E-mail
                </span>
                <input value={user.email} disabled style={{ opacity: 0.6 }} />
              </label>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  <Briefcase size={13} /> Cargo / Função
                </span>
                <input
                  value={cargo}
                  onChange={e => setCargo(e.target.value)}
                  placeholder="Ex: Growth Lead, Designer..."
                />
              </label>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  <Phone size={13} /> Telefone / WhatsApp
                </span>
                <input
                  value={telefone}
                  onChange={e => setTelefone(e.target.value)}
                  placeholder="+55 (11) 99999-9999"
                  type="tel"
                />
              </label>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button type="button" className="primary-button" onClick={handleSaveProfile}>
                Salvar informações
              </button>
              {profileSaved && <span className="form-success">Salvo ✓</span>}
            </div>
          </article>

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
                  {user.has_password ? (
                    <button
                      className="mini-button"
                      type="button"
                      onClick={handleUnlink}
                      disabled={unlinking}
                    >
                      <Unlink size={13} />
                      {unlinking ? "Desvinculando..." : "Desvincular"}
                    </button>
                  ) : (
                    <button
                      className="mini-button"
                      type="button"
                      disabled
                      title="O Google é seu único método de login. Defina uma senha na seção Segurança abaixo para poder desvincular."
                    >
                      <Unlink size={13} />
                      Defina uma senha antes
                    </button>
                  )}
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
              Integrações
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
