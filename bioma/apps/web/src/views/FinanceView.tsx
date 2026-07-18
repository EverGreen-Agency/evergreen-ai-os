import { FormEvent, useMemo, useState } from "react";
import { CircleDollarSign, Plus, Trash2, WalletCards } from "lucide-react";
import { EmptyState, SectionHeader } from "../components/shared";
import {
  type FinancialRecordKind,
  type FinancialRecordPayload,
  type FinancialRecordStatus,
  type FinancialRecordSummary,
} from "../lib/api";
import {
  useCurrentUser,
  useFinance,
  useCreateFinancialRecord,
  useUpdateFinancialRecord,
  useDeleteFinancialRecord
} from "../hooks/useBiomaApi";

const financialStatuses: Array<{ id: FinancialRecordStatus; label: string }> = [
  { id: "draft", label: "Rascunho" },
  { id: "open", label: "Aberto" },
  { id: "paid", label: "Pago" },
  { id: "overdue", label: "Vencido" },
  { id: "cancelled", label: "Cancelado" },
];

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

export function FinanceView({ clientId }: { clientId: string }) {
  const { data: user } = useCurrentUser();

  const isEgAdmin = user?.organizations.some((organization) => organization.slug === "eg" && organization.role === "eg_admin") ?? false;

  const { data: financeData, error: financeError } = useFinance(clientId);

  const createFinance = useCreateFinancialRecord();
  const updateFinance = useUpdateFinancialRecord();
  const deleteFinance = useDeleteFinancialRecord();

  const [financialDraft, setFinancialDraft] = useState<FinancialRecordPayload>(emptyFinancial);

  const finance = financeData ?? [];

  const error = financeError ? financeError.message : "";

  const openAmount = useMemo(
    () => finance.reduce((total, record) => total + (record.status !== "paid" ? record.amount ?? 0 : 0), 0),
    [finance],
  );

  function handleCreateFinancial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!financialDraft.title.trim()) return;
    createFinance.mutate({ clientId, payload: financialDraft }, {
      onSuccess: () => setFinancialDraft(emptyFinancial)
    });
  }

  function handleFinancialStatus(record: FinancialRecordSummary, status: FinancialRecordStatus) {
    updateFinance.mutate({ clientId, recordId: record.id, payload: { status } });
  }

  function handleDeleteFinancial(record: FinancialRecordSummary) {
    deleteFinance.mutate({ clientId, recordId: record.id });
  }

  return (
    <div className="finance-view fade-in">
      {error && <div className="notice error">{error}</div>}

      <div className="bento-grid">
        <article className="bento-card col-span-2">
          <div className="bento-header">
            <h3>Financeiro em Aberto</h3>
            <CircleDollarSign size={16} color="var(--mint)" />
          </div>
          <div className="bento-value" style={{ color: "var(--mint)" }}>
            {formatMoney(openAmount)}
          </div>
          <div className="bento-footer">
            {finance.filter((record) => record.status !== "paid").length} faturas aguardando pagamento
          </div>
        </article>
      </div>

      <div className="operations-grid" style={{ gridTemplateColumns: "1fr" }}>
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
    </div>
  );
}
