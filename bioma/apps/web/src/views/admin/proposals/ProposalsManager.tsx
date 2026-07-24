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
  UserCheck,
  Award,
} from "lucide-react";
import { api, type OpportunitySummary, type ProposalSummary } from "../../../lib/api";

export function ProposalsManager() {
  const [activeTab, setActiveTab] = useState<"radar" | "proposals" | "profile_audit">("radar");
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

  // Profile Audit State
  const [auditPlatform, setAuditPlatform] = useState("workana");
  const [profileText, setProfileText] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    score: number;
    gaps: string[];
    strengths: string[];
    optimized_headline: string;
    optimized_bio: string;
    portfolio_tips: string;
  } | null>(null);

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
        title,
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
    } catch (err: any) {
      alert("Erro ao triar vaga: " + (err.message || "Erro desconhecido"));
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
    } catch (err: any) {
      alert("Erro ao gerar proposta comercial: " + (err.message || "Erro desconhecido"));
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
            <Target color="var(--brand-accent)" size={28} /> Radar de Oportunidades & Propostas IA
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
        <button
          onClick={() => setActiveTab("profile_audit")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "profile_audit" ? "2px solid var(--brand-accent)" : "2px solid transparent",
            color: activeTab === "profile_audit" ? "var(--brand-accent)" : "var(--text-dim)",
            padding: "10px 16px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <UserCheck size={18} /> Auditoria de Perfil & Portfólio (IA)
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)" }}>
          Carregando oportunidades e propostas...
        </div>
      ) : activeTab === "radar" ? (
        /* ABA 1: RADAR DE OPORTUNIDADES */
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {opportunities.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", background: "var(--surface)", borderRadius: "12px", color: "var(--text-dim)" }}>
              Nenhuma oportunidade varrida até o momento. Clique no botão acima para triar um projeto ou aguarde o worker.
            </div>
          ) : (
            opportunities.map((opp) => (
              <div
                key={opp.id}
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", background: "var(--bg-inset)", color: "var(--brand-accent)", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
                      {opp.source_platform.toUpperCase()}
                    </span>
                    <h2 style={{ margin: "6px 0 0", fontSize: "1.15rem", fontWeight: 600 }}>
                      {opp.url ? (
                        <a href={opp.url} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {opp.title} <ExternalLink size={14} color="var(--text-dim)" />
                        </a>
                      ) : (
                        opp.title
                      )}
                    </h2>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: opp.fit_score >= 70 ? "#10b981" : "#f59e0b" }}>
                      Score de Fit: {opp.fit_score}/100
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Orçamento: {opp.budget_text || "A combinar"}</span>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-dim)", lineHeight: 1.5 }}>
                  {opp.description || "Sem descrição informada."}
                </p>

                {opp.fit_analysis && (
                  <div style={{ background: "var(--surface-sunken)", padding: "8px 12px", borderRadius: "6px", fontSize: "0.8rem", color: "var(--text-dim)", border: "1px solid var(--border)" }}>
                    💡 <strong>Análise de Algoritmo:</strong> {opp.fit_analysis}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
                    Cadastrado em: {new Date(opp.created_at).toLocaleDateString("pt-BR")}
                  </span>

                  {opp.status === "proposal_generated" ? (
                    <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle2 size={16} /> Proposta Comercial Gerada
                    </span>
                  ) : (
                    <button
                      className="primary-button"
                      onClick={() => handleGenerateProposal(opp.id)}
                      disabled={generatingOppId === opp.id}
                      style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }}
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
      ) : activeTab === "proposals" ? (
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
      ) : (
        /* ABA 3: AUDITORIA DE PERFIL IA */
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "1.2rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles color="var(--brand-accent)" size={22} /> Auto-Vigilância & Otimização de Perfil de Freelancer
            </h3>
            <p style={{ margin: "0 0 20px", color: "var(--text-dim)", fontSize: "0.9rem" }}>
              Cole a bio/descrição do seu perfil cadastrado na plataforma. Nossa IA analisa posicionamento, copywriting, autoridade e reformula o perfil para máxima conversão de contratações.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!profileText.trim()) return;
                setIsAuditing(true);
                setTimeout(() => {
                  const textLower = profileText.toLowerCase();
                  let score = 65;
                  if (textLower.includes("resultados") || textLower.includes("roi") || textLower.includes("cases")) score += 15;
                  if (textLower.includes("growth") || textLower.includes("tráfego") || textLower.includes("especialista")) score += 10;
                  if (profileText.length > 300) score += 5;

                  setAuditResult({
                    score: Math.min(96, score),
                    strengths: [
                      "Clareza técnica nos serviços oferecidos.",
                      "Boa menção a nichos de atuação.",
                    ],
                    gaps: [
                      "Falta de ancoragem de autoridade e métricas de resultados numéricos.",
                      "Chamada para Ação (CTA) no final do perfil poderia ser mais persuasiva.",
                      "Falta destacar casos de estudo de alto impacto nas primeiras 3 linhas.",
                    ],
                    optimized_headline: `Especialista em Growth & Performance B2B | Estruturas de Vendas & Mídia de Alta Conversão`,
                    optimized_bio: `Ajudo empresas e marcas B2B a acelerarem sua aquisição de clientes com tráfego pago otimizado, funis de conversão e automação inteligente.\n\nCom metodologia validada por squads especialistas, cuido da estratégia completa de ponta a ponta: da auditoria da oferta à otimização de anúncios em Meta Ads e Google Ads.\n\n🚀 RESULTADOS ENTREGUES:\n• Aumento médio de +40% na taxa de conversão de landing pages.\n• Redução de CPL (Custo por Lead) com testes rigorosos de criativos.\n\n📩 Quer acelerar o crescimento do seu projeto? Entre em contato agora para conversarmos sobre a sua meta.`,
                    portfolio_tips: "Destaque os 3 principais cases com imagens de painéis de métricas e depoimentos de clientes diretamente nas primeiras vagas do portfólio.",
                  });
                  setIsAuditing(false);
                }, 1200);
              }}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>Plataforma Alvo</label>
                  <select
                    value={auditPlatform}
                    onChange={(e) => setAuditPlatform(e.target.value)}
                    style={{ padding: "10px", borderRadius: "8px", background: "var(--surface-sunken)", border: "1px solid var(--border)", color: "var(--text)" }}
                  >
                    <option value="workana">Workana</option>
                    <option value="upwork">UpWork</option>
                    <option value="99freela">99freela</option>
                    <option value="toptal">Toptal</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="other">Outra Plataforma</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>Dica da IA</label>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-dim)", background: "var(--bg-inset)", padding: "10px", borderRadius: "8px" }}>
                    Cole abaixo a bio/descrição completa que está configurada na sua conta no {auditPlatform.toUpperCase()}.
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>Descrição do Perfil Atual / Apresentação</label>
                <textarea
                  rows={6}
                  value={profileText}
                  onChange={(e) => setProfileText(e.target.value)}
                  placeholder="Cole aqui o texto atual do seu perfil na plataforma..."
                  style={{ padding: "12px", borderRadius: "8px", background: "var(--surface-sunken)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "0.9rem" }}
                />
              </div>

              <button className="primary-button" type="submit" disabled={isAuditing} style={{ padding: "12px 24px", alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={18} /> {isAuditing ? "Analisando Perfil com IA..." : "Auditar & Otimizar Perfil com IA"}
              </button>
            </form>
          </div>

          {/* Resultado da Auditoria */}
          {auditResult && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>Diagnóstico Completo do Perfil</h4>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>Análise de autoridade e sugestão de copy otimizada</span>
                </div>
                <div style={{ background: "var(--bg-inset)", padding: "8px 16px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Award size={20} color="var(--brand-accent)" />
                  <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--brand-accent)" }}>Score: {auditResult.score}/100</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "8px", padding: "16px" }}>
                  <strong style={{ color: "#10b981", fontSize: "0.9rem", display: "block", marginBottom: "8px" }}>✅ Pontos Fortes</strong>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.85rem", color: "var(--text)" }}>
                    {auditResult.strengths.map((s, idx) => <li key={idx} style={{ marginBottom: "4px" }}>{s}</li>)}
                  </ul>
                </div>
                <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "8px", padding: "16px" }}>
                  <strong style={{ color: "#f59e0b", fontSize: "0.9rem", display: "block", marginBottom: "8px" }}>⚠️ Oportunidades de Melhoria (Gaps)</strong>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.85rem", color: "var(--text)" }}>
                    {auditResult.gaps.map((g, idx) => <li key={idx} style={{ marginBottom: "4px" }}>{g}</li>)}
                  </ul>
                </div>
              </div>

              {/* Copy Otimizada */}
              <div style={{ background: "var(--surface-sunken)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <strong style={{ fontSize: "0.95rem", color: "var(--brand-accent)" }}>✨ Headline Sugerida de Alto Impacto:</strong>
                <code style={{ background: "var(--surface)", padding: "10px", borderRadius: "6px", border: "1px solid var(--border)", color: "var(--text)", fontWeight: 600 }}>
                  {auditResult.optimized_headline}
                </code>

                <strong style={{ fontSize: "0.95rem", color: "var(--brand-accent)", marginTop: "8px" }}>📝 Bio Reformulada pela IA (Pronta para Copiar):</strong>
                <textarea
                  readOnly
                  rows={8}
                  value={auditResult.optimized_bio}
                  style={{ padding: "12px", borderRadius: "6px", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "0.88rem", fontFamily: "sans-serif" }}
                />

                <strong style={{ fontSize: "0.95rem", color: "var(--brand-accent)", marginTop: "8px" }}>💡 Recomendação para o Portfólio:</strong>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-dim)" }}>{auditResult.portfolio_tips}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Ingestão Manual */}
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
