import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  LineChart,
  RefreshCw,
  Search,
  Sparkles,
  Tags,
  Target,
  TrendingUp,
  Briefcase,
  Users,
} from "lucide-react";
import { EmptyState, SectionHeader } from "../components/shared";
import { TrendChart, type TrendPoint } from "../components/bi/TrendChart";
import {
  api,
  type AdsCampaignSummary,
  type ClientSummary,
  type Ga4AcquisitionSummary,
  type GscQuerySummary,
  type GtmSnapshotSummary,
  type PerformanceOverview,
  type PerformanceProvider,
} from "../lib/api";
import { useUiStore } from "../store/uiStore";
import { useClients, useKommoAnalytics } from "../hooks/useBiomaApi";

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

function formatMoneyMicros(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 1_000_000);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 2 }).format(value);
}

function providerLabel(provider: string) {
  return {
    google_ads: "Google Ads",
    ga4: "GA4",
    search_console: "Search Console",
    gtm: "GTM",
    kommo: "Kommo CRM",
  }[provider] ?? provider;
}

type PerformanceTab = "overview" | "google_ads" | "ga4" | "search_console" | "gtm" | "kommo";

const performanceTabs: Array<{ id: PerformanceTab; label: string; icon: typeof BarChart3 }> = [
  { id: "overview", label: "Visão geral", icon: LineChart },
  { id: "kommo", label: "Kommo CRM", icon: Briefcase },
  { id: "google_ads", label: "Google Ads", icon: BarChart3 },
  { id: "ga4", label: "GA4", icon: TrendingUp },
  { id: "search_console", label: "Search Console", icon: Search },
  { id: "gtm", label: "GTM", icon: Tags },
];

type FreshnessEntry = PerformanceOverview["freshness"][number];

function FreshnessBanner({ freshness }: { freshness: FreshnessEntry | null }) {
  if (!freshness || freshness.last_synced_at) return null;
  return (
    <div className="demo-banner" role="status">
      <AlertTriangle size={18} />
      <span>
        Ainda sem sincronização real desta fonte para este cliente. Os números exibidos podem vir do seed de
        demonstração até o primeiro sync com credenciais reais.
      </span>
    </div>
  );
}

