import { BookOpen, CalendarCheck, Sparkles, Download } from "lucide-react";
import { SectionHeader, EmptyState } from "../components/shared";
import { artifactKindLabel, formatDueDate } from "../lib/format";
import { deliverableStatusLabel } from "../lib/app-config";
import type { ClientSummary, ClientPortal } from "../lib/api";

export function ContentView({
  selectedClient,
  portal,
  onSelectArtifact,
}: {
  selectedClient: ClientSummary | null;
  portal: ClientPortal | null;
  onSelectArtifact: (artifact: any) => void;
}) {
  if (!selectedClient || !portal) {
    return <EmptyState text="Selecione um cliente para ver conteúdo." />;
  }

  // Separating artifacts for a richer experience
  const brandBook = portal.artifacts.find(a => a.kind === "brand_book");
  const briefing = portal.artifacts.find(a => a.kind === "briefing");
  const otherArtifacts = portal.artifacts.filter(a => a.kind !== "brand_book" && a.kind !== "briefing");

  return (
    <section className="content-layout">
      <article className="surface content-main">
        <SectionHeader eyebrow="Base estratégica" title="Brand book & Calendário Editorial com IA" icon={Sparkles} />
        
        {brandBook ? (
          <div className="brand-book-card">
            <div className="brand-book-header">
              <div>
                <h3>{brandBook.title}</h3>
                <small>Resumo gerado a partir do briefing e entrevistas.</small>
              </div>
              <div className="brand-book-actions">
                <button type="button" className="ghost-button dark" onClick={() => onSelectArtifact(brandBook)}>
                  <Sparkles size={14} /> Editar / Regerar com IA
                </button>
              </div>
            </div>
            
            <div className="brand-book-content">
              <div className="brand-book-pill-list">
                <span className="active">Essência da marca</span>
                <span>Posicionamento</span>
                <span>Mensagens</span>
                <span>Tom de voz</span>
                <span>Pilares</span>
              </div>
              
              <div className="brand-book-details">
                <div className="brand-book-section">
                  <h4>❤️ Propósito</h4>
                  <p>{brandBook.content || "Impulsionar marketing com excelência, conectando estratégia, conteúdo e dados."}</p>
                </div>
                <div className="brand-book-section">
                  <h4>⭐ Posicionamento</h4>
                  <p>Autoridade estratégica que combina visão de negócio com execução prática.</p>
                </div>
                <div className="brand-book-section">
                  <h4>💬 Tom de voz</h4>
                  <div className="tags">
                    <span className="tag">Profissional</span>
                    <span className="tag">Inspirador</span>
                    <span className="tag">Direto</span>
                    <span className="tag">Baseado em dados</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="brand-book-footer">
               <button className="primary-button">Aprovar brand book</button>
               <button className="secondary-button"><Download size={14} /> Exportar para Notion</button>
            </div>
          </div>
        ) : (
          <EmptyState text="Cadastre o Brand Book com IA deste cliente." />
        )}
        
        <h3 className="section-title mt-4"><CalendarCheck size={18}/> Calendário editorial</h3>
        <div className="editorial-calendar">
           <div className="calendar-grid">
              {/* Fake calendar grid just to show the UX concept without relying on real data */}
              <div className="calendar-day">
                 <h5>Seg 19</h5>
                 <div className="calendar-item carrossel">
                    <span className="item-type">Carrossel</span>
                    <p>5 métricas que revelam a saúde do seu marketing</p>
                    <small>10:00</small>
                 </div>
              </div>
              <div className="calendar-day">
                 <h5>Ter 20</h5>
                 <div className="calendar-item post">
                    <span className="item-type">Post (Imagem)</span>
                    <p>Como definir ICP sem achismos</p>
                    <small>14:00</small>
                 </div>
              </div>
              <div className="calendar-day">
                 <h5>Qua 21</h5>
                 <div className="calendar-item video">
                    <span className="item-type">Video (Reels)</span>
                    <p>ROI de conteúdo: como medir de verdade</p>
                    <small>16:00</small>
                 </div>
              </div>
              <div className="calendar-day">
                 <h5>Qui 22</h5>
                 <div className="calendar-item artigo">
                    <span className="item-type">Artigo</span>
                    <p>Briefing perfeito: 8 elementos essenciais</p>
                    <small>10:00</small>
                 </div>
              </div>
           </div>
        </div>

      </article>

      <div className="content-sidebar">
        <article className="surface mb-3">
          <SectionHeader eyebrow="Inputs" title="Briefing & Mapas" icon={BookOpen} />
          <div className="artifact-board">
            {briefing && (
              <button className="artifact-tile" key={briefing.id} type="button" onClick={() => onSelectArtifact(briefing)}>
                <span>{artifactKindLabel(briefing.kind)}</span>
                <strong>{briefing.title}</strong>
                <small>{briefing.content?.substring(0, 60)}...</small>
              </button>
            )}
            {otherArtifacts.map((artifact) => (
              <button className="artifact-tile" key={artifact.id} type="button" onClick={() => onSelectArtifact(artifact)}>
                <span>{artifactKindLabel(artifact.kind)}</span>
                <strong>{artifact.title}</strong>
              </button>
            ))}
            {portal.artifacts.length === 0 && <EmptyState text="Nenhum outro artefato." />}
          </div>
        </article>

        <article className="surface">
          <SectionHeader eyebrow="Agenda" title="Próximas entregas" icon={CalendarCheck} />
          <div className="timeline-list">
            {portal.deliverables.map((deliverable) => (
              <div className="timeline-row" key={deliverable.id}>
                <span>{formatDueDate(deliverable.due_at)}</span>
                <strong>{deliverable.title}</strong>
                <small>{deliverableStatusLabel[deliverable.status]}</small>
              </div>
            ))}
            {portal.deliverables.length === 0 && <EmptyState compact text="Sem entregas" />}
          </div>
        </article>
      </div>
    </section>
  );
}
