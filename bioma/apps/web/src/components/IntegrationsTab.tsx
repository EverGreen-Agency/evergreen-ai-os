import { useState } from "react";
import { GitBranch, Link, Activity, ShieldCheck, RefreshCw, LogIn, CheckCircle2, XCircle, Settings2, Code, Database, CreditCard, Megaphone, Server } from "lucide-react";
import { useUiStore } from "../store/uiStore";
import { useClientPortal, useSyncClickUp } from "../hooks/useBiomaApi";

type IntegrationStatus = "connected" | "disconnected" | "error" | "auth_required";

interface IntegrationItem {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: IntegrationStatus;
  type: "internal" | "client";
  lastSync?: string;
  health?: string;
}

const mockIntegrations: IntegrationItem[] = [
  { id: "clickup", name: "ClickUp", description: "Gestão de tarefas e sprints", icon: Link, status: "connected", type: "internal", lastSync: "2 min atrás", health: "100% Uptime" },
  { id: "github", name: "GitHub", description: "Repositórios e automação MCP", icon: Code, status: "auth_required", type: "internal" },
  { id: "google_drive", name: "Google Drive", description: "Armazenamento de assets", icon: Database, status: "disconnected", type: "internal" },
  { id: "aws", name: "AWS", description: "Infraestrutura em nuvem", icon: Server, status: "connected", type: "internal", lastSync: "10 min atrás", health: "Operacional" },
  { id: "stripe", name: "Stripe", description: "Gestão financeira e pagamentos", icon: CreditCard, status: "connected", type: "client", lastSync: "1 hora atrás" },
  { id: "meta_ads", name: "Meta Ads", description: "Anúncios e leads", icon: Megaphone, status: "disconnected", type: "client" },
  { id: "rd_station", name: "RD Station", description: "Automação de marketing", icon: Activity, status: "error", type: "client", lastSync: "Falhou há 2 dias", health: "Token Expirado" },
];

export function IntegrationsTab() {
  const { selectedClientId } = useUiStore();
  const { data: portalData } = useClientPortal(selectedClientId);
  const syncClickUp = useSyncClickUp();

  const [loadingApp, setLoadingApp] = useState<string | null>(null);

  const internalIntegrations = mockIntegrations.filter(i => i.type === "internal");
  const clientIntegrations = mockIntegrations.filter(i => i.type === "client");

  const portal = portalData ?? null;
  const clickupSync = portal?.sync_runs.find((run) => run.source === "clickup") ?? null;

  function handleConnect(id: string) {
    setLoadingApp(id);
    setTimeout(() => {
      setLoadingApp(null);
      alert("Integração mockada: Redirecionaria para o fluxo OAuth ou Modal de API Key.");
    }, 1000);
  }

  function renderStatus(status: IntegrationStatus) {
    switch (status) {
      case "connected":
        return <span className="status-pill open" style={{ display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle2 size={12} /> Conectado</span>;
      case "error":
        return <span className="status-pill cancelled" style={{ display: "flex", alignItems: "center", gap: "4px" }}><XCircle size={12} /> Erro</span>;
      case "auth_required":
        return <span className="status-pill overdue" style={{ display: "flex", alignItems: "center", gap: "4px" }}><ShieldCheck size={12} /> Auth Necessária</span>;
      default:
        return <span className="status-pill draft" style={{ display: "flex", alignItems: "center", gap: "4px" }}><Link size={12} /> Desconectado</span>;
    }
  }

  function renderCard(item: IntegrationItem) {
    const Icon = item.icon;
    const isConnecting = loadingApp === item.id;
    return (
      <article key={item.id} className="surface" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", border: item.status === "connected" ? "1px solid var(--brand-accent)" : "1px solid var(--border-light)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ padding: "10px", background: "var(--bg-inset)", borderRadius: "8px" }}>
              <Icon size={24} color={item.status === "connected" ? "var(--brand-accent)" : "var(--text-muted)"} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>{item.name}</h4>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{item.description}</p>
            </div>
          </div>
          {renderStatus(item.status)}
        </div>

        {(item.lastSync || item.health || (item.id === "clickup" && clickupSync)) && (
          <div style={{ padding: "12px", background: "var(--bg-body)", borderRadius: "6px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {item.lastSync && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Último Sync:</span>
                <strong style={{ color: item.status === "error" ? "var(--danger-main)" : "var(--text-main)" }}>{item.lastSync}</strong>
              </div>
            )}
            {item.health && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Health:</span>
                <strong>{item.health}</strong>
              </div>
            )}
            {item.id === "clickup" && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Logs de Tarefas:</span>
                <strong style={{ color: clickupSync?.status === "error" ? "var(--danger-main)" : "var(--brand-accent)" }}>{clickupSync?.status ?? "Aguardando"}</strong>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: "auto", paddingTop: "8px", display: "flex", gap: "8px" }}>
          {item.status === "connected" ? (
            <>
              <button className="secondary-button" style={{ flex: 1, padding: "8px", fontSize: "13px" }} onClick={() => handleConnect(item.id)}>
                <Settings2 size={14} /> Configurar
              </button>
              {item.id === "clickup" && (
                <button 
                  className="primary-button" 
                  style={{ flex: 1, padding: "8px", fontSize: "13px" }} 
                  onClick={() => selectedClientId && syncClickUp.mutate(selectedClientId)}
                  disabled={syncClickUp.isPending || !selectedClientId}
                >
                  <RefreshCw size={14} /> Ping
                </button>
              )}
            </>
          ) : (
            <button className="primary-button" style={{ width: "100%", padding: "8px", fontSize: "13px" }} onClick={() => handleConnect(item.id)} disabled={isConnecting}>
              {isConnecting ? <RefreshCw size={14} className="spin" /> : <LogIn size={14} />} 
              {item.status === "auth_required" ? "Autenticar Novamente" : "Conectar"}
            </button>
          )}
        </div>
      </article>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", gridColumn: "1 / -1" }}>
      <section>
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
            <Server size={18} /> Conexões Internas (EverGreen)
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "4px 0 0 0" }}>
            Ferramentas base da operação da agência. Configurações globais e status de sistema.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {internalIntegrations.map(renderCard)}
        </div>
      </section>

      <section>
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={18} /> Integrações de Clientes
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "4px 0 0 0" }}>
            Ferramentas disponíveis para clientes conectarem e expandirem o Bioma.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {clientIntegrations.map(renderCard)}
        </div>
      </section>
    </div>
  );
}
