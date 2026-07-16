import { FormEvent, useState } from "react";
import { KeyRound, X } from "lucide-react";
import { api } from "../lib/api";

export function PasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
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
          : "Senha alterada com sucesso.",
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
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="artifact-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Alterar senha"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
        <form className="form-grid" onSubmit={handleSubmit}>
          <p className="eyebrow">Segurança</p>
          <h2>Alterar senha</h2>
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
          <div className="modal-actions">
            <button className="primary-button" type="submit" disabled={submitting}>
              <KeyRound size={16} />
              {submitting ? "Salvando..." : "Alterar senha"}
            </button>
            <button className="ghost-button" type="button" onClick={onClose}>
              Fechar
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