function GoogleAdsTab({ clientId, freshness }: { clientId: string; freshness: FreshnessEntry | null }) {
  const [campaigns, setCampaigns] = useState<AdsCampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .adsCampaigns(clientId)
      .then(setCampaigns)
      .catch((err: Error) => setError(err.message || "Não foi possível carregar campanhas do Google Ads."))
      .finally(() => setLoading(false));
  }, [clientId]);

  return (
    <div className="performance-tab-panel">
      <FreshnessBanner freshness={freshness} />
      {error && <div className="notice error">{error}</div>}
      <article className="surface">
        <SectionHeader eyebrow="Google Ads" title="Campanhas detalhadas" icon={BarChart3} />
        {loading ? (
          <EmptyState compact text="Carregando campanhas..." />
        ) : campaigns.length === 0 ? (
          <EmptyState compact text="Nenhuma campanha sincronizada para este cliente." />
        ) : (
          <div className="table-list">
            {campaigns.map((campaign) => (
              <div className="table-row" key={campaign.campaign_id}>
                <strong>{campaign.campaign_name}</strong>
                <span>{campaign.channel_type} · {campaign.campaign_status}</span>
                <span>{formatNumber(campaign.impressions)} imp.</span>
                <span>{formatNumber(campaign.clicks)} cliques · CTR {formatPercent(campaign.ctr)}</span>
                <span>{formatMoneyMicros(campaign.cost_micros)} · ROAS {campaign.roas.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

function Ga4Tab({ clientId, freshness }: { clientId: string; freshness: FreshnessEntry | null }) {
  const [rows, setRows] = useState<Ga4AcquisitionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .ga4Acquisition(clientId)
      .then(setRows)
      .catch((err: Error) => setError(err.message || "Não foi possível carregar aquisição do GA4."))
      .finally(() => setLoading(false));
  }, [clientId]);

  return (
    <div className="performance-tab-panel">
      <FreshnessBanner freshness={freshness} />
      {error && <div className="notice error">{error}</div>}
      <article className="surface">
        <SectionHeader eyebrow="GA4" title="Aquisição por origem/mídia" icon={TrendingUp} />
        {loading ? (
          <EmptyState compact text="Carregando aquisição do GA4..." />
        ) : rows.length === 0 ? (
          <EmptyState compact text="Nenhum dado de aquisição sincronizado para este cliente." />
        ) : (
          <div className="table-list">
            {rows.map((row, index) => (
              <div className="table-row" key={`${row.source}-${row.medium}-${row.campaign}-${index}`}>
                <strong>{row.source} / {row.medium}</strong>
                <span>{row.campaign || "sem campanha"}</span>
                <span>{formatNumber(row.sessions)} sessões</span>
                <span>{formatNumber(row.total_users)} usuários · {formatNumber(row.new_users)} novos</span>
                <span>{formatPercent(row.engagement_rate)} engaj. · {formatNumber(row.key_events)} eventos-chave</span>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

function GscTab({ clientId, freshness }: { clientId: string; freshness: FreshnessEntry | null }) {
  const [rows, setRows] = useState<GscQuerySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .gscQueries(clientId)
      .then(setRows)
      .catch((err: Error) => setError(err.message || "Não foi possível carregar consultas do Search Console."))
      .finally(() => setLoading(false));
  }, [clientId]);

  return (
    <div className="performance-tab-panel">
      <FreshnessBanner freshness={freshness} />
      {error && <div className="notice error">{error}</div>}
      <article className="surface">
        <SectionHeader eyebrow="Search Console" title="Consultas orgânicas" icon={Search} />
        {loading ? (
          <EmptyState compact text="Carregando consultas do Search Console..." />
        ) : rows.length === 0 ? (
          <EmptyState compact text="Nenhuma consulta sincronizada para este cliente." />
        ) : (
          <div className="table-list">
            {rows.map((row, index) => (
              <div className="table-row" key={`${row.query}-${row.country}-${row.device}-${index}`}>
                <strong>{row.query}</strong>
                <span>{row.country} · {row.device}</span>
                <span>{formatNumber(row.clicks)} cliques</span>
                <span>{formatNumber(row.impressions)} imp. · CTR {formatPercent(row.ctr)}</span>
                <span>posição média {row.position.toFixed(1)}</span>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

const severityLabel: Record<string, string> = {
  info: "Info",
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

function GtmTab({ clientId, freshness }: { clientId: string; freshness: FreshnessEntry | null }) {
  const [snapshots, setSnapshots] = useState<GtmSnapshotSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .gtmSnapshots(clientId)
      .then(setSnapshots)
      .catch((err: Error) => setError(err.message || "Não foi possível carregar snapshots do GTM."))
      .finally(() => setLoading(false));
  }, [clientId]);

  return (
    <div className="performance-tab-panel">
      <FreshnessBanner freshness={freshness} />
      {error && <div className="notice error">{error}</div>}
      <article className="surface">
        <SectionHeader eyebrow="Google Tag Manager" title="Snapshots do container" icon={Tags} />
        {loading ? (
          <EmptyState compact text="Carregando snapshots do GTM..." />
        ) : snapshots.length === 0 ? (
          <EmptyState compact text="Nenhum snapshot de GTM coletado para este cliente." />
        ) : (
          <div className="table-list">
            {snapshots.map((snapshot) => (
              <div className="gtm-snapshot" key={snapshot.id}>
                <div className="table-row">
                  <strong>{snapshot.account_id}/{snapshot.container_id}</strong>
                  <span>GTM workspace {snapshot.gtm_workspace_id ?? "live"}</span>
                  <span>{snapshot.tags_count} tags</span>
                  <span>{snapshot.triggers_count} triggers · {snapshot.variables_count} variáveis</span>
                  <span>{new Date(snapshot.collected_at).toLocaleString("pt-BR")}</span>
                </div>
                {snapshot.findings.length > 0 && (
                  <div className="insights-list mt-3">
                    {snapshot.findings.map((finding) => (
                      <div className="insight-item" key={finding.id}>
                        <AlertTriangle size={18} className={`insight-icon severity-${finding.severity}`} />
                        <div>
                          <strong>
                            {finding.title} <em className="demo-badge">{severityLabel[finding.severity] ?? finding.severity}</em>
                          </strong>
                          <p>{finding.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

function KommoTab({ organizationId }: { organizationId: string }) {
  const { data: analytics, isLoading, error } = useKommoAnalytics(organizationId);

  return (
    <div className="performance-tab-panel">
      {error && <div className="notice error">{error.message || "Não foi possível carregar os dados do Kommo."}</div>}
      
      <article className="surface">
        <SectionHeader eyebrow="Kommo CRM" title="Métricas de Pipeline" icon={Briefcase} />
        
        {isLoading ? (
          <EmptyState compact text="Carregando dados do Kommo..." />
        ) : !analytics || analytics.pipelines.length === 0 ? (
          <EmptyState compact text="Nenhum dado do Kommo sincronizado para esta organização. Verifique se as credenciais estão configuradas na aba de Integrações e aguarde o sync diário." />
        ) : (
          <div className="analytics-grid" style={{ marginTop: 24, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {analytics.pipelines.map((pipeline) => (
              <article key={pipeline.pipeline_id} className="surface" style={{ padding: '20px', background: 'var(--bg-panel)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h4 style={{ margin: 0, fontSize: 16 }}>{pipeline.pipeline_name}</h4>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    Atualizado em {new Date(pipeline.snapshot_date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Total de Leads</div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>{formatNumber(pipeline.total_leads)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Valor Total</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-main)' }}>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pipeline.total_value)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Leads Ganhos</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--brand-accent)' }}>{formatNumber(pipeline.won_leads)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Valor Ganho</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--brand-accent)' }}>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pipeline.won_value)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Leads Perdidos</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--danger-soft)' }}>{formatNumber(pipeline.lost_leads)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Leads Ativos</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--accent)' }}>{formatNumber(pipeline.active_leads)}</div>
                  </div>
                </div>
                
                <div style={{ 
                  height: 6, 
                  background: 'var(--bg-element)', 
                  borderRadius: 3, 
                  display: 'flex', 
                  overflow: 'hidden' 
                }}>
                  {pipeline.total_leads > 0 && (
                    <>
                      <div style={{ width: `${(pipeline.won_leads / pipeline.total_leads) * 100}%`, background: 'var(--brand-accent)' }} title="Ganhos" />
                      <div style={{ width: `${(pipeline.active_leads / pipeline.total_leads) * 100}%`, background: 'var(--accent)' }} title="Ativos" />
                      <div style={{ width: `${(pipeline.lost_leads / pipeline.total_leads) * 100}%`, background: 'var(--danger-soft)' }} title="Perdidos" />
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

export function AnalyticsView({ clientId, workspaceName }: { clientId: string; workspaceName?: string }) {
  const { data: clientsData } = useClients();
  const clients = clientsData ?? [];
  const selectedClient = clients.find((client) => client.id === clientId) ?? null;
  const effectiveClientId = selectedClient?.id ?? "";
  const [overview, setOverview] = useState<PerformanceOverview | null>(null);
  const [campaigns, setCampaigns] = useState<AdsCampaignSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<PerformanceTab>("overview");

  useEffect(() => {
    setTab("overview");
  }, [effectiveClientId]);

  useEffect(() => {
    if (!effectiveClientId) {
      setOverview(null);
      setCampaigns([]);
      return;
    }

    setLoading(true);
    setError("");
    Promise.all([api.performanceOverview(effectiveClientId), api.adsCampaigns(effectiveClientId)])
      .then(([nextOverview, nextCampaigns]) => {
        setOverview(nextOverview);
        setCampaigns(nextCampaigns);
      })
      .catch((err: Error) => setError(err.message || "Não foi possível carregar Performance."))
      .finally(() => setLoading(false));
  }, [effectiveClientId]);

  const trend = useMemo<TrendPoint[]>(
    () => overview?.daily.map((point) => ({ label: point.date.slice(5), value: point.impressions })) ?? [],
    [overview],
  );
  const hasSyncedSource = overview?.freshness.some((source) => source.last_synced_at) ?? false;
  const demoMode = !hasSyncedSource;

  function freshnessOf(provider: PerformanceProvider): FreshnessEntry | null {
    return overview?.freshness.find((source) => source.provider === provider) ?? null;
  }

  if (loading) {
    return <EmptyState text="Carregando Performance..." />;
  }

  const ads = overview?.ads;

  return (
    <section className="analytics-layout">
      {error && <div className="notice error">{error}</div>}

      <div className="analytics-header">
        <div>
          <h2>Performance de {workspaceName ?? selectedClient?.name ?? "cliente"}</h2>
          <p>
            {overview
              ? `${overview.period_start} até ${overview.period_end}`
              : "Sem dados de Performance para o período atual."}
          </p>
        </div>
        <div className="analytics-actions">
          <button className="ghost-button dark" type="button" disabled>
            <RefreshCw size={16} />
            Sync manual pelo backend
          </button>
        </div>
      </div>

      <div className="performance-tabs" role="tablist">
        {performanceTabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={tab === item.id ? "performance-tab active" : "performance-tab"}
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
            >
              <Icon size={15} />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <>
          {demoMode && (
            <div className="demo-banner" role="status">
              <AlertTriangle size={18} />
              <span>
                Performance está conectada ao backend do Bioma, mas ainda sem credenciais reais validadas. Os números
                podem vir do seed de demonstração até o primeiro sync Google/ClickUp controlado.
              </span>
            </div>
          )}

          <div className="metrics analytics-metrics">
            <article className="metric-card analytics-card">
              <span>
                <BarChart3 size={16} /> Impressões {demoMode && <em className="demo-badge">demo</em>}
              </span>
              <strong>{formatNumber(ads?.impressions ?? 0)}</strong>
              <small>Google Ads agregado</small>
            </article>
            <article className="metric-card analytics-card">
              <span>
                <TrendingUp size={16} /> Cliques {demoMode && <em className="demo-badge">demo</em>}
              </span>
              <strong>{formatNumber(ads?.clicks ?? 0)}</strong>
              <small>CTR {formatPercent(ads?.ctr ?? 0)}</small>
            </article>
            <article className="metric-card analytics-card">
              <span>
                <Target size={16} /> Conversões {demoMode && <em className="demo-badge">demo</em>}
              </span>
              <strong>{formatNumber(ads?.conversions ?? 0)}</strong>
              <small>ROAS {(ads?.roas ?? 0).toFixed(2)}</small>
            </article>
            <article className="metric-card analytics-card">
              <span>
                <LineChart size={16} /> Investimento {demoMode && <em className="demo-badge">demo</em>}
              </span>
              <strong>{formatMoneyMicros(ads?.cost_micros ?? 0)}</strong>
              <small>CPA {formatMoneyMicros(ads?.cpa_micros ?? 0)}</small>
            </article>
          </div>

          <div className="analytics-grid">
            <article className="surface">
              <SectionHeader eyebrow="Evolução" title="Impressões por dia" icon={LineChart} />
              {trend.length > 0 ? <TrendChart data={trend} name="Impressões" /> : <EmptyState compact text="Sem série diária." />}
              <p className="panel-footnote">Dados lidos do endpoint real de Performance do Bioma.</p>
            </article>

            <article className="surface">
              <SectionHeader eyebrow="Freshness" title="Fontes conectadas" icon={Sparkles} />
              <div className="health-list">
                {overview?.freshness.map((source) => (
                  <div className="health-row" key={source.provider}>
                    <span className={source.status === "error" ? "dot" : "dot online"} />
                    <span>{providerLabel(source.provider)}</span>
                    <strong className={source.status === "error" ? "bad" : "ok"}>
                      {source.last_synced_at ? new Date(source.last_synced_at).toLocaleDateString("pt-BR") : "sem sync"}
                    </strong>
                  </div>
                ))}
                {!overview?.freshness.length && <EmptyState compact text="Nenhuma conexão de Performance." />}
              </div>
            </article>
          </div>

          <article className="surface">
            <SectionHeader eyebrow="Google Ads" title="Campanhas" icon={BarChart3} />
            <div className="table-list">
              {campaigns.map((campaign) => (
                <div className="table-row" key={campaign.campaign_id}>
                  <strong>{campaign.campaign_name}</strong>
                  <span>{campaign.channel_type}</span>
                  <span>{formatNumber(campaign.impressions)} imp.</span>
                  <span>{formatNumber(campaign.clicks)} cliques</span>
                  <span>{formatMoneyMicros(campaign.cost_micros)}</span>
                </div>
              ))}
              {campaigns.length === 0 && <EmptyState compact text="Nenhuma campanha retornada." />}
            </div>
          </article>
        </>
      )}

      {tab === "google_ads" && <GoogleAdsTab clientId={effectiveClientId} freshness={freshnessOf("google_ads")} />}
      {tab === "ga4" && <Ga4Tab clientId={effectiveClientId} freshness={freshnessOf("ga4")} />}
      {tab === "search_console" && <GscTab clientId={effectiveClientId} freshness={freshnessOf("search_console")} />}
      {tab === "gtm" && <GtmTab clientId={effectiveClientId} freshness={freshnessOf("gtm")} />}
      {tab === "kommo" && selectedClient?.organization_id && <KommoTab organizationId={selectedClient.organization_id} />}
    </section>
  );
}
