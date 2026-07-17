import { FormEvent } from "react";
import { LogIn, BarChart2, Workflow, ShieldCheck, ArrowRight } from "lucide-react";

/** SVG inline do logo Google */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"/>
    </svg>
  );
}

/** SVG inline do logo Apple */
function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 814 1000" aria-hidden="true" fill="currentColor">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.3-164-39.3c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.5-49 191.5-49 30.8 0 108.2 2.6 168.9 98.3zm-234.3-181.4c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
    </svg>
  );
}

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
  const whatsappUrl =
    "https://wa.me/5511989966989?text=Vim%20pelo%20Bioma%20e%20gostaria%20de%20saber%20mais%20sobre%20a%20EverGreen.";
  // Reset de senha é gerado pelo EG admin (AUTH-002); o caminho do usuário é
  // pedir o link pelo canal de atendimento.
  const forgotPasswordUrl =
    "https://wa.me/5511989966989?text=Preciso%20redefinir%20minha%20senha%20do%20Bioma.";

  return (
    <main className="login-shell">
      {/* Coluna esquerda — identidade e proof points */}
      <section className="login-copy">
        <div className="brand large">
          <div className="brand-mark">
            <img src="/assets/brand/eg-symbol.png" alt="Símbolo EverGreen" width={40} height={40} />
          </div>
          <div>
            <strong>Bioma</strong>
            <span>EverGreen</span>
          </div>
        </div>

        <div className="login-headline-block">
          <h1>
            Previsibilidade,<br />
            controle e crescimento<br />
            <span className="login-headline-accent">com método.</span>
          </h1>
          <p className="login-subtitle">
            Inteligência aplicada para quem opera no alto nível. Visibilidade real, cadência e resultado — sem improviso.
          </p>
        </div>

        <div className="login-proof">
          <div className="login-proof-item">
            <div className="login-proof-icon"><Workflow size={15} /></div>
            <div className="login-proof-text">
              <strong>Estrutura comercial</strong>
              <span>Pipeline, jornada e cadência em um só lugar.</span>
            </div>
          </div>
          <div className="login-proof-item">
            <div className="login-proof-icon"><BarChart2 size={15} /></div>
            <div className="login-proof-text">
              <strong>Dados que decidem</strong>
              <span>Performance, analytics e auditoria conectados.</span>
            </div>
          </div>
          <div className="login-proof-item">
            <div className="login-proof-icon"><ShieldCheck size={15} /></div>
            <div className="login-proof-text">
              <strong>Operação de boutique</strong>
              <span>Método visível, escopo claro, entrega rastreável.</span>
            </div>
          </div>
        </div>

        {/* Sem promessas absolutas ("100% seguro") — risco jurídico e não é verdade
            para sistema nenhum. O selo aponta para o aviso de privacidade real. */}
        <div className="login-security-bar">
          <ShieldCheck size={16} className="security-icon" />
          <div className="security-text">
            <strong>Segurança e privacidade em primeiro lugar</strong>
            <span>Dados protegidos e tratados conforme a LGPD.</span>
          </div>
          <div className="security-badge">
            <span>LGPD</span>
          </div>
        </div>
      </section>

      {/* Coluna direita — formulário */}
      <section className="login-card" aria-label="Entrar no Bioma">
        <div className="login-card-inner">
          <h2 className="login-card-title">Bem-vindo de volta</h2>
          <p className="login-card-subtitle">Entre para acessar sua conta</p>

          {/* Login social: UI pronta, backend OIDC ainda não implementado —
              desabilitado para não ser um botão que não faz nada. */}
          <div className="login-social">
            <button
              type="button"
              className="login-social-btn"
              disabled
              title="Entrar com Google — em breve"
              aria-label="Entrar com Google (em breve)"
            >
              <GoogleIcon />
              <span>Entrar com Google</span>
              <em className="soon-badge">em breve</em>
            </button>
            <button
              type="button"
              className="login-social-btn"
              disabled
              title="Entrar com Apple — em breve"
              aria-label="Entrar com Apple (em breve)"
            >
              <AppleIcon />
              <span>Entrar com Apple</span>
              <em className="soon-badge">em breve</em>
            </button>
          </div>

          <div className="login-divider">
            <span>ou continue com e-mail</span>
          </div>

          <form className="form-grid" onSubmit={onSubmit}>
            <label>
              E-mail
              <input
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </label>
            <label>
              Senha
              <input
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>

            {loginError && <span className="form-error">{loginError}</span>}

            <div className="login-actions-row">
              <span />
              <a
                href={forgotPasswordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="forgot-password"
              >
                Esqueci minha senha
              </a>
            </div>

            <button type="submit" className="primary-button wide login-submit-btn">
              <LogIn size={16} />
              Entrar
            </button>

            <p className="login-new-user">
              Novo por aqui?{" "}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="login-new-user-link"
              >
                Fale com a gente <ArrowRight size={12} />
              </a>
            </p>

            <p className="privacy-notice">
              Ao entrar, você concorda com o tratamento dos seus dados conforme o{" "}
              <a href="/privacidade">Aviso de Privacidade</a>.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
