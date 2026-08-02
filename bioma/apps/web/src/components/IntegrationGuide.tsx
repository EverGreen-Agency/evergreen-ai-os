import { useEffect, useState } from "react";
import { BookOpen, ExternalLink, ImageOff, X } from "lucide-react";

import { guideFor, screenshotPath, type IntegrationGuideContent } from "../lib/integration-guides";

/**
 * Guia de "como conectar" de cada integração.
 *
 * Era um acordeão que abria DENTRO do card da integração: o card crescia
 * empurrando a lista inteira, e um guia de oito passos com prints deixava a
 * página impossível de navegar. Agora é botão → modal, que é o que a mão espera
 * de "abrir a documentação".
 *
 * Tinha também um botão "PDF" que chamava `window.print()`. Sem CSS de
 * impressão configurado, aquilo imprimia a aplicação inteira — sidebar, menu e
 * tudo. Removido: exportar guia em PDF é uma feature de verdade (branding,
 * paginação, prints embutidos) e vale ser feita direito quando alguém precisar,
 * não meio-feita atrapalhando quem só quer ler.
 */

const RESPONSIBLE_LABEL: Record<IntegrationGuideContent["responsible"], string> = {
  eg: "Só a EG executa",
  client: "O cliente precisa autorizar",
  both: "EG + cliente, em etapas",
};

/**
 * Slot de print. Enquanto o arquivo não existir em
 * public/assets/integration-guides/<provider>/<slug>.png, mostra um espaço
 * tracejado com o caminho exato esperado — o próprio placeholder documenta
 * onde salvar a imagem.
 */
function ScreenshotSlot({ provider, slug }: { provider: string; slug: string }) {
  const [failed, setFailed] = useState(false);
  const path = screenshotPath(provider, slug);

  if (failed) {
    return (
      <div className="guide-screenshot-empty">
        <ImageOff size={15} />
        <span>
          Espaço reservado para print. Salve em <code>public{path}</code> e recarregue.
        </span>
      </div>
    );
  }

  return (
    <img
      className="guide-screenshot"
      src={path}
      alt={`Print do passo: ${slug}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function GuideModal({
  provider,
  label,
  guide,
  onClose,
}: {
  provider: string;
  label: string;
  guide: IntegrationGuideContent;
  onClose: () => void;
}) {
  // Esc fecha: modal que só fecha no X obriga a mão a sair do teclado.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card guide-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Como conectar ${label}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="guide-modal-header">
          <div>
            <span className="guide-modal-eyebrow">Guia de integração</span>
            <h2>Como conectar {label}</h2>
            <span className="guide-modal-responsible">{RESPONSIBLE_LABEL[guide.responsible]}</span>
          </div>
          <button type="button" className="guide-modal-close" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </header>

        <div className="guide-modal-body">
          <p className="guide-summary">{guide.summary}</p>

          {guide.caveat && (
            <div className="guide-caveat">
              <strong>Atenção:</strong> {guide.caveat}
            </div>
          )}

          {guide.prerequisites.length > 0 && (
            <section>
              <h3>Antes de começar</h3>
              <ul className="guide-list">
                {guide.prerequisites.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          <ol className="guide-steps">
            {guide.steps.map((step, index) => (
              <li key={index}>
                <span className="guide-step-number">{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.description}</p>
                  {step.link && (
                    <a href={step.link.url} target="_blank" rel="noreferrer" className="guide-step-link">
                      {step.link.label} <ExternalLink size={12} />
                    </a>
                  )}
                  {step.screenshot && <ScreenshotSlot provider={provider} slug={step.screenshot} />}
                </div>
              </li>
            ))}
          </ol>

          {guide.envVars && guide.envVars.length > 0 && (
            <section>
              <h3>Configuração do ambiente EG (uma vez, não por cliente)</h3>
              <div className="guide-envvars">
                {guide.envVars.map((envVar) => (
                  <code key={envVar}>{envVar}</code>
                ))}
              </div>
            </section>
          )}
        </div>

        <footer className="guide-modal-footer">
          A EverGreen nunca solicita a senha das suas contas. Todo acesso é concedido por permissão
          nomeada ou autorização oficial da própria plataforma, e pode ser revogado por você a
          qualquer momento.
        </footer>
      </div>
    </div>
  );
}

export function IntegrationGuide({ provider, label }: { provider: string; label: string }) {
  const [open, setOpen] = useState(false);
  const guide = guideFor(provider);

  if (!guide) return null;

  return (
    <>
      <button type="button" className="guide-trigger" onClick={() => setOpen(true)}>
        <BookOpen size={13} />
        Como conectar
        <span className="guide-trigger-badge">{RESPONSIBLE_LABEL[guide.responsible]}</span>
      </button>

      {open && (
        <GuideModal provider={provider} label={label} guide={guide} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
