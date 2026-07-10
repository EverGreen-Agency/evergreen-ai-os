import { AlertTriangle, BarChart3, LineChart, TrendingUp, Users, Sparkles } from "lucide-react";
import { SectionHeader } from "../components/shared";

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
          <SectionHeader eyebrow="Evolução" title="Impressões" icon={LineChart} />
          <div className="chart-placeholder">
            <div className="chart-line" />
            <p className="chart-demo-text">Gráfico de demonstração (dados não reais)</p>
          </div>
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
