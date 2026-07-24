import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Plus, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { moduleLabels, statusLabel, toggleableModules } from "../lib/app-config";
import { useCreateClient, useCreateDeliverable, useUpdateClient } from "../hooks/useBiomaApi";
import type { ClientModule, ClientStatus } from "../lib/api";

// Módulos sempre ativos (o backend força "hub"; "content" é base da metodologia).
const BASE_MODULES: ClientModule[] = ["hub", "content"];

// Entregas de arranque sugeridas — o operador escolhe quais criar no onboarding.
const ONBOARDING_TEMPLATE = [
  "Reunião de kickoff",
  "Coletar acessos e credenciais",
  "Briefing e diagnóstico inicial",
  "Definir cronograma e escopo",
];

const STEPS = ["Identidade", "Módulos", "Onboarding"] as const;

export function NewClientWizard({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const createDeliverable = useCreateDeliverable();

  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [responsible, setResponsible] = useState("");
  const [status, setStatus] = useState<ClientStatus>("onboarding");
  // files ligado por default (equivale ao DEFAULT_CLIENT_MODULES do backend).
  const [modules, setModules] = useState<Set<ClientModule>>(new Set(["files"]));
  const [onboarding, setOnboarding] = useState<Set<string>>(new Set(ONBOARDING_TEMPLATE));

  const busy = createClient.isPending || updateClient.isPending;
  const identityValid = name.trim().length > 0 && organization.trim().length > 0;

  const toggleModule = (module: ClientModule) => {
    setModules((prev) => {
      const next = new Set(prev);
      next.has(module) ? next.delete(module) : next.add(module);
      return next;
    });
  };

  const toggleOnboarding = (title: string) => {
    setOnboarding((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  };

  const goNext = () => {
    if (step === 0 && !identityValid) {
      setError("Preencha nome do cliente e organização para avançar.");
      return;
    }
    setError("");
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleCreate = async () => {
    setError("");
    try {
      const portal = await createClient.mutateAsync({
        name: name.trim(),
        organization_name: organization.trim(),
        responsible_name: responsible.trim() || null,
        status,
      });
      const clientId = portal.client.id;

      // enabled_modules não entra na criação; ajusta em seguida se divergir do default.
      const chosen = new Set<ClientModule>([...BASE_MODULES, ...modules]);
      const created = new Set(portal.client.enabled_modules ?? []);
      const differs = chosen.size !== created.size || [...chosen].some((m) => !created.has(m));
      if (differs) {
        await updateClient.mutateAsync({ id: clientId, payload: { enabled_modules: Array.from(chosen) } });
      }

      // Entregas de onboarding são best-effort: uma falha não desfaz o cliente já criado.
      for (const title of onboarding) {
        try {
          await createDeliverable.mutateAsync({ clientId, payload: { title, status: "planned" } });
        } catch {
          /* segue o baile; o cliente existe e o operador pode recriar a entrega */
        }
      }

      onClose();
      navigate(`/clientes/${clientId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar o cliente.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()} style={{ maxWidth: "560px" }}>
        <div className="modal-header">
          <h3><Sparkles size={18} color="var(--brand-accent)" style={{ verticalAlign: "-3px", marginRight: 8 }} />Novo cliente</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
        </div>

        {/* Passos */}
        <div style={{ display: "flex", gap: 8, padding: "0 20px", marginBottom: 4 }}>
          {STEPS.map((label, index) => (
            <div
              key={label}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 0",
                color: index === step ? "var(--brand-accent)" : "var(--text-muted)",
                fontWeight: index === step ? 700 : 500,
                fontSize: "0.82rem",
                borderBottom: `2px solid ${index === step ? "var(--brand-accent)" : "var(--glass-border)"}`,
              }}
            >
              <span
                style={{
                  width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center",
                  fontSize: "0.72rem", flexShrink: 0,
                  background: index < step ? "var(--brand-accent)" : "transparent",
                  color: index < step ? "#111" : "inherit",
                  border: `1px solid ${index <= step ? "var(--brand-accent)" : "var(--glass-border)"}`,
                }}
              >
                {index < step ? <Check size={13} /> : index + 1}
              </span>
              {label}
            </div>
          ))}
        </div>

        <div className="modal-body">
          {step === 0 && (
            <div className="form-grid two" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label>
                Cliente
                <input value={name} autoFocus onChange={(event) => setName(event.target.value)} placeholder="Nome do cliente" />
              </label>
              <label>
                Organização
                <input value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder="Razão social / marca" />
              </label>
              <label>
                Responsável EG
                <select value={responsible} onChange={(event) => setResponsible(event.target.value)}>
                  <option value="">— Selecione um responsável EG —</option>
                  <option value="Eduardo EG">Eduardo EG (eduardo@evergreengrowth.com.br)</option>
                  <option value="Henrique EG">Henrique EG (henrique@hmconexoes.com.br)</option>
                </select>
              </label>
              <label>
                Status inicial
                <select value={status} onChange={(event) => setStatus(event.target.value as ClientStatus)}>
                  {(["onboarding", "active", "paused"] as ClientStatus[]).map((value) => (
                    <option key={value} value={value}>{statusLabel[value]}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {step === 1 && (
            <div>
              <p style={{ color: "var(--text-muted)", marginTop: 0, fontSize: "0.86rem" }}>
                Define o que o cliente enxerga no hub dele. Hub e Conteúdo são sempre ativos.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {BASE_MODULES.map((module) => (
                  <div key={module} className="surface" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", opacity: 0.7 }}>
                    <span>{moduleLabels[module]}</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--brand-accent)", fontWeight: 700 }}>SEMPRE ATIVO</span>
                  </div>
                ))}
                {toggleableModules.map((module) => {
                  const on = modules.has(module);
                  return (
                    <button
                      key={module}
                      type="button"
                      className="surface"
                      onClick={() => toggleModule(module)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 14px", cursor: "pointer", textAlign: "left",
                        borderColor: on ? "var(--brand-accent)" : "var(--glass-border)",
                      }}
                    >
                      <span>{moduleLabels[module]}</span>
                      <span
                        style={{
                          width: 20, height: 20, borderRadius: 6, display: "grid", placeItems: "center",
                          background: on ? "var(--brand-accent)" : "transparent",
                          border: `1px solid ${on ? "var(--brand-accent)" : "var(--glass-border)"}`,
                          color: "#111",
                        }}
                      >
                        {on && <Check size={13} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p style={{ color: "var(--text-muted)", marginTop: 0, fontSize: "0.86rem" }}>
                Entregas de arranque criadas já no hub. Desmarque as que não quiser.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                {ONBOARDING_TEMPLATE.map((title) => {
                  const on = onboarding.has(title);
                  return (
                    <button
                      key={title}
                      type="button"
                      className="surface"
                      onClick={() => toggleOnboarding(title)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px", cursor: "pointer", textAlign: "left",
                        borderColor: on ? "var(--brand-accent)" : "var(--glass-border)",
                      }}
                    >
                      <span
                        style={{
                          width: 20, height: 20, borderRadius: 6, display: "grid", placeItems: "center", flexShrink: 0,
                          background: on ? "var(--brand-accent)" : "transparent",
                          border: `1px solid ${on ? "var(--brand-accent)" : "var(--glass-border)"}`,
                          color: "#111",
                        }}
                      >
                        {on && <Check size={13} />}
                      </span>
                      {title}
                    </button>
                  );
                })}
              </div>
              <div className="surface" style={{ padding: "12px 14px", fontSize: "0.84rem" }}>
                <strong>{name || "—"}</strong> · {organization || "—"}<br />
                <span style={{ color: "var(--text-muted)" }}>
                  {statusLabel[status]} · {BASE_MODULES.length + modules.size} módulos · {onboarding.size} entregas de onboarding
                </span>
              </div>
            </div>
          )}

          {error && <p style={{ color: "var(--danger, #e5484d)", fontSize: "0.84rem", marginTop: 14 }}>{error}</p>}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
            <button className="ghost-button" type="button" onClick={step === 0 ? onClose : goBack} disabled={busy}>
              <ChevronLeft size={16} /> {step === 0 ? "Cancelar" : "Voltar"}
            </button>
            {step < STEPS.length - 1 ? (
              <button className="primary-button" type="button" onClick={goNext} disabled={step === 0 && !identityValid}>
                Avançar <ChevronRight size={16} />
              </button>
            ) : (
              <button className="primary-button" type="button" onClick={handleCreate} disabled={busy}>
                <Plus size={16} /> {busy ? "Criando..." : "Criar cliente"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
