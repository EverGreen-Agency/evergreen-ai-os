import { FormEvent, useMemo, useState } from "react";
import { Building2, CircleDollarSign, Plus, Trash2, WalletCards } from "lucide-react";
import { EmptyState, SectionHeader } from "../components/shared";
import {
  type FinancialRecordKind,
  type FinancialRecordPayload,
  type FinancialRecordStatus,
  type FinancialRecordSummary,
  type LeadPayload,
  type LeadStage,
  type LeadSummary,
} from "../lib/api";
import { useUiStore } from "../store/uiStore";
import {
  useCurrentUser,
  useClients,
  useLeads,
  useCreateLead,
  useUpdateLead,
  useDeleteLead,
  useFinance,
  useCreateFinancialRecord,
  useUpdateFinancialRecord,
  useDeleteFinancialRecord
} from "../hooks/useBiomaApi";

const leadStages: Array<{ id: LeadStage; label: string }> = [
  { id: "new", label: "Novo" },
  { id: "qualifying", label: "Qualificando" },
  { id: "meeting", label: "Reunião" },
  { id: "proposal", label: "Proposta" },
  { id: "won", label: "Ganho" },
  { id: "lost", label: "Perdido" },
];

const financialStatuses: Array<{ id: FinancialRecordStatus; label: string }> = [
  { id: "draft", label: "Rascunho" },
  { id: "open", label: "Aberto" },
  { id: "paid", label: "Pago" },
  { id: "overdue", label: "Vencido" },
  { id: "cancelled", label: "Cancelado" },
];

const emptyLead: LeadPayload = {
  name: "",
  company: "",
  stage: "new",
  source: "",
  expected_value: null,
  notes: "",
};

const emptyFinancial: FinancialRecordPayload = {
  kind: "invoice",
  title: "",
  amount: null,
  currency: "BRL",
  status: "open",
  due_at: "",
  notes: "",
};

function formatMoney(value: number | null, currency = "BRL") {
  if (value === null || Number.isNaN(value)) return "sem valor";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
}

function toNullableNumber(value: string) {
  const normalized = value.replace(",", ".").trim();
  return normalized ? Number(normalized) : null;
}

