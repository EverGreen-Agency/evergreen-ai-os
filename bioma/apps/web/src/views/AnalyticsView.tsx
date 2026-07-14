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
  }[provider] ?? provider;
}

type PerformanceTab = "overview" | "google_ads" | "ga4" | "search_console" | "gtm";

const performanceTabs: Array<{ id: PerformanceTab; label: string; icon: typeof BarChart3 }> = [
  { id: "overview", label: "Visão geral", icon: LineChart },
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
                  <span>workspace {snapshot.workspace_id ?? "live"}</span>
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

export function AnalyticsView({
  selectedClientId,
  selectedClient,
}: {
  selectedClientId: string | null;
  selectedClient: ClientSummary | null;
}) {
  const [overview, setOverview] = useState<PerformanceOverview | null>(null);
  const [campaigns, setCampaigns] = useState<AdsCampaignSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<PerformanceTab>("overview");

  useEffect(() => {
    setTab("overview");
  }, [selectedClientId]);

  useEffect(() => {
    if (!selectedClientId) {
      setOverview(null);
      setCampaigns([]);
      return;
    }

    setLoading(true);
    setError("");
    Promise.all([api.performanceOverview(selectedClientId), api.adsCampaigns(selectedClientId)])
      .then(([nextOverview, nextCampaigns]) => {
        setOverview(nextOverview);
        setCampaigns(nextCampaigns);
      })
      .catch((err: Error) => setError(err.message || "Não foi possível carregar Performance."))
      .finally(() => setLoading(false));
  }, [selectedClientId]);

  const trend = useMemo<TrendPoint[]>(
    () => overview?.daily.map((point) => ({ label: point.date.slice(5), value: point.impressions })) ?? [],
    [overview],
  );
  const hasSyncedSource = overview?.freshness.some((source) => source.last_synced_at) ?? false;
  const demoMode = !hasSyncedSource;

  function freshnessOf(provider: PerformanceProvider): FreshnessEntry | null {
    return overview?.freshness.find((source) => source.provider === provider) ?? null;
  }

  if (!selectedClientId || !selectedClient) {
    return <EmptyState text="Selecione um cliente para ver Analytics." />;
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
          <h2>Performance de {selectedClient.name}</h2>
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

      {tab === "google_ads" && <GoogleAdsTab clientId={selectedClientId} freshness={freshnessOf("google_ads")} />}
      {tab === "ga4" && <Ga4Tab clientId={selectedClientId} freshness={freshnessOf("ga4")} />}
      {tab === "search_console" && <GscTab clientId={selectedClientId} freshness={freshnessOf("search_console")} />}
      {tab === "gtm" && <GtmTab clientId={selectedClientId} freshness={freshnessOf("gtm")} />}
    </section>
  );
}
