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
import { useCockpitSummary, useCurrentUser, useClients, useClientPortal, useMyDeliverables } from "../hooks/useBiomaApi";
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

  const isEgAdmin = user?.organizations.some((org: { role: string }) => org.role === "eg_admin");
  const { data: cockpitSummary, isLoading: loadingCockpitSummary } = useCockpitSummary(Boolean(isEgAdmin));

  // Client data
  const clients = externalClients(clientsData ?? []);
  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;
  const portal = portalData ?? null;

  const pendingApprovals = portal?.approvals.filter((approval) => approval.status === "pending") ?? [];
  const activeDeliverables = portal?.deliverables.filter((deliverable) => deliverable.status !== "done" && deliverable.status !== "blocked") ?? [];
  const myDeliverables = myDeliverablesData ?? [];

  if (!user) return null;

  // --------------------------------------------------------------------------
  // VISÃO ADMIN (EG)
  // --------------------------------------------------------------------------
  if (isEgAdmin) {
    return (
      <>
        <div className="bento-grid">
          {/* Hero Banner */}
          <article className="bento-card col-span-2 row-span-2" style={{ background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(58, 201, 123, 0.1) 100%)' }}>
            <div className="bento-header">
              <h3>Visão Geral da Operação</h3>
              <Sparkles size={16} color="var(--brand-accent)" />
            </div>
            <div style={{ marginTop: 'auto' }}>
              <h2>Bom dia, {user.display_name}!</h2>
              <p style={{ color: 'var(--text-muted)' }}>Você tem {clients.length} clientes ativos na base.</p>
            </div>
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

        <section className="content-grid">
          <article className="surface large">
            <div className="surface-header">
              <Users size={18} />
              <h3>Atalhos Administrativos</h3>
            </div>
            <div style={{ padding: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button className="bento-action" onClick={() => navigate("/clientes")}>
                Carteira de Clientes <ArrowRight size={16} />
              </button>
              <button className="bento-action" onClick={() => navigate("/eg-office")} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)' }}>
                Ir para o Escritório Virtual (Phaser)
              </button>
              <button className="bento-action" onClick={() => navigate("/eg-ideas")} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)' }}>
                Banco de Ideias
              </button>
            </div>
          </article>

          <article className="surface large">
            <div className="surface-header">
              <CalendarCheck size={18} />
              <h3>Minhas tarefas</h3>
            </div>
            <div className="timeline-list">
              {myDeliverables.length === 0 ? (
                <div className="timeline-row">
                  <span style={{ background: "transparent", color: "var(--text-muted)" }}>Tudo em dia</span>
                  <strong>Nenhuma tarefa atribuída a você no momento.</strong>
                </div>
              ) : (
                myDeliverables.map((task: any) => (
                  <div className="timeline-row" key={task.id}>
                    <span>{task.client_name ?? "Agência"}</span>
                    <strong>{task.title}</strong>
                    <small>Status: {task.status} | Prazo: {task.due_at ? new Date(task.due_at).toLocaleDateString() : "Sem prazo"}</small>
                  </div>
                ))
              )}
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
