import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bug, FileText, FlaskConical, ListChecks, Rocket, Send } from "lucide-react";

import { api, type ProjectDetail, type ProjectDocument, type ProjectPhaseStatus, type WorkspaceSummary } from "../lib/api";

const PHASE_LABELS: Record<ProjectPhaseStatus, string> = {
  planned: "Planejada",
  development: "Em desenvolvimento",
  blocked: "Bloqueada",
  internal_testing: "Em testes internos",
  client_validation: "Em validação do cliente",
  released: "Publicada",
};
const DOCUMENT_LABELS: Record<ProjectDocument["kind"], string> = {
  proposal: "Proposta",
  technical_spec: "Documento técnico",
  scope: "Escopo",
  acceptance: "Aceite",
  release_notes: "Notas de release",
};
const UPDATE_ICON = { progress: ListChecks, blocker: Bug, testing: FlaskConical, release: Rocket, note: Send };
type AccessRole = WorkspaceSummary["access_role"];

export function TechProjectTracking({ project, accessRole, onChanged }: {
  project: ProjectDetail;
  accessRole: AccessRole;
  onChanged: (project: ProjectDetail) => Promise<void>;
}) {
  const canManage = ["platform_admin", "tenant_admin", "workspace_manager", "operator"].includes(accessRole);
  const [phaseName, setPhaseName] = useState("");
  const [phaseSummary, setPhaseSummary] = useState("");
  const [documentKind, setDocumentKind] = useState<ProjectDocument["kind"]>("proposal");
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [updateKind, setUpdateKind] = useState<"progress" | "blocker" | "testing" | "release" | "note">("progress");
  const [updateSummary, setUpdateSummary] = useState("");
  const [updatePhaseId, setUpdatePhaseId] = useState("");

  const createPhase = useMutation({
    mutationFn: () => api.createProjectPhase(project.id, {
      sequence: project.phases.length + 1,
      name: phaseName.trim(),
      status: "planned",
      client_summary: phaseSummary.trim() || null,
    }),
    onSuccess: async (next) => { setPhaseName(""); setPhaseSummary(""); await onChanged(next); },
  });
  const createDocument = useMutation({
    mutationFn: () => api.createProjectDocument(project.id, { kind: documentKind, title: documentTitle.trim(), url: documentUrl.trim() }),
    onSuccess: async (next) => { setDocumentTitle(""); setDocumentUrl(""); await onChanged(next); },
  });
  const createUpdate = useMutation({
    mutationFn: () => api.createProjectUpdate(project.id, {
      phase_id: updatePhaseId || null,
      kind: updateKind,
      summary: updateSummary.trim(),
    }),
    onSuccess: async (next) => { setUpdateSummary(""); await onChanged(next); },
  });

  function submitPhase(event: FormEvent) { event.preventDefault(); createPhase.mutate(); }
  function submitDocument(event: FormEvent) { event.preventDefault(); createDocument.mutate(); }
  function submitUpdate(event: FormEvent) { event.preventDefault(); createUpdate.mutate(); }

  return (
    <section className="project-section tech-tracking">
      <h3>Roadmap técnico</h3>
      <p className="panel-footnote">Fases, validações e atualizações de engenharia explicam o andamento sem transformar tempo de debugging em “avanço” artificial.</p>
      <div className="tech-phase-list">
        {project.phases.map((phase) => (
          <article className={`tech-phase ${phase.status}`} key={phase.id}>
            <div><strong>Fase {phase.sequence} · {phase.name}</strong><span>{PHASE_LABELS[phase.status]}</span></div>
            {phase.client_summary && <p>{phase.client_summary}</p>}
            <small>{phase.deliverables_done}/{phase.deliverables_total} entregas concluídas</small>
          </article>
        ))}
      </div>
      {canManage && <form className="project-inline-form tech-form" onSubmit={submitPhase}>
        <input required minLength={2} value={phaseName} onChange={(event) => setPhaseName(event.target.value)} placeholder="Ex.: Evolução 2 — agenda e prontuário" />
        <input value={phaseSummary} onChange={(event) => setPhaseSummary(event.target.value)} placeholder="Resumo para o cliente" />
        <button className="mini-button" type="submit" disabled={createPhase.isPending}>Adicionar fase</button>
      </form>}

      <div className="tech-documents">
        <h4><FileText size={15} /> Documentos do projeto</h4>
        {project.documents.length === 0 && <p className="panel-footnote">Vincule proposta, escopo e documento técnico para a equipe e o cliente encontrarem a referência correta.</p>}
        {project.documents.map((document) => <a className="tech-document" href={document.url} key={document.id} target="_blank" rel="noreferrer"><span>{DOCUMENT_LABELS[document.kind]}</span>{document.title}</a>)}
        {canManage && <form className="project-inline-form tech-form" onSubmit={submitDocument}>
          <select value={documentKind} onChange={(event) => setDocumentKind(event.target.value as ProjectDocument["kind"])}>{Object.entries(DOCUMENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <input required minLength={2} value={documentTitle} onChange={(event) => setDocumentTitle(event.target.value)} placeholder="Título do documento" />
          <input required type="url" value={documentUrl} onChange={(event) => setDocumentUrl(event.target.value)} placeholder="https://..." />
          <button className="mini-button" type="submit" disabled={createDocument.isPending}>Vincular</button>
        </form>}
      </div>

      <div className="tech-updates">
        <h4>Atualizações para o cliente</h4>
        {project.updates.length === 0 && <p className="panel-footnote">Ainda não há atualizações publicadas.</p>}
        {project.updates.map((update) => {
          const Icon = UPDATE_ICON[update.kind];
          return <div className={`tech-update ${update.kind}`} key={update.id}><Icon size={15} /><div><strong>{update.summary}</strong><small>{new Date(update.created_at).toLocaleDateString("pt-BR")}</small></div></div>;
        })}
        {canManage && <form className="project-inline-form tech-form" onSubmit={submitUpdate}>
          <select value={updateKind} onChange={(event) => setUpdateKind(event.target.value as typeof updateKind)}><option value="progress">Avanço</option><option value="blocker">Bloqueio/debug</option><option value="testing">Teste</option><option value="release">Release</option><option value="note">Nota</option></select>
          <select value={updatePhaseId} onChange={(event) => setUpdatePhaseId(event.target.value)}><option value="">Projeto geral</option>{project.phases.map((phase) => <option key={phase.id} value={phase.id}>Fase {phase.sequence}: {phase.name}</option>)}</select>
          <input required minLength={3} value={updateSummary} onChange={(event) => setUpdateSummary(event.target.value)} placeholder="Ex.: corrigimos a inconsistência de sincronização; sem entrega nova hoje." />
          <button className="mini-button" type="submit" disabled={createUpdate.isPending}>Publicar atualização</button>
        </form>}
      </div>
    </section>
  );
}
