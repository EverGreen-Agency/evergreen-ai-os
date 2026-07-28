import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, ExternalLink, GitBranch, ListTree, Pencil, Save, Sparkles } from "lucide-react";

import { api, type ProjectDetail, type ProjectPlan, type ProjectPlanItem, type WorkspaceSummary } from "../lib/api";

type AccessRole = WorkspaceSummary["access_role"];

const PLAN_STATUS: Record<ProjectPlan["status"], string> = {
  draft: "Rascunho",
  approved: "Aprovado",
  materialized: "Aplicado ao projeto",
  superseded: "Substituído",
};

const APPROVAL_FLOW = {
  adaptive: "Adaptativo por cliente",
  idea_before_production: "Aprovar ideia antes da produção",
  after_production: "Aprovar após produção",
  final_only: "Aprovar somente versão final",
} as const;

const PRIORITY_LABEL: Record<ProjectPlanItem["priority"], string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

type CandidateDraft = Pick<
  ProjectPlanItem,
  "phase_name" | "title" | "description" | "due_offset_days" | "client_visible" |
  "approval_required" | "priority" | "definition_of_done" | "subtasks"
>;

export function ProjectPlanner({
  project,
  accessRole,
  onChanged,
}: {
  project: ProjectDetail;
  accessRole: AccessRole;
  onChanged: (project: ProjectDetail) => Promise<void>;
}) {
  const canManage = ["platform_admin", "tenant_admin", "workspace_manager", "operator"].includes(accessRole);
  const canApprove = ["platform_admin", "tenant_admin", "workspace_manager", "approver"].includes(accessRole);
  const [briefing, setBriefing] = useState("");
  const [technicalContext, setTechnicalContext] = useState("");
  const [contractId, setContractId] = useState("");
  const [approvalFlow, setApprovalFlow] = useState<keyof typeof APPROVAL_FLOW>("adaptive");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [candidateDraft, setCandidateDraft] = useState<CandidateDraft | null>(null);
  const clientProfile = useQuery({
    queryKey: ["client-profile", project.workspace_id],
    queryFn: () => api.clientProfile(project.workspace_id),
  });

  const refresh = async () => onChanged(await api.project(project.id));
  const generate = useMutation({
    mutationFn: () => {
      const contract = project.contracts.find((item) => item.id === contractId) ?? project.contracts[0];
      return api.generateProjectPlan(project.id, {
        contract_id: contract?.id ?? null,
        source_kind: contract ? "contract" : briefing.trim() ? "briefing" : "onboarding",
        briefing: briefing.trim() || null,
        technical_context: technicalContext.trim() || null,
        objective: project.objective,
        social_approval_flow: approvalFlow,
      });
    },
    onSuccess: refresh,
  });
  const approve = useMutation({
    mutationFn: (planId: string) => api.approveProjectPlan(planId),
    onSuccess: refresh,
  });
  const materialize = useMutation({
    mutationFn: (planId: string) => api.materializeProjectPlan(planId),
    onSuccess: onChanged,
  });
  const updateCandidate = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: Partial<CandidateDraft> & { selected?: boolean } }) =>
      api.updateProjectPlanItem(itemId, payload),
    onSuccess: async () => {
      setEditingItemId(null);
      setCandidateDraft(null);
      await refresh();
    },
  });
  const bulkSelection = useMutation({
    mutationFn: ({ plan, selected }: { plan: ProjectPlan; selected: boolean }) =>
      Promise.all(
        plan.items
          .filter((item) => item.selected !== selected)
          .map((item) => api.updateProjectPlanItem(item.id, { selected })),
      ),
    onSuccess: refresh,
  });
  const createIssue = useMutation({
    mutationFn: ({ deliverableId, body }: { deliverableId: string; body: string }) =>
      api.createGitHubIssue(deliverableId, body),
    onSuccess: refresh,
  });

  const error = generate.error ?? approve.error ?? materialize.error ?? updateCandidate.error
    ?? bulkSelection.error ?? createIssue.error;

  const beginEdit = (item: ProjectPlanItem) => {
    setEditingItemId(item.id);
    setCandidateDraft({
      phase_name: item.phase_name,
      title: item.title,
      description: item.description,
      due_offset_days: item.due_offset_days,
      client_visible: item.client_visible,
      approval_required: item.approval_required,
      priority: item.priority,
      definition_of_done: item.definition_of_done,
      subtasks: item.subtasks,
    });
  };

  return (
    <section className="project-section project-planner">
      <h3><ListTree size={16} /> Planejador do projeto</h3>
      <p className="panel-footnote">
        Converte contrato ou briefing em um plano versionado. O plano precisa de aprovação antes de criar fases e entregas no Hub.
        {project.project_type === "tech"
          ? " Itens técnicos podem virar issues, sempre com confirmação individual."
          : " Este fluxo permanece dentro do Bioma e não cria issues no GitHub."}
      </p>
      <div className="notice">
        <strong>Contexto do cliente: {clientProfile.isLoading ? "carregando..." : `${clientProfile.data?.completion_percentage ?? 0}% completo`}</strong>
        <span style={{ display: "block", marginTop: 4 }}>
          Contrato, escopo, documentos e contexto cadastrado qualificam o backlog. Campos ausentes viram premissas, nunca fatos inventados.
        </span>
      </div>

      {canManage && (
        <div className="surface" style={{ padding: 14, display: "grid", gap: 10 }}>
          {!project.contracts.length && (
            <textarea
              rows={3}
              value={briefing}
              onChange={(event) => setBriefing(event.target.value)}
              placeholder="Briefing opcional. Sem contrato ou briefing, o plano parte do objetivo e do onboarding."
            />
          )}
          {project.contracts.length > 1 && (
            <label style={{ display: "grid", gap: 4 }}>
              <span className="panel-footnote">Contrato de referência</span>
              <select value={contractId} onChange={(event) => setContractId(event.target.value)}>
                <option value="">Versão mais recente</option>
                {project.contracts.map((contract) => <option value={contract.id} key={contract.id}>v{contract.version} · {contract.title}</option>)}
              </select>
            </label>
          )}
          {project.project_type === "tech" && (
            <textarea
              rows={4}
              value={technicalContext}
              onChange={(event) => setTechnicalContext(event.target.value)}
              placeholder="Contexto técnico complementar: requisitos, integrações, restrições, critérios de teste ou trecho confirmado da especificação."
            />
          )}
          {project.project_type === "social" && (
            <label style={{ display: "grid", gap: 4 }}>
              <span className="panel-footnote">Momento de aprovação do cliente</span>
              <select value={approvalFlow} onChange={(event) => setApprovalFlow(event.target.value as keyof typeof APPROVAL_FLOW)}>
                {Object.entries(APPROVAL_FLOW).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
          )}
          <button className="mini-button" type="button" disabled={generate.isPending} onClick={() => generate.mutate()}>
            <Sparkles size={14} /> {generate.isPending ? "Planejando..." : "Gerar nova versão do plano"}
          </button>
        </div>
      )}

      {error && <p className="form-error">{error.message}</p>}
      {project.plans.length === 0 && <p className="panel-footnote">Nenhum plano gerado para este projeto.</p>}

      {project.plans.map((plan) => (
        <article className="surface" key={plan.id} style={{ padding: 14, marginTop: 10 }}>
          <header style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <strong>{plan.title}</strong>
              <small style={{ display: "block" }}>
                v{plan.version} · {PLAN_STATUS[plan.status]} · {plan.generation_mode}
              </small>
            </div>
            <span className={`status-pill ${plan.status}`}>{plan.discipline}</span>
          </header>
          {plan.objective && <p>{plan.objective}</p>}
          {plan.assumptions.length > 0 && (
            <ul className="panel-footnote">
              {plan.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}
            </ul>
          )}

          {plan.status === "draft" && (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 8 }}>
              <small>{plan.items.filter((item) => item.selected).length} de {plan.items.length} candidatos selecionados</small>
              {canManage && (
                <span style={{ display: "flex", gap: 6 }}>
                  <button className="mini-button" type="button" disabled={bulkSelection.isPending} onClick={() => bulkSelection.mutate({ plan, selected: true })}>
                    Selecionar todos
                  </button>
                  <button className="mini-button" type="button" disabled={bulkSelection.isPending} onClick={() => bulkSelection.mutate({ plan, selected: false })}>
                    Limpar seleção
                  </button>
                </span>
              )}
            </div>
          )}

          <div style={{ display: "grid", gap: 7 }}>
            {(plan.status === "draft" ? plan.items : plan.items.filter((item) => item.selected)).map((item) => (
              <details className="scope-row" key={item.id} style={{ display: "block" }}>
                <summary style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  {plan.status === "draft" && canManage && (
                    <input
                      type="checkbox"
                      checked={item.selected}
                      disabled={updateCandidate.isPending}
                      aria-label={`Selecionar ${item.title}`}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => updateCandidate.mutate({ itemId: item.id, payload: { selected: event.target.checked } })}
                    />
                  )}
                  <ChevronDown size={13} />
                  <span style={{ flex: 1 }}>
                    <strong>{item.phase_name}</strong> · {item.title}
                    {item.approval_required && <small> · exige aceite</small>}
                  </span>
                  <small>{PRIORITY_LABEL[item.priority]} · {item.materialized_deliverable_id ? "Entrega criada" : `D+${item.due_offset_days ?? "—"}`}</small>
                </summary>

                <div style={{ display: "grid", gap: 8, padding: "10px 4px 2px 28px" }}>
                  {item.description && <p style={{ margin: 0 }}>{item.description}</p>}
                  {item.definition_of_done && (
                    <div><strong>Definição de pronto</strong><p style={{ margin: "4px 0 0" }}>{item.definition_of_done}</p></div>
                  )}
                  {item.subtasks.length > 0 && (
                    <div><strong>Subtarefas</strong><ul>{item.subtasks.map((subtask) => <li key={subtask}>{subtask}</li>)}</ul></div>
                  )}
                  <small>
                    {item.client_visible ? "Visível ao cliente" : "Somente equipe"}
                    {item.github_issue_url && (
                      <> · <a href={item.github_issue_url} target="_blank" rel="noreferrer">issue #{item.github_issue_number} <ExternalLink size={11} /></a></>
                    )}
                  </small>

                  {plan.status === "draft" && canManage && editingItemId !== item.id && (
                    <button className="mini-button" type="button" onClick={() => beginEdit(item)}>
                      <Pencil size={13} /> Editar candidato
                    </button>
                  )}
                  {plan.status === "draft" && canManage && editingItemId === item.id && candidateDraft && (
                    <div className="surface" style={{ display: "grid", gap: 8, padding: 10 }}>
                      <input value={candidateDraft.phase_name} onChange={(event) => setCandidateDraft({ ...candidateDraft, phase_name: event.target.value })} placeholder="Fase" />
                      <input value={candidateDraft.title} onChange={(event) => setCandidateDraft({ ...candidateDraft, title: event.target.value })} placeholder="Título" />
                      <textarea rows={3} value={candidateDraft.description ?? ""} onChange={(event) => setCandidateDraft({ ...candidateDraft, description: event.target.value || null })} placeholder="Descrição" />
                      <textarea rows={3} value={candidateDraft.definition_of_done ?? ""} onChange={(event) => setCandidateDraft({ ...candidateDraft, definition_of_done: event.target.value || null })} placeholder="Definição de pronto" />
                      <textarea
                        rows={4}
                        value={candidateDraft.subtasks.join("\n")}
                        onChange={(event) => setCandidateDraft({
                          ...candidateDraft,
                          subtasks: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean),
                        })}
                        placeholder="Uma subtarefa por linha"
                      />
                      <label>
                        Prioridade
                        <select value={candidateDraft.priority} onChange={(event) => setCandidateDraft({ ...candidateDraft, priority: event.target.value as ProjectPlanItem["priority"] })}>
                          {Object.entries(PRIORITY_LABEL).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                        </select>
                      </label>
                      <label>
                        Prazo relativo (dias)
                        <input
                          type="number"
                          min={0}
                          max={730}
                          value={candidateDraft.due_offset_days ?? ""}
                          onChange={(event) => setCandidateDraft({ ...candidateDraft, due_offset_days: event.target.value === "" ? null : Number(event.target.value) })}
                        />
                      </label>
                      <label><input type="checkbox" checked={candidateDraft.client_visible} onChange={(event) => setCandidateDraft({ ...candidateDraft, client_visible: event.target.checked })} /> Visível ao cliente</label>
                      <label><input type="checkbox" checked={candidateDraft.approval_required} onChange={(event) => setCandidateDraft({ ...candidateDraft, approval_required: event.target.checked })} /> Exige aceite</label>
                      <span style={{ display: "flex", gap: 6 }}>
                        <button className="mini-button" type="button" disabled={updateCandidate.isPending} onClick={() => updateCandidate.mutate({ itemId: item.id, payload: candidateDraft })}>
                          <Save size={13} /> Salvar
                        </button>
                        <button className="mini-button" type="button" onClick={() => { setEditingItemId(null); setCandidateDraft(null); }}>Cancelar</button>
                      </span>
                    </div>
                  )}

                  {project.project_type === "tech"
                    && item.github_eligible
                    && item.materialized_deliverable_id
                    && !item.github_issue_url
                    && canManage && (
                      <button
                        className="mini-button"
                        type="button"
                        disabled={createIssue.isPending}
                        onClick={() => {
                          if (!window.confirm(`Criar uma issue real no GitHub para "${item.title}"?`)) return;
                          createIssue.mutate({
                            deliverableId: item.materialized_deliverable_id!,
                            body: [
                              item.description || "Entrega originada do plano aprovado no Bioma.",
                              item.definition_of_done ? `Definição de pronto:\n${item.definition_of_done}` : "",
                              item.subtasks.length ? `Subtarefas:\n${item.subtasks.map((value) => `- ${value}`).join("\n")}` : "",
                              `Plano: ${plan.title} v${plan.version}`,
                              item.approval_required ? "Critério: exige validação/aceite antes de concluir." : "",
                            ].filter(Boolean).join("\n\n"),
                          });
                        }}
                      >
                        <GitBranch size={13} /> Criar issue
                      </button>
                    )}
                </div>
              </details>
            ))}
          </div>

          <footer style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {plan.status === "draft" && canApprove && (
              <button
                className="mini-button"
                type="button"
                disabled={approve.isPending || plan.items.every((item) => !item.selected)}
                onClick={() => {
                  if (window.confirm(`Aprovar o plano v${plan.version}? Ele ficará pronto para aplicação.`)) {
                    approve.mutate(plan.id);
                  }
                }}
              >
                <CheckCircle2 size={13} /> Aprovar {plan.items.filter((item) => item.selected).length} itens
              </button>
            )}
            {plan.status === "approved" && canManage && (
              <button
                className="mini-button"
                type="button"
                disabled={materialize.isPending}
                onClick={() => {
                  if (window.confirm("Criar as fases e entregas deste plano no Hub? A operação é idempotente.")) {
                    materialize.mutate(plan.id);
                  }
                }}
              >
                <ListTree size={13} /> Aplicar ao projeto
              </button>
            )}
          </footer>
        </article>
      ))}
    </section>
  );
}