export function OperationsView() {
  const { selectedClientId } = useUiStore();
  const { data: user } = useCurrentUser();
  const { data: clientsData } = useClients();

  const isEgAdmin = user?.organizations.some((organization) => organization.slug === "eg" && organization.role === "eg_admin") ?? false;
  const clients = clientsData ?? [];
  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;

  const { data: leadsData, error: leadsError } = useLeads(selectedClientId);
  const { data: financeData, error: financeError } = useFinance(selectedClientId);

  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const createFinance = useCreateFinancialRecord();
  const updateFinance = useUpdateFinancialRecord();
  const deleteFinance = useDeleteFinancialRecord();

  const [leadDraft, setLeadDraft] = useState<LeadPayload>(emptyLead);
  const [financialDraft, setFinancialDraft] = useState<FinancialRecordPayload>(emptyFinancial);

  const leads = leadsData ?? [];
  const finance = financeData ?? [];

  const error = leadsError ? leadsError.message : financeError ? financeError.message : "";

  const forecast = useMemo(
    () => leads.reduce((total, lead) => total + (lead.stage !== "lost" ? lead.expected_value ?? 0 : 0), 0),
    [leads],
  );
  const openAmount = useMemo(
    () => finance.reduce((total, record) => total + (record.status !== "paid" ? record.amount ?? 0 : 0), 0),
    [finance],
  );

  function handleCreateLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClientId || !leadDraft.name.trim()) return;
    createLead.mutate({ clientId: selectedClientId, payload: leadDraft }, {
      onSuccess: () => setLeadDraft(emptyLead)
    });
  }

  function handleStageChange(lead: LeadSummary, stage: LeadStage) {
    if (!selectedClientId) return;
    updateLead.mutate({ clientId: selectedClientId, leadId: lead.id, payload: { stage } });
  }

  function handleDeleteLead(lead: LeadSummary) {
    if (!selectedClientId) return;
    deleteLead.mutate({ clientId: selectedClientId, leadId: lead.id });
  }

  function handleCreateFinancial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClientId || !financialDraft.title.trim()) return;
    createFinance.mutate({ clientId: selectedClientId, payload: financialDraft }, {
      onSuccess: () => setFinancialDraft(emptyFinancial)
    });
  }

  function handleFinancialStatus(record: FinancialRecordSummary, status: FinancialRecordStatus) {
    if (!selectedClientId) return;
    updateFinance.mutate({ clientId: selectedClientId, recordId: record.id, payload: { status } });
  }

  function handleDeleteFinancial(record: FinancialRecordSummary) {
    if (!selectedClientId) return;
    deleteFinance.mutate({ clientId: selectedClientId, recordId: record.id });
  }

  if (!selectedClient || !selectedClientId) {
    return <EmptyState text="Selecione um cliente para ver CRM e financeiro." />;
  }

  return (
    <section className="operations-layout">
      {error && <div className="notice error">{error}</div>}

      <div className="metrics">
        <article className="metric-card green">
          <span>Pipeline ativo</span>
          <strong>{leads.filter((lead) => !["won", "lost"].includes(lead.stage)).length}</strong>
          <small>{formatMoney(forecast)} em previsão não perdida</small>
        </article>
        <article className="metric-card amber">
          <span>Financeiro aberto</span>
          <strong>{formatMoney(openAmount)}</strong>
          <small>{finance.filter((record) => record.status !== "paid").length} registros não pagos</small>
        </article>
      </div>

      <div className="operations-grid">
        <article className="surface">
          <SectionHeader eyebrow="CRM mínimo" title={`Funil de ${selectedClient.name}`} icon={Building2} />
          <div className="kanban-board">
            {leadStages.map((stage) => (
              <section className="kanban-column" key={stage.id}>
                <h3>{stage.label}</h3>
                {leads.filter((lead) => lead.stage === stage.id).map((lead) => (
                  <div className="lead-card" key={lead.id}>
                    <strong>{lead.name}</strong>
                    <small>{lead.company ?? "sem empresa"} · {formatMoney(lead.expected_value)}</small>
                    <p>{lead.notes || lead.source || "Sem observação."}</p>
                    {isEgAdmin && (
                      <div className="row-actions">
                        <select
                          className="status-select"
                          value={lead.stage}
                          onChange={(event) => handleStageChange(lead, event.target.value as LeadStage)}
                          disabled={updateLead.isPending}
                        >
                          {leadStages.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button className="icon-button danger" type="button" onClick={() => handleDeleteLead(lead)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </section>
            ))}
          </div>
        </article>

        <article className="surface">
          <SectionHeader eyebrow="Financeiro" title="Contratos e faturas" icon={CircleDollarSign} />
          <div className="hub-block-list">
            {finance.length === 0 && <EmptyState compact text="Nenhum registro financeiro." />}
            {finance.map((record) => (
              <div className="work-row" key={record.id}>
                <WalletCards size={16} />
                <div>
                  <strong>{record.title}</strong>
                  <small>{record.kind === "contract" ? "Contrato" : "Fatura"} · {formatMoney(record.amount, record.currency)}</small>
                </div>
                <div className="row-tail">
                  {isEgAdmin ? (
                    <select
                      className="status-select"
                      value={record.status}
                      onChange={(event) => handleFinancialStatus(record, event.target.value as FinancialRecordStatus)}
                      disabled={updateFinance.isPending}
                    >
                      {financialStatuses.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`status-pill ${record.status}`}>{record.status}</span>
                  )}
                  {isEgAdmin && (
                    <button className="icon-button danger" type="button" onClick={() => handleDeleteFinancial(record)}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      {isEgAdmin && (
        <section className="admin-dock">
          <form className="dock-panel" onSubmit={handleCreateLead}>
            <SectionHeader eyebrow="Novo lead" title="Adicionar oportunidade" icon={Plus} />
            <div className="form-grid two">
              <label>
                Nome
                <input value={leadDraft.name} onChange={(event) => setLeadDraft({ ...leadDraft, name: event.target.value })} />
              </label>
              <label>
                Empresa
                <input value={leadDraft.company ?? ""} onChange={(event) => setLeadDraft({ ...leadDraft, company: event.target.value })} />
              </label>
              <label>
                Etapa
                <select value={leadDraft.stage ?? "new"} onChange={(event) => setLeadDraft({ ...leadDraft, stage: event.target.value as LeadStage })}>
                  {leadStages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Valor esperado
                <input
                  value={leadDraft.expected_value ?? ""}
                  onChange={(event) => setLeadDraft({ ...leadDraft, expected_value: toNullableNumber(event.target.value) })}
                />
              </label>
            </div>
            <label className="form-grid">
              Observação
              <textarea value={leadDraft.notes ?? ""} onChange={(event) => setLeadDraft({ ...leadDraft, notes: event.target.value })} />
            </label>
            <button className="primary-button" type="submit" disabled={createLead.isPending}>
              <Plus size={16} />
              Criar lead
            </button>
          </form>

          <form className="dock-panel" onSubmit={handleCreateFinancial}>
            <SectionHeader eyebrow="Novo financeiro" title="Registrar contrato/fatura" icon={Plus} />
            <div className="form-grid two">
              <label>
                Tipo
                <select
                  value={financialDraft.kind}
                  onChange={(event) => setFinancialDraft({ ...financialDraft, kind: event.target.value as FinancialRecordKind })}
                >
                  <option value="contract">Contrato</option>
                  <option value="invoice">Fatura</option>
                </select>
              </label>
              <label>
                Status
                <select
                  value={financialDraft.status}
                  onChange={(event) => setFinancialDraft({ ...financialDraft, status: event.target.value as FinancialRecordStatus })}
                >
                  {financialStatuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Título
                <input value={financialDraft.title} onChange={(event) => setFinancialDraft({ ...financialDraft, title: event.target.value })} />
              </label>
              <label>
                Valor
                <input
                  value={financialDraft.amount ?? ""}
                  onChange={(event) => setFinancialDraft({ ...financialDraft, amount: toNullableNumber(event.target.value) })}
                />
              </label>
            </div>
            <label className="form-grid">
              Observação
              <textarea
                value={financialDraft.notes ?? ""}
                onChange={(event) => setFinancialDraft({ ...financialDraft, notes: event.target.value })}
              />
            </label>
            <button className="primary-button" type="submit" disabled={createFinance.isPending}>
              <Plus size={16} />
              Criar registro
            </button>
          </form>
        </section>
      )}
    </section>
  );
}
