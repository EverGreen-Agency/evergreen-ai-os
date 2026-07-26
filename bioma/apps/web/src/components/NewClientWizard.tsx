import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Plus, Sparkles, X, LayoutDashboard, FolderOpen, Users, BarChart3, Link2, KeyRound, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { moduleLabels, statusLabel, toggleableModules } from "../lib/app-config";
import { useCreateClient, useCreateDeliverable, useUpdateClient } from "../hooks/useBiomaApi";
import type { ClientModule, ClientStatus } from "../lib/api";

// Módulos essenciais do núcleo (o hub é obrigatório e sempre ativo)
const BASE_MODULES: ClientModule[] = ["hub"];

// Entregas de arranque do kickoff
const ONBOARDING_TEMPLATE = [
  "Reunião de kickoff",
  "Coletar acessos e credenciais",
  "Briefing e diagnóstico inicial",
  "Definir cronograma e escopo",
];

const MODULE_DESCRIPTIONS: Record<ClientModule, string> = {
  hub: "Visão geral, projetos e acompanhamento do cliente",
  content: "Estúdio IA para geração de posts e roteiros",
  files: "Depósito de documentos e arquivos compartilhados",
  commercial: "CRM comercial e painel financeiro",
  analytics: "Métricas de mídia (Google, Meta, GA4)",
  integrations: "Conexão com ferramentas externas",
  engineering: "Documentação técnica",
};

const STEPS = ["Identidade", "Módulos", "Entregas Iniciais"] as const;

