import { FormEvent } from "react";
import { LogIn, LockKeyhole, Users, GitBranch, ShieldCheck } from "lucide-react";
import { ProofItem } from "../components/shared";

export function LoginView({
  email,
  password,
  loginError,
  apiOnline,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: {
  email: string;
  password: string;
  loginError: string;
  apiOnline: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <main className="login-shell">
      <section className="login-copy">
        <div className="brand large">
          <div className="brand-mark">
            <img src="/assets/brand/eg-symbol.svg" alt="Símbolo EverGreen" width={64} height={64} />
          </div>
          <div>
            <strong>Bioma</strong>
            <span>EverGreen</span>
          </div>
        </div>
        <div>
          <p className="eyebrow invert">Plataforma operacional</p>
          <h1>Conexões que constroem reputação, autoridade e oportunidades.</h1>
          <p className="login-subtitle">
            Plataforma completa para gestão de clientes, conteúdo e performance.
          </p>
        </div>
        <div className="login-proof">
          <ProofItem icon={Users} title="Relacionamentos" detail="Gerencie conexões com inteligência." />
          <ProofItem icon={GitBranch} title="Conteúdo estratégico" detail="Planeje, crie e publique autoridade." />
          <ProofItem icon={ShieldCheck} title="Segurança em 1º lugar" detail="Conformidade LGPD e dados protegidos." />
        </div>
      </section>

      <section className="login-card" aria-label="Entrar no Bioma">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Acesso</p>
            <h2>Bem-vindo de volta</h2>
          </div>
          <LockKeyhole size={24} />
        </div>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            E-mail
            <input value={email} onChange={(e) => onEmailChange(e.target.value)} type="email" placeholder="seu@email.com" />
          </label>
          <label>
            Senha
            <input value={password} onChange={(e) => onPasswordChange(e.target.value)} type="password" placeholder="••••••••" />
          </label>
          {loginError && <span className="form-error">{loginError}</span>}
          <button type="submit" className="primary-button wide" style={{ marginTop: 12 }}>
            <LogIn size={18} />
            Entrar
          </button>
        </form>
        <div className="login-health">
          <span className={apiOnline ? "dot online" : "dot"} />
          {apiOnline ? "Sistema Operacional Online" : "Sistema Offline"}
        </div>
      </section>
    </main>
  );
}
