import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarCheck,
  Briefcase,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Target,
  Clock,
  Sparkles,
  Users,
} from "lucide-react";

import { useUiStore } from "../store/uiStore";
import { useCockpitSummary, useCurrentUser, useClients, useClientPortal, useMyDeliverables, useMyTasks, usePortfolioPerformance } from "../hooks/useBiomaApi";
import { externalClients } from "../lib/client-scope";
import { SquadsView } from "./SquadsView";

function formatCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function CockpitView() {
  const navigate = useNavigate();
  const { selectedClientId } = useUiStore();
  const { data: user } = useCurrentUser();
  const { data: clientsData } = useClients();
  const { data: portalData } = useClientPortal(selectedClientId);
  const { data: myDeliverablesData } = useMyDeliverables();
  // Duas origens coexistem: `deliverables` (client-hub, responsável por e-mail,
  // é o que move aprovação) e `eg_tasks` (o substituto do ClickUp). O painel
  // lia só a primeira, então nada criado em Tarefas aparecia aqui.
  const { data: myTasksData } = useMyTasks();

  const isEgAdmin = user?.organizations.some((org: { role: string }) => org.role === "eg_admin");
  const { data: cockpitSummary, isLoading: loadingCockpitSummary } = useCockpitSummary(Boolean(isEgAdmin));
  const { data: portfolioPerf = [] } = usePortfolioPerformance(Boolean(isEgAdmin));

  // Prefixo "portfolio" para não colidir com as pendências de UM cliente
  // usadas mais abaixo na visão do cliente.
  const portfolioApprovals = cockpitSummary?.pending_approvals ?? [];
  const overdueItems = cockpitSummary?.overdue_items ?? [];
  const hasAttentionItems = portfolioApprovals.length > 0 || overdueItems.length > 0;

  // Client data
  const clients = externalClients(clientsData ?? []);
  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;
  const portal = portalData ?? null;

  const pendingApprovals = portal?.approvals.filter((approval) => approval.status === "pending") ?? [];
  const activeDeliverables = portal?.deliverables.filter((deliverable) => deliverable.status !== "done" && deliverable.status !== "blocked") ?? [];
  const myDeliverables = myDeliverablesData ?? [];
  const myTasks = myTasksData ?? [];
  const hasAnyPersonalWork = myDeliverables.length > 0 || myTasks.length > 0;

  if (!user) return null;

  // --------------------------------------------------------------------------
  // VISÃO ADMIN (EG)
  // --------------------------------------------------------------------------
  if (isEgAdmin) {
    return (
      <>
        <div className="bento-grid">
          {/* Ocupa o espaço nobre com o que exige ação hoje, em vez de uma
              saudação decorativa: aprovações e atrasos de toda a carteira,
              clicáveis, para não ter que entrar cliente por cliente. */}
          <article className="bento-card col-span-2 row-span-2 cockpit-attention">
            <div className="bento-header">
              <h3>Precisa de você</h3>
              <Sparkles size={16} color="var(--brand-accent)" />
            </div>

            {loadingCockpitSummary && <p style={{ color: "var(--text-muted)" }}>Carregando carteira...</p>}

            {!loadingCockpitSummary && !hasAttentionItems && (
              <div style={{ marginTop: "auto" }}>
                <h2>Bom dia, {user.display_name}!</h2>
                <p style={{ color: "var(--text-muted)" }}>
                  Nada pendente na carteira agora — nenhuma aprovação aguardando nem entrega atrasada.
                </p>
              </div>
            )}

            {!loadingCockpitSummary && hasAttentionItems && (
              <div className="cockpit-attention-lists">
                {portfolioApprovals.length > 0 && (
                  <div>
                    <h4 className="cockpit-attention-title">
                      <CalendarCheck size={13} /> Aprovações aguardando ({portfolioApprovals.length})
                    </h4>
                    <ul className="cockpit-attention-list">
                      {portfolioApprovals.map((approval) => (
                        <li key={approval.id}>
                          <button type="button" onClick={() => navigate(`/clientes/${approval.client_id}`)}>
                            <strong>{approval.deliverable_title ?? "Aprovação"}</strong>
                            <span>{approval.client_name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {overdueItems.length > 0 && (
                  <div>
                    <h4 className="cockpit-attention-title">
                      <Clock size={13} color="#ff5252" /> Entregas atrasadas ({cockpitSummary?.overdue_deliverables ?? 0})
                    </h4>
                    <ul className="cockpit-attention-list">
                      {overdueItems.map((item) => (
                        <li key={item.id}>
                          <button type="button" onClick={() => navigate(`/clientes/${item.client_id}/tarefas`)}>
                            <strong>{item.title}</strong>
                            <span>
                              {item.client_name} · venceu em{" "}
                              {new Date(item.due_at).toLocaleDateString("pt-BR")}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </article>

          <article className="bento-card">
            <div className="bento-header">
              <h3>Faturamento (Mês)</h3>
              <TrendingUp size={16} />
            </div>
            <div className="bento-value">
              {loadingCockpitSummary ? "..." : formatCents(cockpitSummary?.monthly_revenue_cents ?? 0)}
            </div>
            <div className="bento-footer">Faturas pagas no mês corrente</div>
          </article>

          <article className="bento-card">
            <div className="bento-header">
              <h3>MRR Atual</h3>
              <TrendingUp size={16} />
            </div>
            <div className="bento-value">
              {loadingCockpitSummary ? "..." : formatCents(cockpitSummary?.mrr_cents ?? 0)}
            </div>
            <div className="bento-footer">Contratos recorrentes ativos</div>
          </article>

          <article className="bento-card">
            <div className="bento-header">
              <h3>Clientes em Risco</h3>
              <AlertTriangle size={16} color="#ffab00" />
            </div>
            <div className="bento-value" style={{ color: '#ffab00' }}>
              {loadingCockpitSummary ? "..." : cockpitSummary?.clients_at_risk ?? 0}
            </div>
            <div className="bento-footer">Entrega atrasada ou fatura vencida</div>
          </article>

          <article className="bento-card">
            <div className="bento-header">
              <h3>Entregas Atrasadas</h3>
              <Clock size={16} color="#ff5252" />
            </div>
            <div className="bento-value" style={{ color: '#ff5252' }}>
              {loadingCockpitSummary ? "..." : cockpitSummary?.overdue_deliverables ?? 0}
            </div>
            <div className="bento-footer">Visão global de SLAs críticos</div>
          </article>
        </div>

        {/* Rollup executivo: mídia paga de todos os clientes lado a lado,
            lendo as mesmas tabelas que os syncs populam. Elimina o abre-aba
            cliente por cliente para comparar investimento e lead. */}
        {portfolioPerf.some((row) => row.total_spend_cents > 0 || row.total_leads > 0) && (
          <section className="content-grid" style={{ marginTop: "1.5rem" }}>
            <article className="surface large" style={{ gridColumn: "1 / -1" }}>
              <div className="surface-header">
                <TrendingUp size={18} />
                <h3>Performance da carteira (30 dias)</h3>
              </div>
              <div style={{ padding: "0 24px 20px", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "var(--text-dim)", fontSize: 11, textTransform: "uppercase" }}>
                      <th style={{ padding: "8px 12px 8px 0" }}>Cliente</th>
                      <th style={{ padding: "8px 12px" }}>Google Ads</th>
                      <th style={{ padding: "8px 12px" }}>Meta Ads</th>
                      <th style={{ padding: "8px 12px" }}>LinkedIn</th>
                      <th style={{ padding: "8px 12px" }}>Total</th>
                      <th style={{ padding: "8px 12px" }}>Leads</th>
                      <th style={{ padding: "8px 12px" }}>CPL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioPerf.map((row) => (
                      <tr
                        key={row.client_id}
                        style={{ borderTop: "1px solid var(--border)", cursor: "pointer" }}
                        onClick={() => navigate(`/clientes/${row.client_id}/analytics`)}
                      >
                        <td style={{ padding: "10px 12px 10px 0", fontWeight: 600 }}>{row.client_name}</td>
                        <td style={{ padding: "10px 12px" }}>{formatCents(row.google_spend_cents)}</td>
                        <td style={{ padding: "10px 12px" }}>{formatCents(row.meta_spend_cents)}</td>
                        <td style={{ padding: "10px 12px" }}>{formatCents(row.linkedin_spend_cents)}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>{formatCents(row.total_spend_cents)}</td>
                        <td style={{ padding: "10px 12px" }}>{row.total_leads}</td>
                        <td style={{ padding: "10px 12px", color: "var(--text-dim)" }}>
                          {row.total_leads > 0 ? formatCents(Math.round(row.total_spend_cents / row.total_leads)) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        )}

        <section className="content-grid">
          <article className="surface large">
            <div className="surface-header">
              <Users size={18} />
              <h3>Carteira</h3>
            </div>
            {/* O texto antigo dizia "N clientes ativos" contando também
                onboarding/pausado/arquivado. Agora os dois números aparecem
                separados, sem prometer o que o dado não sustenta. */}
            <div className="cockpit-portfolio">
              <button type="button" className="cockpit-portfolio-stat" onClick={() => navigate("/clientes")}>
                <strong>{loadingCockpitSummary ? "..." : cockpitSummary?.clients_active ?? 0}</strong>
                <span>ativos</span>
              </button>
              <button type="button" className="cockpit-portfolio-stat" onClick={() => navigate("/clientes")}>
                <strong>{loadingCockpitSummary ? "..." : cockpitSummary?.clients_total ?? 0}</strong>
                <span>na carteira</span>
              </button>
            </div>
            <div className="cockpit-shortcuts">
              <button className="bento-action" onClick={() => navigate("/clientes")}>
                Carteira de Clientes <ArrowRight size={16} />
              </button>
              <button className="bento-action ghost" onClick={() => navigate("/eg-propostas")}>
                Propostas <ArrowRight size={16} />
              </button>
              <button className="bento-action ghost" onClick={() => navigate("/operacao")}>
                Operação EG <ArrowRight size={16} />
              </button>
              <button className="bento-action ghost" onClick={() => navigate("/eg-ideas")}>
                Banco de Ideias <ArrowRight size={16} />
              </button>
              <button className="bento-action ghost" onClick={() => navigate("/eg-office")}>
                Escritório Virtual <ArrowRight size={16} />
              </button>
            </div>
          </article>

          <article className="surface large">
            <div className="surface-header">
              <CalendarCheck size={18} />
              <h3>Minhas tarefas</h3>
            </div>
            <div className="timeline-list">
              {!hasAnyPersonalWork && (
                <div className="timeline-row">
                  <span style={{ background: "transparent", color: "var(--text-muted)" }}>Tudo em dia</span>
                  <strong>Nenhuma tarefa atribuída a você no momento.</strong>
                </div>
              )}

              {/* Tarefas do sistema que substituiu o ClickUp — inclui a
                  demanda interna da EG, não só a de cliente. */}
              {myTasks.map((task) => (
                <button
                  type="button"
                  className="timeline-row cockpit-task-row"
                  key={task.id}
                  onClick={() =>
                    navigate(
                      task.workspace_kind === "agency_internal"
                        ? `/operacao/tarefas?list=${task.list_id}`
                        : `/clientes/${task.workspace_id}/tarefas?list=${task.list_id}`,
                    )
                  }
                >
                  <span>
                    {task.workspace_kind === "agency_internal" ? "EG interno" : task.workspace_name}
                  </span>
                  <strong>{task.title}</strong>
                  <small>
                    {task.list_name}
                    {task.project_name ? ` · ${task.project_name}` : ""} · {task.status} · Prazo:{" "}
                    {task.due_date ? new Date(task.due_date).toLocaleDateString("pt-BR") : "sem prazo"}
                  </small>
                </button>
              ))}

              {/* Entregáveis do client-hub: origem diferente, é o que move o
                  fluxo de aprovação do cliente. */}
              {myDeliverables.map((task: any) => (
                <div className="timeline-row" key={task.id}>
                  <span>{task.client_name ?? "Agência"}</span>
                  <strong>{task.title}</strong>
                  <small>Entregável · {task.status} · Prazo: {task.due_at ? new Date(task.due_at).toLocaleDateString("pt-BR") : "sem prazo"}</small>
                </div>
              ))}
            </div>
          </article>
        </section>
      </>
    );
  }

  // --------------------------------------------------------------------------
  // VISÃO CLIENTE
  // --------------------------------------------------------------------------
  return (
    <>
      <div className="bento-grid">
        {/* Welcome Card */}
        <article className="bento-card col-span-3" style={{ background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(58, 201, 123, 0.05) 100%)' }}>
          <div className="bento-header">
            <h3>Visão do Cliente</h3>
            <Target size={16} color="var(--brand-accent)" />
          </div>
          <div>
            <h2>Bem-vindo(a), {user.display_name}!</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Aqui é o cockpit do seu projeto <strong>{selectedClient?.name ?? "..."}</strong>.
              Acompanhe o progresso da sua operação conosco.
            </p>
          </div>
        </article>

        {/* CTA Aprovações Pendentes */}
        <article className="bento-card" style={{ background: pendingApprovals.length > 0 ? 'var(--brand-accent)' : 'var(--bg-surface)' }}>
          <div className="bento-header" style={{ color: pendingApprovals.length > 0 ? '#111' : '' }}>
            <h3>Aprovações Pendentes</h3>
            <CalendarCheck size={16} />
          </div>
          <div className="bento-value" style={{ color: pendingApprovals.length > 0 ? '#111' : '' }}>
            {pendingApprovals.length}
          </div>
          {pendingApprovals.length > 0 && (
            <button 
              style={{ background: '#111', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, marginTop: 'auto' }}
              onClick={() => navigate(selectedClient ? `/clientes/${selectedClient.id}` : "/clientes")}
            >
              Revisar agora
            </button>
          )}
        </article>

        <article className="bento-card col-span-2">
          <div className="bento-header">
            <h3>Entregas Ativas</h3>
            <Briefcase size={16} />
          </div>
          <div className="bento-value">{activeDeliverables.length}</div>
          <div className="bento-footer">Tarefas sendo trabalhadas no momento pela equipe.</div>
        </article>
      </div>

      {selectedClientId && (
        <div style={{ marginTop: "1.5rem" }}>
          <SquadsView workspaceId={selectedClientId} />
        </div>
      )}

      <section className="content-grid" style={{ marginTop: "1.5rem" }}>
        <article className="surface large">
          <div className="surface-header">
            <CalendarCheck size={18} />
            <h3>Próximas ações necessárias</h3>
          </div>
          <div className="timeline-list">
            {pendingApprovals.length === 0 ? (
              <div className="timeline-row">
                <span style={{ background: "transparent", color: "var(--text-muted)" }}>Tudo em dia</span>
                <strong>Nenhuma aprovação pendente no momento.</strong>
              </div>
            ) : (
              pendingApprovals.map((approval) => (
                <div className="timeline-row" key={approval.id}>
                  <span>Aprovação</span>
                  <strong>{approval.deliverable_title ?? "Aprovação pendente"}</strong>
                  <small>{approval.comment ?? "Aguardando seu feedback."}</small>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </>
  );
}