export function NewClientWizard({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const createDeliverable = useCreateDeliverable();

  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [responsible, setResponsible] = useState("Eduardo EG");
  const [status, setStatus] = useState<ClientStatus>("onboarding");
  
  // Por padrão ativamos os módulos recomendados para o novo cliente
  const [modules, setModules] = useState<Set<ClientModule>>(new Set(["content", "files", "commercial", "analytics"]));
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
    if (step === 0 && !identityValid) return;
    setError("");
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setError("");
    setStep((s) => s - 1);
  };

  const handleCreate = async () => {
    setError("");
    try {
      // 1. Criar o cliente no banco
      const res = await createClient.mutateAsync({
        name: name.trim(),
        organization_name: organization.trim(),
        responsible_name: responsible || "Eduardo EG",
        status,
      });

      const clientId = res.client.id;

      // 2. Atualizar os módulos ativos do cliente
      const allModules = Array.from(new Set<ClientModule>(["hub", ...Array.from(modules)]));
      await updateClient.mutateAsync({
        id: clientId,
        payload: { enabled_modules: allModules },
      });

      // 3. Criar entregáveis de kickoff selecionados
      const deliverablePromises = Array.from(onboarding).map((title) =>
        createDeliverable.mutateAsync({
          clientId,
          payload: {
            title,
            status: "planned",
          },
        })
      );
      await Promise.all(deliverablePromises);

      onClose();
      navigate(`/clientes/${clientId}`);
    } catch (err: any) {
      setError(err.message || "Erro ao criar cliente. Tente novamente.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px" }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Sparkles size={18} className="modal-icon" color="var(--brand-accent)" />
            <h2>Novo cliente</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        {/* Stepper */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "12px 20px" }}>
          {STEPS.map((label, index) => (
            <div
              key={label}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.82rem",
                fontWeight: index === step ? 700 : 500,
                color: index === step ? "var(--brand-accent)" : index < step ? "#10b981" : "var(--text-dim)",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "0.75rem",
                  background: index < step ? "#10b981" : index === step ? "var(--brand-accent)" : "var(--surface-sunken)",
                  color: index <= step ? "#000" : "var(--text-dim)",
                  fontWeight: 700,
                }}
              >
                {index < step ? <Check size={13} color="#000" /> : index + 1}
              </span>
              {label}
            </div>
          ))}
        </div>

        <div className="modal-body" style={{ padding: "20px" }}>
          {/* ETAPA 1: IDENTIDADE */}
          {step === 0 && (
            <div className="form-grid two" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
                Nome do Cliente / Empresa *
                <input value={name} autoFocus onChange={(e) => setName(e.target.value)} placeholder="Ex: HM Conexões" style={{ padding: "10px", borderRadius: "6px" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
                Razão Social / Marca *
                <input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Ex: HM Conexões Ltda" style={{ padding: "10px", borderRadius: "6px" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
                Responsável EG
                <select value={responsible} onChange={(e) => setResponsible(e.target.value)} style={{ padding: "10px", borderRadius: "6px" }}>
                  <option value="Eduardo EG">Eduardo EG (eduardo@evergreengrowth.com.br)</option>
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
                Status Inicial
                <select value={status} onChange={(e) => setStatus(e.target.value as ClientStatus)} style={{ padding: "10px", borderRadius: "6px" }}>
                  {(["onboarding", "active", "completed", "paused", "archived"] as ClientStatus[]).map((value) => (
                    <option key={value} value={value}>{statusLabel[value]}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {/* ETAPA 2: MÓDULOS (UNIFORMIZADO E SEM DUPLICAÇÃO) */}
          {step === 1 && (
            <div>
              <p style={{ color: "var(--text-dim)", marginTop: 0, marginBottom: 14, fontSize: "0.86rem" }}>
                Selecione os módulos que serão exibidos no Hub do cliente:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "310px", overflowY: "auto", paddingRight: "4px" }}>
                {/* Módulo Base (Hub) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "var(--surface-sunken)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "0.9rem", color: "var(--text)", display: "block" }}>
                      {moduleLabels["hub"]}
                    </strong>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
                      {MODULE_DESCRIPTIONS["hub"]}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.72rem", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "4px 8px", borderRadius: "4px", fontWeight: 700 }}>
                    SEMPRE ATIVO
                  </span>
                </div>

                {/* Módulos Selecionáveis */}
                {toggleableModules.map((module) => {
                  const on = modules.has(module);
                  return (
                    <button
                      key={module}
                      type="button"
                      onClick={() => toggleModule(module)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        background: on ? "var(--surface)" : "var(--surface-sunken)",
                        border: `1px solid ${on ? "var(--brand-accent)" : "var(--border)"}`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "0.9rem", color: "var(--text)", display: "block" }}>
                          {moduleLabels[module]}
                        </strong>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
                          {MODULE_DESCRIPTIONS[module]}
                        </span>
                      </div>
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          display: "grid",
                          placeItems: "center",
                          background: on ? "var(--brand-accent)" : "transparent",
                          border: `1px solid ${on ? "var(--brand-accent)" : "var(--border)"}`,
                          color: "#000",
                          fontWeight: 700,
                        }}
                      >
                        {on && <Check size={14} color="#000" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ETAPA 3: ENTREGAS INICIAIS ADAPTATIVAS */}
          {step === 2 && (
            <div>
              <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>
                <strong style={{ fontSize: "0.88rem", color: "#10b981", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Rocket size={16} /> Entregas & Marcos de Arranque ({statusLabel[status]})
                </strong>
                <p style={{ margin: "4px 0 0", color: "var(--text)", fontSize: "0.82rem", lineHeight: 1.4 }}>
                  {status === "onboarding"
                    ? "Mesmo com o cliente em onboarding, o sistema já gera estas entregas essenciais no Hub para alinhar o atendimento inicial."
                    : status === "active"
                    ? "Para clientes ativos/em recorrência, você pode selecionar quais entregas operacionais já devem iniciar criadas no Hub do cliente."
                    : status === "completed"
                    ? "Para clientes de sprints/projetos concluídos, selecione as entregas finalizadas para manter o histórico estruturado no Hub."
                    : "Entregas base selecionadas para documentar o histórico do cliente no Hub."}
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontWeight: 600 }}>
                  Entregas sugeridas ({onboarding.size}/{ONBOARDING_TEMPLATE.length}):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (onboarding.size === ONBOARDING_TEMPLATE.length) {
                      setOnboarding(new Set());
                    } else {
                      setOnboarding(new Set(ONBOARDING_TEMPLATE));
                    }
                  }}
                  style={{ background: "none", border: "none", color: "var(--brand-accent)", fontSize: "0.78rem", cursor: "pointer", fontWeight: 600 }}
                >
                  {onboarding.size === ONBOARDING_TEMPLATE.length ? "Desmarcar Todas" : "Selecionar Todas"}
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                {ONBOARDING_TEMPLATE.map((title) => {
                  const on = onboarding.has(title);
                  return (
                    <button
                      key={title}
                      type="button"
                      onClick={() => toggleOnboarding(title)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 14px",
                        background: on ? "var(--surface)" : "var(--surface-sunken)",
                        border: `1px solid ${on ? "var(--brand-accent)" : "var(--border)"}`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        textAlign: "left",
                        color: "var(--text)",
                        fontSize: "0.88rem",
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                          background: on ? "var(--brand-accent)" : "transparent",
                          border: `1px solid ${on ? "var(--brand-accent)" : "var(--border)"}`,
                          color: "#000",
                        }}
                      >
                        {on && <Check size={13} color="#000" />}
                      </span>
                      {title}
                    </button>
                  );
                })}
              </div>

              {/* Resumo do Cadastro */}
              <div style={{ background: "var(--surface-sunken)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 14px", fontSize: "0.85rem" }}>
                <strong style={{ color: "var(--brand-accent)" }}>{name || "—"}</strong> · {organization || "—"}<br />
                <span style={{ color: "var(--text-dim)" }}>
                  Status: <strong>{statusLabel[status]}</strong> • {1 + modules.size} Módulos Habilitados • {onboarding.size} Entregas Iniciais
                </span>
              </div>
            </div>
          )}

          {error && <p style={{ color: "#ef4444", fontSize: "0.84rem", marginTop: 14 }}>{error}</p>}

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
                <Plus size={16} /> {busy ? "Criando Cliente..." : "Criar cliente agora"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
