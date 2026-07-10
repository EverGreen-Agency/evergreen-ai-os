import { AlertTriangle, BarChart3, LineChart, TrendingUp, Users, Sparkles } from "lucide-react";
import { SectionHeader } from "../components/shared";
import { TrendChart, type TrendPoint } from "../components/bi/TrendChart";

const demoTrend: TrendPoint[] = [
  { label: "sem 1", value: 12400 },
  { label: "sem 2", value: 15100 },
  { label: "sem 3", value: 13800 },
  { label: "sem 4", value: 18900 },
  { label: "sem 5", value: 17600 },
  { label: "sem 6", value: 22300 },
  { label: "sem 7", value: 21100 },
  { label: "sem 8", value: 26800 },
  { label: "sem 9", value: 25400 },
  { label: "sem 10", value: 30200 },
  { label: "sem 11", value: 29100 },
  { label: "sem 12", value: 34600 },
];

const demoMetrics = [
  { icon: Users, label: "Seguidores", value: "8.642", delta: "↑ 3,2% vs. período anterior", tone: "ok" },
  { icon: BarChart3, label: "Impressões", value: "753.666", delta: "↑ 60,5% vs. período anterior", tone: "ok" },
  { icon: TrendingUp, label: "Alcance", value: "312.889", delta: "↑ 48,0% vs. período anterior", tone: "ok" },
  { icon: LineChart, label: "Taxa de Engajamento", value: "4,2%", delta: "↓ 1,1% vs. período anterior", tone: "bad" },
];

export function AnalyticsView() {
  return (
    <section className="analytics-layout">
      <div className="demo-banner" role="status">
        <AlertTriangle size={18} />
        <span>
          Demonstração da experiência de Analytics. Nenhum dado real: a integração com o LinkedIn ainda não está
          conectada. Todos os números abaixo são exemplos ilustrativos.
        </span>
      </div>

      <div className="analytics-header">
        <div>
          <h2>Analytics do LinkedIn (Perfil pessoal)</h2>
          <p>Prévia do layout de desempenho consolidado.</p>
        </div>
        <div className="analytics-actions">
          <button className="ghost-button dark" type="button" disabled>
            Últimos 30 dias
          </button>
          <button className="ghost-button dark" type="button" disabled>
            Exportar
          </button>
        </div>
      </div>

      <div className="metrics analytics-metrics">
        {demoMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article className="metric-card analytics-card" key={metric.label}>
              <span>
                <Icon size={16} /> {metric.label}
                <em className="demo-badge">exemplo</em>
              </span>
              <strong>{metric.value}</strong>
              <small className={metric.tone}>{metric.delta}</small>
            </article>
          );
        })}
      </div>

      <div className="analytics-grid">
        <article className="surface">
          <SectionHeader eyebrow="Evolução (exemplo)" title="Impressões" icon={LineChart} />
          <TrendChart data={demoTrend} name="Impressões" />
          <p className="panel-footnote">Série ilustrativa de demonstração — dados não reais.</p>
        </article>

        <article className="surface">
          <SectionHeader eyebrow="AI Insights (exemplo)" title="Insights Estratégicos" icon={Sparkles} />
          <div className="insights-list">
            <div className="insight-item">
              <div className="insight-icon ok">
                <TrendingUp size={16} />
              </div>
              <div>
                <strong>Postagens sobre estratégia renderam 2.4x mais impressões.</strong>
                <p>Exemplo de recomendação gerada quando houver dados reais conectados.</p>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon">
                <Users size={16} />
              </div>
              <div>
                <strong>Interações de 1º grau estão em alta.</strong>
                <p>Exemplo de recomendação gerada quando houver dados reais conectados.</p>
              </div>
            </div>
          </div>
          <button className="primary-button wide mt-3" type="button" disabled>
            Ver plano de ação (demo)
          </button>
        </article>
      </div>
    </section>
  );
}
