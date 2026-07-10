import { BarChart3, LineChart, TrendingUp, Users, Download, Sparkles } from "lucide-react";
import { SectionHeader } from "../components/shared";

export function AnalyticsView() {
  return (
    <section className="analytics-layout">
      <div className="analytics-header">
        <div>
          <h2>Analytics do LinkedIn (Perfil pessoal)</h2>
          <p>Desempenho consolidado do LinkedIn.</p>
        </div>
        <div className="analytics-actions">
           <button className="ghost-button dark">Últimos 30 dias</button>
           <button className="ghost-button dark"><Download size={16}/> Exportar</button>
        </div>
      </div>
      
      <div className="metrics analytics-metrics">
        <article className="metric-card analytics-card">
          <span><Users size={16}/> Seguidores</span>
          <strong>8.642</strong>
          <small className="ok">↑ 3,2% vs. período anterior</small>
        </article>
        <article className="metric-card analytics-card">
          <span><BarChart3 size={16}/> Impressões</span>
          <strong>753.666</strong>
          <small className="ok">↑ 60,5% vs. período anterior</small>
        </article>
        <article className="metric-card analytics-card">
          <span><TrendingUp size={16}/> Alcance</span>
          <strong>312.889</strong>
          <small className="ok">↑ 48,0% vs. período anterior</small>
        </article>
        <article className="metric-card analytics-card">
          <span><LineChart size={16}/> Taxa de Engajamento</span>
          <strong>4,2%</strong>
          <small className="bad">↓ 1,1% vs. período anterior</small>
        </article>
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
           <SectionHeader eyebrow="AI Insights" title="Insights Estratégicos" icon={Sparkles} />
           <div className="insights-list">
              <div className="insight-item">
                 <div className="insight-icon ok"><TrendingUp size={16}/></div>
                 <div>
                    <strong>Postagens sobre estratégia renderam 2.4x mais impressões.</strong>
                    <p>O tema está ressoando fortemente com a audiência técnica.</p>
                 </div>
              </div>
              <div className="insight-item">
                 <div className="insight-icon"><Users size={16}/></div>
                 <div>
                    <strong>Interações de 1º grau estão em alta.</strong>
                    <p>Aproveite para converter essas interações em reuniões de prospecção.</p>
                 </div>
              </div>
           </div>
           <button className="primary-button wide mt-3">Ver plano de ação (Demo)</button>
        </article>
      </div>
    </section>
  );
}
