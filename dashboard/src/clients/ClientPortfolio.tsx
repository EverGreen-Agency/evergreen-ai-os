import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Client, ClientStatus } from "@/types/client";

const STATUS_META: Record<ClientStatus, { label: string; color: string }> = {
  onboarding: { label: "Onboarding", color: "#ffab00" },
  ativo:      { label: "Ativo",      color: "#3ac97b" },
  pausado:    { label: "Pausado",    color: "#8fb4a3" },
  churned:    { label: "Churned",    color: "#ff6b5c" },
};

const SERVICE_COLOR: Record<string, string> = {
  Growth: "#3ac97b",
  "Social Media": "#ffab00",
  Social: "#ffab00",
  Tech: "#3ac97b",
  "CRM Setup": "#8fb4a3",
};

export function ClientPortfolio() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/clients", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setClients(data?.clients ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Centered>Carregando carteira...</Centered>;
  }

  const real = clients.filter((c) => !c._is_template);
  const templates = clients.filter((c) => c._is_template);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={styles.toolbar}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
          Carteira de Clientes
        </span>
        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
          {real.length} {real.length === 1 ? "cliente" : "clientes"} · fonte da verdade que provisiona o ClickUp
        </span>
      </div>

      <div style={styles.grid}>
        {real.length === 0 && (
          <div style={styles.emptyState}>
            Nenhum cliente ainda. Copie <code>_opensquad/_memory/clients/_template/</code> para
            <code> clients/&lt;id&gt;/</code> e preencha o <code>config.json</code> — o cliente aparece aqui.
          </div>
        )}
        {real.map((c) => <ClientCard key={c._dir} client={c} />)}

        {templates.map((c) => (
          <div key={c._dir} style={{ opacity: 0.5 }}>
            <ClientCard client={c} isTemplate />
          </div>
        ))}
      </div>
    </div>
  );
}

function ClientCard({ client, isTemplate }: { client: Client; isTemplate?: boolean }) {
  const status = STATUS_META[client.status] ?? STATUS_META.onboarding;
  const clickupOk = client.clickup?.provisionado;
  const kommoOk = client.kommo?.ativo;
  const hasProject = client.engenharia?.tem_projeto;

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
          {client.company_name}
          {isTemplate && <span style={{ fontSize: 10, color: "var(--text-secondary)" }}> (template)</span>}
        </span>
        <span style={{ ...styles.badge, background: `${status.color}22`, color: status.color, fontWeight: 700 }}>
          {status.label}
        </span>
      </div>

      {client.niche && (
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>{client.niche}</div>
      )}

      {/* Services */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
        {client.purchased_services?.map((s) => {
          const color = SERVICE_COLOR[s] ?? "#8fb4a3";
          return (
            <span key={s} style={{ ...styles.badge, background: `${color}1e`, color, border: `1px solid ${color}44` }}>
              {s}
            </span>
          );
        })}
      </div>

      {/* Provisioning indicators */}
      <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
        <Indicator label="ClickUp" ok={clickupOk} />
        <Indicator label="Kommo" ok={kommoOk} />
        {hasProject && <span style={{ color: "var(--accent-cyan)" }}>● Projeto dev</span>}
      </div>

      {client.main_contacts?.[0]?.name && (
        <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-secondary)" }}>
          {client.main_contacts[0].name} · {client.main_contacts[0].role}
        </div>
      )}
    </div>
  );
}

function Indicator({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <span style={{ color: ok ? "var(--accent-green)" : "var(--text-secondary)" }}>
      {ok ? "●" : "○"} {label}
    </span>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: 13 }}>
      {children}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 16px",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
    background: "var(--bg-sidebar)",
  },
  grid: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 12,
    padding: 16,
    overflowY: "auto",
    alignContent: "flex-start",
  },
  card: {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: 14,
  },
  badge: {
    fontSize: 10,
    padding: "2px 6px",
    borderRadius: 3,
  },
  emptyState: {
    gridColumn: "1 / -1",
    padding: 24,
    fontSize: 12,
    lineHeight: 1.7,
    color: "var(--text-secondary)",
    textAlign: "center",
  },
};
