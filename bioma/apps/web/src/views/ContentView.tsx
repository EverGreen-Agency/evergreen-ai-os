import { BookOpen, CalendarCheck, Download, PenLine, Sparkles } from "lucide-react";
import { SectionHeader, EmptyState } from "../components/shared";
import { ArtifactSectionGrid } from "../components/ArtifactSections";
import { BriefingPanel } from "../components/BriefingPanel";
import { EditorialCalendar } from "../components/EditorialCalendar";
import { artifactKindLabel, formatDueDate } from "../lib/format";
import { deliverableStatusLabel } from "../lib/app-config";
import type { ArtifactSummary, ClientSummary, ClientPortal } from "../lib/api";

export function ContentView({
  selectedClient,
  portal,
  onSelectArtifact,
}: {
  selectedClient: ClientSummary | null;
  portal: ClientPortal | null;
  onSelectArtifact: (artifact: ArtifactSummary) => void;
}) {
  if (!selectedClient || !portal) {
    return <EmptyState text="Selecione um cliente para ver conteúdo." />;
  }

  const briefing = portal.artifacts.find((artifact) => artifact.kind === "briefing") ?? null;
  const brandBook = portal.artifacts.find((artifact) => artifact.kind === "brand_book") ?? null;
  const otherArtifacts = portal.artifacts.filter(
    (artifact) => artifact.kind !== "brand_book" && artifact.kind !== "briefing",
  );

  return (
    <section className="content-layout">
      <div className="content-main">
        <article className="surface">
          <BriefingPanel briefing={briefing} onEdit={onSelectArtifact} />
        </article>

        <article className="surface">
          <SectionHeader eyebrow="Base estratégica" title="Brand book" icon={Sparkles} />
          {brandBook ? (
            <div className="brand-book-card">
              <div className="brand-book-header">
                <div>
                  <h3>{brandBook.title}</h3>
                  <small>Construído a partir do briefing e das entrevistas de onboarding.</small>
                </div>
                <div className="brand-book-actions">
                  <button type="button" className="ghost-button dark" onClick={() => onSelectArtifact(brandBook)}>
                    <PenLine size={14} /> Editar brand book
                  </button>
                </div>
              </div>

              <ArtifactSectionGrid
                content={brandBook.content}
                emptyText="Brand book sem conteúdo textual. Edite o artefato para preencher as seções."
              />

              <div className="brand-book-footer">
                <button className="primary-button" type="button" disabled title="Fluxo de aprovação de artefato ainda não disponível">
                  Aprovar brand book (em breve)
                </button>
                <button className="secondary-button" type="button" disabled title="Integração Notion ainda não disponível">
                  <Download size={14} /> Exportar para Notion (em breve)
                </button>
              </div>
            </div>
          ) : (
            <EmptyState text="Nenhum brand book cadastrado. Crie um artefato do tipo Brand book para este cliente." />
          )}
        </article>

        <article className="surface">
          <SectionHeader eyebrow="Planejamento" title="Calendário editorial" icon={CalendarCheck} />
          <EditorialCalendar deliverables={portal.deliverables} />
        </article>
      </div>

      <div className="content-sidebar">
        <article className="surface">
          <SectionHeader eyebrow="Biblioteca" title="Outros artefatos" icon={BookOpen} />
          <div className="artifact-board">
            {otherArtifacts.map((artifact) => (
              <button className="artifact-tile" key={artifact.id} type="button" onClick={() => onSelectArtifact(artifact)}>
                <span>{artifactKindLabel(artifact.kind)}</span>
                <strong>{artifact.title}</strong>
                {artifact.content && <small>{artifact.content.substring(0, 80)}…</small>}
              </button>
            ))}
            {otherArtifacts.length === 0 && <EmptyState compact text="Nenhum outro artefato." />}
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
