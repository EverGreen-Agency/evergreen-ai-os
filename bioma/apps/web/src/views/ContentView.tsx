import { BookOpen, CalendarCheck, PenLine } from "lucide-react";
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
  // Brand book, calendário, mapas etc. são tratados como documentos genéricos:
  // a entrega muda por cliente, a plataforma não hardcoda um tipo específico.
  const documents = portal.artifacts.filter((artifact) => artifact.kind !== "briefing");

  return (
    <section className="content-layout">
      <div className="content-main">
        <article className="surface">
          <BriefingPanel briefing={briefing} onEdit={onSelectArtifact} />
        </article>

        <article className="surface">
          <SectionHeader eyebrow="Entregas estratégicas" title="Documentos do cliente" icon={BookOpen} />
          {documents.length === 0 && (
            <EmptyState text="Nenhum documento estratégico cadastrado (brand book, mapas, planos)." />
          )}
          {documents.map((document) => (
            <div className="doc-card" key={document.id}>
              <div className="doc-card-header">
                <div>
                  <span className="doc-kind">{artifactKindLabel(document.kind)}</span>
                  <h3>{document.title}</h3>
                </div>
                <div className="doc-card-actions">
                  <button type="button" className="ghost-button dark" onClick={() => onSelectArtifact(document)}>
                    <PenLine size={14} /> Editar
                  </button>
                </div>
              </div>
              <ArtifactSectionGrid
                content={document.content}
                emptyText="Documento sem conteúdo textual. Edite o artefato para preencher as seções."
              />
            </div>
          ))}
        </article>

        <article className="surface">
          <SectionHeader eyebrow="Planejamento" title="Calendário editorial" icon={CalendarCheck} />
          <EditorialCalendar deliverables={portal.deliverables} />
        </article>
      </div>

      <div className="content-sidebar">
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
