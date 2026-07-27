import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, GitBranch, ListTree, Sparkles } from "lucide-react";

import { api, type ProjectDetail, type ProjectPlan, type WorkspaceSummary } from "../lib/api";

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
  const [approvalFlow, setApprovalFlow] = useState<keyof typeof APPROVAL_FLOW>("adaptive");

  const refresh = async () => onChanged(await api.project(project.id));
  const generate = useMutation({
    mutationFn: () => {
      const contract = project.contracts[0];
      return api.generateProjectPlan(project.id, {
        contract_id: contract?.id ?? null,
        source_kind: contract ? "contract" : briefing.trim() ? "briefing" : "onboarding",
        briefing: briefing.trim() || null,
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
  const createIssue = useMutation({
    mutationFn: ({ deliverableId, body }: { deliverableId: string; body: string }) =>
      api.createGitHubIssue(deliverableId, body),
    onSuccess: refresh,
  });

  const error = generate.error ?? approve.error ?? materialize.error ?? createIssue.error;

  return (
    <section className="project-section project-planner">
      <h3><ListTree size={16} /> Planejador do projeto</h3>
      <p className="panel-footnote">
        Converte contrato ou briefing em um plano versionado. O plano precisa de aprovação antes de criar fases e entregas no Hub.
        {project.project_type === "tech"
          ? " Itens técnicos podem virar issues, sempre com confirmação individual."
          : " Este fluxo permanece dentro do Bioma e não cria issues no GitHub."}
      </p>

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

          <div style={{ display: "grid", gap: 7 }}>
            {plan.items.map((item) => (
              <div className="scope-row" key={item.id}>
                <span>
                  <strong>{item.phase_name}</strong> · {item.title}
                  {item.approval_required && <small> · exige aceite</small>}
                </span>
                <small>
                  {item.materialized_deliverable_id ? "Entrega criada" : `D+${item.due_offset_days ?? "—"}`}
                  {item.github_issue_url && (
                    <> · <a href={item.github_issue_url} target="_blank" rel="noreferrer">issue #{item.github_issue_number} <ExternalLink size={11} /></a></>
                  )}
                </small>
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
                            "",
                            `Plano: ${plan.title} v${plan.version}`,
                            item.approval_required ? "Critério: exige validação/aceite antes de concluir." : "",
                          ].filter(Boolean).join("\n"),
                        });
                      }}
                    >
                      <GitBranch size={13} /> Criar issue
                    </button>
                  )}
              </div>
            ))}
          </div>

          <footer style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {plan.status === "draft" && canApprove && (
              <button
                className="mini-button"
                type="button"
                disabled={approve.isPending}
                onClick={() => {
                  if (window.confirm(`Aprovar o plano v${plan.version}? Ele ficará pronto para aplicação.`)) {
                    approve.mutate(plan.id);
                  }
                }}
              >
                <CheckCircle2 size={13} /> Aprovar plano
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
