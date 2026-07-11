import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, LineChart, RefreshCw, Sparkles, Target, TrendingUp } from "lucide-react";
import { EmptyState, SectionHeader } from "../components/shared";
import { TrendChart, type TrendPoint } from "../components/bi/TrendChart";
import { api, type AdsCampaignSummary, type ClientSummary, type PerformanceOverview } from "../lib/api";

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
      {demoMode && (
        <div className="demo-banner" role="status">
          <AlertTriangle size={18} />
          <span>
            Performance está conectada ao backend do Bioma, mas ainda sem credenciais reais validadas. Os números podem
            vir do seed de demonstração até o primeiro sync Google/ClickUp controlado.
          </span>
        </div>
      )}

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
    </section>
  );
}
