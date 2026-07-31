import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, ImageOff, Printer, X } from "lucide-react";

import { guideFor, screenshotPath, type IntegrationGuideContent } from "../lib/integration-guides";

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
      <div
        style={{
          border: "1px dashed var(--border-strong)",
          borderRadius: 8,
          padding: "18px 14px",
          background: "var(--surface-soft)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 8,
        }}
      >
        <ImageOff size={16} color="var(--text-faint)" />
        <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--text-dim)" }}>Espaço reservado para print.</strong>
          <br />
          Salve a imagem em <code style={{ color: "var(--accent)" }}>public{path}</code> e recarregue.
        </div>
      </div>
    );
  }

  return (
    <img
      src={path}
      alt={`Print do passo: ${slug}`}
      onError={() => setFailed(true)}
      style={{
        maxWidth: "100%",
        borderRadius: 8,
        border: "1px solid var(--border)",
        marginTop: 8,
        display: "block",
      }}
    />
  );
}

function GuideBody({ provider, guide }: { provider: string; guide: IntegrationGuideContent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-dim)", lineHeight: 1.6 }}>{guide.summary}</p>

      {guide.caveat && (
        <div
          style={{
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--amber-soft)",
            background: "rgba(217, 172, 75, 0.12)",
            border: "1px solid rgba(217, 172, 75, 0.3)",
            borderRadius: 8,
            padding: "10px 12px",
          }}
        >
          <strong>Atenção:</strong> {guide.caveat}
        </div>
      )}

      {guide.prerequisites.length > 0 && (
        <div>
          <h5 style={{ margin: "0 0 6px", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-faint)" }}>
            Antes de começar
          </h5>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7 }}>
            {guide.prerequisites.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
        {guide.steps.map((step, index) => (
          <li key={index} style={{ display: "flex", gap: 12 }}>
            <span
              style={{
                flexShrink: 0,
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "var(--accent)",
                color: "var(--moss-900)",
                fontSize: 12,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {index + 1}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ fontSize: 13, color: "var(--text)" }}>{step.title}</strong>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>{step.description}</p>
              {step.link && (
                <a
                  href={step.link.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12, color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6 }}
                >
                  {step.link.label} <ExternalLink size={12} />
                </a>
              )}
              {step.screenshot && <ScreenshotSlot provider={provider} slug={step.screenshot} />}
            </div>
          </li>
        ))}
      </ol>

      {guide.envVars && guide.envVars.length > 0 && (
        <div>
          <h5 style={{ margin: "0 0 6px", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-faint)" }}>
            Configuração do ambiente EG (uma vez, não por cliente)
          </h5>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {guide.envVars.map((envVar) => (
              <code
                key={envVar}
                style={{
                  fontSize: 11,
                  background: "var(--surface-soft)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "3px 8px",
                  color: "var(--text-dim)",
                }}
              >
                {envVar}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function IntegrationGuide({ provider, label }: { provider: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const guide = guideFor(provider);

  if (!guide) return null;

  return (
    <>
      <div
        style={{
          borderTop: "1px solid var(--border)",
          borderBottom: open ? "1px solid var(--border)" : undefined,
          paddingTop: 8,
          paddingBottom: open ? 12 : 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "var(--text-dim)",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <BookOpen size={13} />
            Como conectar
            <span className="demo-badge" style={{ marginLeft: 4 }}>{RESPONSIBLE_LABEL[guide.responsible]}</span>
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {open && (
            <button
              type="button"
              className="mini-button"
              onClick={() => setPrinting(true)}
              style={{ fontSize: 11, padding: "3px 8px" }}
            >
              <Printer size={12} /> PDF
            </button>
          )}
        </div>

        {open && (
          <div style={{ marginTop: 12 }}>
            <GuideBody provider={provider} guide={guide} />
          </div>
        )}
      </div>

      {printing && <GuidePrintModal provider={provider} label={label} guide={guide} onClose={() => setPrinting(false)} />}
    </>
  );
}

/** Versão clara/impressa do guia, no branding EG, pronta pra enviar ao cliente. */
function GuidePrintModal({
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
  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-card wide printable-report-card"
        onClick={(event) => event.stopPropagation()}
        style={{
          maxWidth: "820px",
          width: "90vw",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#ffffff",
          color: "#09231b",
          padding: "36px",
          borderRadius: "16px",
          fontFamily: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: 16,
            marginBottom: 24,
          }}
        >
          <strong style={{ fontSize: 14, color: "#25794e" }}>Pré-visualização do guia</strong>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="primary-button" type="button" onClick={() => window.print()}>
              <Printer size={15} /> Imprimir / Salvar PDF
            </button>
            <button className="ghost-button" type="button" onClick={onClose}>
              <X size={15} />
            </button>
          </div>
        </div>

        <header style={{ borderLeft: "4px solid #3ac97b", paddingLeft: 16, marginBottom: 28 }}>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: "#25794e", fontWeight: 700 }}>
            EverGreen · Guia de Integração
          </p>
          <h1 style={{ margin: "6px 0 0", fontSize: 26, color: "#09231b" }}>Como conectar {label}</h1>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{guide.summary}</p>
        </header>

        {guide.caveat && (
          <p
            style={{
              fontSize: 12.5,
              lineHeight: 1.6,
              background: "#fdf6e3",
              border: "1px solid #d9ac4b",
              borderRadius: 8,
              padding: "12px 14px",
              color: "#7a5c14",
              marginBottom: 24,
            }}
          >
            <strong>Atenção:</strong> {guide.caveat}
          </p>
        )}

        {guide.prerequisites.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 0.6, color: "#25794e", margin: "0 0 8px" }}>
              Antes de começar
            </h2>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#334155", lineHeight: 1.8 }}>
              {guide.prerequisites.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {guide.steps.map((step, index) => (
            <div key={index} style={{ display: "flex", gap: 14, breakInside: "avoid" }}>
              <span
                style={{
                  flexShrink: 0,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#3ac97b",
                  color: "#09231b",
                  fontSize: 13,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {index + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: 14, color: "#09231b" }}>{step.title}</strong>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{step.description}</p>
                {step.link && (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#25794e", wordBreak: "break-all" }}>
                    {step.link.label}: {step.link.url}
                  </p>
                )}
                {step.screenshot && <PrintScreenshotSlot provider={provider} slug={step.screenshot} />}
              </div>
            </div>
          ))}
        </section>

        <footer style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #e2e8f0", fontSize: 11, color: "#64748b" }}>
          EverGreen · Bioma — a EverGreen nunca solicita a senha das suas contas. Todo acesso é concedido por
          permissão nomeada ou autorização oficial da própria plataforma, e pode ser revogado por você a
          qualquer momento.
        </footer>
      </div>
    </div>
  );
}

function PrintScreenshotSlot({ provider, slug }: { provider: string; slug: string }) {
  const [failed, setFailed] = useState(false);
  const path = screenshotPath(provider, slug);

  if (failed) {
    return (
      <div
        style={{
          border: "1px dashed #cbd5e1",
          borderRadius: 8,
          padding: "22px 14px",
          textAlign: "center",
          fontSize: 11,
          color: "#94a3b8",
          marginTop: 10,
          background: "#f8fafc",
        }}
      >
        [ Espaço reservado para print — salve em <code>public{path}</code> ]
      </div>
    );
  }

  return (
    <img
      src={path}
      alt={`Print do passo: ${slug}`}
      onError={() => setFailed(true)}
      style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #e2e8f0", marginTop: 10, display: "block" }}
    />
  );
}
