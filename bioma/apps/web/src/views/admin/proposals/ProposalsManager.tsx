import { useState, useEffect } from "react";
import {
  Target,
  Sparkles,
  Bot,
  ExternalLink,
  Plus,
  Copy,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Clock,
  Send,
  Zap,
  RefreshCw,
} from "lucide-react";
import { api, type OpportunitySummary, type ProposalSummary } from "../../../lib/api";

export function ProposalsManager() {
  const [activeTab, setActiveTab] = useState<"radar" | "proposals">("radar");
  const [opportunities, setOpportunities] = useState<OpportunitySummary[]>([]);
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);

  // Form State para Ingestão Manual Rápida
  const [sourcePlatform, setSourcePlatform] = useState("99freelas");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [budgetText, setBudgetText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generating proposal & Sync state
  const [generatingOppId, setGeneratingOppId] = useState<string | null>(null);
  const [copiedProposalId, setCopiedProposalId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [oppsRes, propsRes] = await Promise.all([
        api.listOpportunities(),
        api.listProposals(),
      ]);
      setOpportunities(oppsRes);
      setProposals(propsRes);
    } catch (err) {
      console.error("Erro ao carregar radar e propostas:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIngestOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await api.ingestOpportunity({
        source_platform: sourcePlatform,
        title: title.trim(),
        url: url.trim() || undefined,
        description: description.trim() || undefined,
        budget_text: budgetText.trim() || undefined,
      });
      setTitle("");
      setUrl("");
      setDescription("");
      setBudgetText("");
      setIsIngestModalOpen(false);
      await loadData();
    } catch (err) {
      alert("Erro ao salvar oportunidade: " + (err instanceof Error ? err.message : "Desconhecido"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateProposal = async (oppId: string) => {
    setGeneratingOppId(oppId);
    try {
      await api.generateProposalForOpportunity(oppId);
      await loadData();
      setActiveTab("proposals");
    } catch (err) {
      alert("Erro ao gerar proposta com IA: " + (err instanceof Error ? err.message : "Desconhecido"));
    } finally {
      setGeneratingOppId(null);
    }
  };

  const handleCopyPublicLink = (token: string, proposalId: string) => {
    const fullUrl = `${window.location.origin}/propostas/public/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedProposalId(proposalId);
    setTimeout(() => setCopiedProposalId(null), 3000);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto", color: "var(--text)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <Target color="var(--brand-accent)" size={28} />
            Radar de Oportunidades & Propostas IA
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--text-dim)", fontSize: "0.9rem" }}>
            Varredura contínua de freelas/projetos B2B, triagem automática com Score de Fit e gerador de propostas.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={async () => {
              setIsSyncing(true);
              setSyncFeedback(null);
              try {
                const res = await api.syncOpportunities();
                setSyncFeedback(`Varredura concluída! ${res.scanned} projetos verificados (${res.new} novos adicionados, ${res.skipped} duplicados ignorados).`);
                await loadData();
              } catch (err: any) {
                alert("Erro ao realizar varredura: " + (err.message || "Erro desconhecido"));
              } finally {
                setIsSyncing(false);
              }
            }}
            disabled={isSyncing}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--brand-accent)",
              fontWeight: 600,
              cursor: isSyncing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              opacity: isSyncing ? 0.7 : 1,
            }}
          >
            <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Varrendo Plataformas..." : "Varrer Plataformas Agora"}
          </button>

          <button
            className="primary-button"
            onClick={() => setIsIngestModalOpen(true)}
            style={{ padding: "10px 18px", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Plus size={18} /> Capturar Vaga Manualmente
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div style={{ padding: "12px 16px", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "8px", color: "#10b981", marginBottom: "16px", fontSize: "0.9rem" }}>
          {syncFeedback}
        </div>
      )}

      {/* Alerta de Status do Worker */}
      <div
        style={{
          background: "rgba(16, 185, 129, 0.08)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "0.85rem",
        }}
      >
        <Zap size={20} color="#10b981" />
        <div>
          <strong style={{ color: "#10b981" }}>Varredura Automática Ativa:</strong> O <code>bioma_worker</code> está varrendo RSS Feeds e scrapers em segundo plano. Oportunidades quentes enviam alertas diretos no WhatsApp da EG.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border)", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveTab("radar")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "radar" ? "2px solid var(--brand-accent)" : "2px solid transparent",
            color: activeTab === "radar" ? "var(--brand-accent)" : "var(--text-dim)",
            padding: "10px 16px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Bot size={18} /> Radar de Vagas ({opportunities.length})
        </button>
        <button
          onClick={() => setActiveTab("proposals")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "proposals" ? "2px solid var(--brand-accent)" : "2px solid transparent",
            color: activeTab === "proposals" ? "var(--brand-accent)" : "var(--text-dim)",
            padding: "10px 16px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FileText size={18} /> Central de Propostas ({proposals.length})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)" }}>
          Carregando oportunidades e propostas...
        </div>
      ) : activeTab === "radar" ? (
        /* ABA 1: RADAR DE OPORTUNIDADES */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "16px" }}>
          {opportunities.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", background: "var(--surface)", borderRadius: "12px" }}>
              Nenhuma oportunidade capturada ainda. Clique em "Capturar Vaga Manualmente" ou aguarde a execução automática do worker.
            </div>
          ) : (
            opportunities.map((opp) => (
              <div
                key={opp.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: "var(--bg-inset)",
                        color: "var(--brand-accent)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      {opp.source_platform}
                    </span>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: opp.fit_score >= 70 ? "#10b981" : opp.fit_score >= 40 ? "#f59e0b" : "#ef4444",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Sparkles size={14} /> Fit: {opp.fit_score}/100
                    </span>
                  </div>

                  <h3 style={{ margin: "0 0 8px", fontSize: "1.05rem", fontWeight: 600 }}>{opp.title}</h3>
                  <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "var(--text-dim)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {opp.description || "Sem descrição informada."}
                  </p>
                </div>

                <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "12px", marginTop: "12px" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-faint)", marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
                    <span>Orçamento: <strong>{opp.budget_text || "A combinar"}</strong></span>
                    {opp.url && (
                      <a href={opp.url} target="_blank" rel="noreferrer" style={{ color: "var(--brand-accent)", display: "flex", alignItems: "center", gap: "2px", textDecoration: "none" }}>
                        Ver vaga <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {opp.status === "proposal_generated" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10b981", fontSize: "0.85rem", fontWeight: 600 }}>
                      <CheckCircle2 size={16} /> Proposta Comercial Gerada
                    </div>
                  ) : (
                    <button
                      className="primary-button"
                      onClick={() => handleGenerateProposal(opp.id)}
                      disabled={generatingOppId === opp.id}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px" }}
                    >
                      <Sparkles size={16} />
                      {generatingOppId === opp.id ? "Squad elaborando proposta..." : "Gerar Proposta com IA"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ABA 2: CENTRAL DE PROPOSTAS COMERCIAIS */
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {proposals.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", background: "var(--surface)", borderRadius: "12px" }}>
              Nenhuma proposta comercial gerada ainda. Acesse a aba "Radar de Vagas" para gerar propostas automáticas.
            </div>
          ) : (
            proposals.map((prop) => (
              <div
                key={prop.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", background: "var(--bg-inset)", color: "var(--text-dim)", padding: "2px 8px", borderRadius: "4px" }}>
                      {prop.target_niche || "Proposta Geral"}
                    </span>
                    <h2 style={{ margin: "4px 0 0", fontSize: "1.2rem", fontWeight: 600 }}>{prop.client_name}</h2>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-accent)" }}>
                      R$ {(prop.pricing_cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      className="secondary-button"
                      onClick={() => handleCopyPublicLink(prop.public_token, prop.id)}
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px" }}
                    >
                      <Copy size={16} />
                      {copiedProposalId === prop.id ? "Link Copiado!" : "Copiar Link Público"}
                    </button>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-dim)" }}>{prop.executive_summary}</p>

                {/* Pilares da EG */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginTop: "8px" }}>
                  <div style={{ background: "var(--surface-sunken)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <strong style={{ fontSize: "0.8rem", color: "var(--brand-accent)", display: "block", marginBottom: "4px" }}>Pilar 1: Oferta</strong>
                    <span style={{ fontSize: "0.8rem" }}>{prop.scope_offer || "Estratégia e posicionamento de valor."}</span>
                  </div>
                  <div style={{ background: "var(--surface-sunken)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <strong style={{ fontSize: "0.8rem", color: "var(--brand-accent)", display: "block", marginBottom: "4px" }}>Pilar 2: Conversão</strong>
                    <span style={{ fontSize: "0.8rem" }}>{prop.scope_conversion || "Estrutura de vendas e tracking."}</span>
                  </div>
                  <div style={{ background: "var(--surface-sunken)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <strong style={{ fontSize: "0.8rem", color: "var(--brand-accent)", display: "block", marginBottom: "4px" }}>Pilar 3: Demanda</strong>
                    <span style={{ fontSize: "0.8rem" }}>{prop.scope_demand || "Escala de tráfego e prospecção."}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Ingestão Manual Rápida */}
      {isIngestModalOpen && (
        <div className="drawer-overlay" onClick={() => setIsIngestModalOpen(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", padding: "24px" }}>
            <h2 style={{ marginTop: 0, fontSize: "1.2rem" }}>Capturar Vaga / Projeto Manualmente</h2>
            <form onSubmit={handleIngestOpportunity} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.85rem" }}>
                Plataforma
                <select value={sourcePlatform} onChange={(e) => setSourcePlatform(e.target.value)} style={{ padding: "8px", borderRadius: "6px" }}>
                  <option value="99freelas">99freelas</option>
                  <option value="workana">Workana</option>
                  <option value="upwork">UpWork</option>
                  <option value="freelancer">Freelancer.com</option>
                  <option value="toptal">Toptal</option>
                  <option value="malt">Malt</option>
                  <option value="contra">Contra</option>
                  <option value="outros">Outros / Indicação</option>
                </select>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.85rem" }}>
                Título do Projeto / Vaga *
                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Preciso de gestor de tráfego e CRM" style={{ padding: "8px", borderRadius: "6px" }} />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.85rem" }}>
                URL da Vaga (opcional)
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." style={{ padding: "8px", borderRadius: "6px" }} />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.85rem" }}>
                Orçamento Anunciado
                <input value={budgetText} onChange={(e) => setBudgetText(e.target.value)} placeholder="Ex: R$ 5.000 ou $1.000 USD" style={{ padding: "8px", borderRadius: "6px" }} />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.85rem" }}>
                Descrição / Briefing (Cole o texto da vaga)
                <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cole os detalhes da oportunidade para a IA triar..." style={{ padding: "8px", borderRadius: "6px", fontFamily: "inherit" }} />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button type="button" className="secondary-button" onClick={() => setIsIngestModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-button" disabled={isSubmitting}>
                  {isSubmitting ? "Triando..." : "Triar & Salvar Vaga"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
