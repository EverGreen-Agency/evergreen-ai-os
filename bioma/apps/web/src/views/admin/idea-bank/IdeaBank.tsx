import { useEffect, useState, useCallback, useRef } from "react";
import type { DragEvent } from "react";
import type { CSSProperties } from "react";
import { useIdeaStore } from "../../../store/useIdeaStore";
import type { Idea, Stage, Horizon, Category } from "../../../types/idea";

// ── config ──────────────────────────────────────────────────────────────────

const STAGES: Stage[] = ["capture", "evaluation", "processing", "project", "company"];

// Column labels are PT (printed on the front); keys are the English enum values.
const STAGE_META: Record<Stage, { label: string; color: string; hint: string }> = {
  capture:    { label: "Captura",      color: "#8888a0", hint: "Ideia bruta — acabou de surgir. Falta avaliar se vale o esforço." },
  evaluation: { label: "Avaliação",    color: "#ffab00", hint: "Em análise — decidindo se vira projeto ou fica no horizonte futuro." },
  processing: { label: "Em Progresso", color: "#00d4ff", hint: "Em construção — squad ativo ou artefato sendo criado agora." },
  project:    { label: "Projeto",      color: "#00e676", hint: "Entregue e em uso — funciona em produção ou uso real." },
  company:    { label: "Empresa Nova", color: "#a855f7", hint: "Virou produto ou spin-off — transformação de negócio." },
};

const CAT_COLOR: Record<string, string> = {
  Squad:      "#00d4ff",
  Cockpit:    "#00e676",
  Feature:    "#ffab00",
  Service:    "#a855f7",
  Infra:      "#8888a0",
  Commercial: "#ff5252",
  Platform:   "#3ac97b",
};

// Category descriptions — tooltip on badges and filters (PT, shown on the front).
const CAT_DESC: Record<string, string> = {
  Squad:      "Time de agentes com pipeline próprio (ex: eg_setup, Curador, Arquiteto).",
  Cockpit:    "Interface / painel de controle — onde o humano opera (dashboard, abas, carteira).",
  Feature:    "Funcionalidade pontual dentro de um squad ou do sistema (ex: SLA Watchdog).",
  Service:    "Oferta vendável ao cliente — um entregável comercial (ex: Auditoria AI-First).",
  Infra:      "Fundação técnica que outros usam (vector store, MCP, bancos de conhecimento).",
  Commercial: "Estratégia de posicionamento, precificação ou venda (ex: AI-CMO, Dogfooding).",
  Platform:   "Mega-plataforma EG e seus módulos — o guarda-chuva e as camadas do sistema (multitenant, client-hub, financeiro...).",
};

// Rótulos em PT exibidos no front (o valor no JSON continua em inglês — enum).
const CAT_LABEL: Record<string, string> = {
  Squad:      "Squad",
  Cockpit:    "Cockpit",
  Feature:    "Recurso",
  Service:    "Serviço",
  Infra:      "Infra",
  Commercial: "Comercial",
  Platform:   "Plataforma",
};

const CATEGORIES = Object.keys(CAT_COLOR);

// Urgency order for development. Lower = more urgent; sorts cards within a column.
const HORIZON_ORDER: Record<string, number> = {
  "NOW": 0,
  "MEDIUM": 1,
  "LONG": 2,
  "NEW_COMPANY": 3,
  "": 4, // to be redefined — goes to the end
};

// Horizon badge color by urgency. NOW stands out. Labels shown are PT.
const HORIZON_META: Record<string, { label: string; color: string }> = {
  "NOW":         { label: "AGORA",        color: "#ff5252" },
  "MEDIUM":      { label: "MÉDIO",        color: "#ffab00" },
  "LONG":        { label: "LONGO",        color: "#8888a0" },
  "NEW_COMPANY": { label: "EMPRESA NOVA", color: "#a855f7" },
};

// ── helpers ──────────────────────────────────────────────────────────────────

async function writeIdeas(ideas: Idea[]) {
  await fetch("/api/ideas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ideas }),
  });
}

// ── main component ───────────────────────────────────────────────────────────

export function IdeaBank() {
  const ideas = useIdeaStore((s) => s.ideas);
  const setIdeas = useIdeaStore((s) => s.setIdeas);
  const [loading, setLoading] = useState(ideas.length === 0);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
  const [readingDocId, setReadingDocId] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    if (ideas.length > 0) { setLoading(false); return; }
    fetch("/api/ideas", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => { if (data?.ideas) setIdeas(data.ideas); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const moveStage = useCallback(async (idea: Idea, dir: 1 | -1) => {
    const idx = STAGES.indexOf(idea.stage);
    const next = STAGES[idx + dir];
    if (!next) return;
    const updated = ideas.map((i) => i.id === idea.id ? { ...i, stage: next } : i);
    setIdeas(updated);
    await writeIdeas(updated);
  }, [ideas, setIdeas]);

  const toggleArchive = useCallback(async (idea: Idea) => {
    const updated = ideas.map((i) => i.id === idea.id ? { ...i, archived: !i.archived } : i);
    setIdeas(updated);
    await writeIdeas(updated);
  }, [ideas, setIdeas]);

  const moveToStage = useCallback(async (idea: Idea, targetStage: Stage) => {
    if (idea.stage === targetStage) return;
    const updated = ideas.map((i) => i.id === idea.id ? { ...i, stage: targetStage } : i);
    setIdeas(updated);
    await writeIdeas(updated);
  }, [ideas, setIdeas]);

  const saveEdit = useCallback(async (updated: Idea) => {
    const next = ideas.map((i) => i.id === updated.id ? updated : i);
    setIdeas(next);
    setEditingId(null);
    await writeIdeas(next);
  }, [ideas, setIdeas]);

  const q = search.toLowerCase();
  const filtered = ideas.filter((i) => {
    if (!showArchived && i.archived) return false;
    if (selectedCat && i.category !== selectedCat) return false;
    if (q && !i.title.toLowerCase().includes(q) && !i.desc.toLowerCase().includes(q)) return false;
    return true;
  });

  const byStage = (stage: Stage) =>
    filtered
      .filter((i) => i.stage === stage)
      .sort((a, b) => (HORIZON_ORDER[a.horizon] ?? 9) - (HORIZON_ORDER[b.horizon] ?? 9));
  const activeCount = ideas.filter((i) => !i.archived).length;

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: 13 }}>
        Carregando banco de ideias...
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ideia..."
          style={styles.searchInput}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIES.map((cat) => {
            const active = selectedCat === cat;
            const color = CAT_COLOR[cat];
            return (
              <button
                key={cat}
                onClick={() => setSelectedCat(active ? null : cat)}
                title={CAT_DESC[cat]}
                style={{
                  ...styles.filterBtn,
                  borderColor: active ? color : "var(--border)",
                  background: active ? `${color}22` : "transparent",
                  color: active ? color : "var(--text-secondary)",
                }}
              >
                {CAT_LABEL[cat] ?? cat}
              </button>
            );
          })}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setShowArchived(!showArchived)}
            title="Arquivadas = ideias consideradas e descartadas/superadas de propósito (com o motivo), guardadas pra não rediscutir. Não é a lixeira: pra lixo real (duplicata, card de teste), exclua em vez de arquivar."
            style={{ ...styles.filterBtn, borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            {showArchived ? "Ocultar arquivadas" : "Ver arquivadas"}
          </button>
          <span style={{ fontSize: 11, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
            {activeCount} ativas
          </span>
        </div>
      </div>

      {/* Kanban */}
      <div style={styles.board}>
        {STAGES.map((stage) => {
          const cards = byStage(stage);
          const { label, color } = STAGE_META[stage];
          const isDropTarget = dragOverStage === stage && draggedId !== null;
          return (
            <div key={stage} style={styles.column}>
              <div style={{ borderTop: `2px solid ${color}`, paddingTop: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color, textTransform: "uppercase" }}>
                  {label}
                </span>
                <span style={{ marginLeft: 6, fontSize: 11, color: "var(--text-secondary)" }}>
                  {cards.length}
                </span>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.4 }}>
                {STAGE_META[stage].hint}
              </div>
              <div
                style={{
                  ...styles.cardList,
                  outline: isDropTarget ? `2px dashed ${color}66` : "2px solid transparent",
                  borderRadius: 6,
                  background: isDropTarget ? `${color}0a` : undefined,
                  transition: "outline 0.1s, background 0.1s",
                  minHeight: 48,
                }}
                onDragOver={(e: DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverStage(stage); }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e: DragEvent) => {
                  e.preventDefault();
                  if (draggedId) {
                    const idea = ideas.find((i) => i.id === draggedId);
                    if (idea) moveToStage(idea, stage);
                  }
                  setDraggedId(null);
                  setDragOverStage(null);
                }}
              >
                {cards.length === 0 && !isDropTarget && (
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", fontStyle: "italic", padding: "4px 0" }}>
                    —
                  </div>
                )}
                {isDropTarget && cards.length === 0 && (
                  <div style={{ fontSize: 11, color, fontStyle: "italic", padding: "4px 0", opacity: 0.7 }}>
                    Soltar aqui
                  </div>
                )}
                {cards.map((idea) => (
                  editingId === idea.id
                    ? <IdeaEditForm key={idea.id} idea={idea} onSave={saveEdit} onCancel={() => setEditingId(null)} />
                    : <IdeaCard
                        key={idea.id}
                        idea={idea}
                        ideas={ideas}
                        stage={stage}
                        expanded={expandedId === idea.id}
                        dragging={draggedId === idea.id}
                        onToggle={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
                        onMove={moveStage}
                        onArchive={toggleArchive}
                        onEdit={() => { setEditingId(idea.id); setExpandedId(null); }}
                        onReadDoc={() => setReadingDocId(idea.id)}
                        onDragStart={() => setDraggedId(idea.id)}
                        onDragEnd={() => { setDraggedId(null); setDragOverStage(null); }}
                      />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {readingDocId && (
        <DocModal
          id={readingDocId}
          title={ideas.find((i) => i.id === readingDocId)?.title ?? ""}
          onClose={() => setReadingDocId(null)}
        />
      )}
    </div>
  );
}

// ── card component ────────────────────────────────────────────────────────────

interface CardProps {
  idea: Idea;
  ideas: Idea[];
  stage: Stage;
  expanded: boolean;
  dragging: boolean;
  onToggle: () => void;
  onMove: (idea: Idea, dir: 1 | -1) => void;
  onArchive: (idea: Idea) => void;
  onEdit: () => void;
  onReadDoc: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function IdeaCard({ idea, ideas, stage, expanded, dragging, onToggle, onMove, onArchive, onEdit, onReadDoc, onDragStart, onDragEnd }: CardProps) {
  const catColor = CAT_COLOR[idea.category] ?? "#8888a0";
  const stageIdx = STAGES.indexOf(stage);
  const hasPrev = stageIdx > 0;
  const hasNext = stageIdx < STAGES.length - 1;

  const dependsOn = idea.depends_on.map((id) => ideas.find((i) => i.id === id)?.title ?? id);
  const enables = idea.enables.map((id) => ideas.find((i) => i.id === id)?.title ?? id);
  const horizon = HORIZON_META[idea.horizon];
  const parent = idea.part_of ? (ideas.find((i) => i.id === idea.part_of)?.title ?? idea.part_of) : null;
  const parentShort = parent ? (parent.length > 20 ? parent.slice(0, 18) + "…" : parent) : null;
  const childrenCount = ideas.filter((i) => i.part_of === idea.id && !i.archived).length;

  return (
    <div
      draggable
      onClick={onToggle}
      onDragStart={(e: DragEvent<HTMLDivElement>) => { e.dataTransfer.effectAllowed = "move"; onDragStart(); }}
      onDragEnd={onDragEnd}
      style={{
        ...styles.card,
        borderColor: expanded ? `${catColor}55` : "var(--border)",
        opacity: dragging ? 0.35 : (idea.archived ? 0.45 : 1),
        cursor: dragging ? "grabbing" : "grab",
        transform: dragging ? "scale(0.97)" : undefined,
        transition: "opacity 0.1s, transform 0.1s, border-color 0.12s",
      }}
    >
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, lineHeight: 1.45 }}>
          {idea.title}
        </span>
        {idea.origin === "external" && (
          <span title="Origem externa" style={{ fontSize: 10, color: "var(--text-secondary)", flexShrink: 0, marginTop: 1 }}>
            ↗
          </span>
        )}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: 11,
          color: "var(--text-secondary)",
          lineHeight: 1.55,
          marginBottom: 8,
          ...(expanded ? {} : {
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          } as CSSProperties),
        }}
      >
        {idea.desc}
      </div>

      {/* Badges */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <span
          title={CAT_DESC[idea.category]}
          style={{ ...styles.badge, background: `${catColor}22`, color: catColor, fontWeight: 700, cursor: "help" }}
        >
          {CAT_LABEL[idea.category] ?? idea.category}
        </span>
        {horizon && (
          <span
            title="Horizonte de urgência para desenvolvimento"
            style={{
              ...styles.badge,
              background: `${horizon.color}22`,
              color: horizon.color,
              border: `1px solid ${horizon.color}44`,
              fontWeight: 700,
            }}
          >
            {horizon.label}
          </span>
        )}
        {idea.depends_on.length > 0 && (
          <span style={{ ...styles.badge, color: "var(--text-secondary)" }} title={`Depende de: ${dependsOn.join(", ")}`}>
            ← {idea.depends_on.length}
          </span>
        )}
        {idea.enables.length > 0 && (
          <span style={{ ...styles.badge, color: "var(--text-secondary)" }} title={`Habilita: ${enables.join(", ")}`}>
            → {idea.enables.length}
          </span>
        )}
        {parent && (
          <span style={{ ...styles.badge, color: "var(--text-secondary)" }} title={`Faz parte de: ${parent}`}>
            ⊂ {parentShort}
          </span>
        )}
        {childrenCount > 0 && (
          <span style={{ ...styles.badge, color: "#3ac97b", background: "#3ac97b18" }} title={`Contém ${childrenCount} módulo(s)/ideia(s)`}>
            ⊃ {childrenCount}
          </span>
        )}
      </div>

      {/* Expanded: connections + actions */}
      {expanded && (
        <div onClick={(e) => e.stopPropagation()}>
          {dependsOn.length > 0 && (
            <div style={styles.connectionRow}>
              <span style={{ color: "var(--text-secondary)" }}>← depende de: </span>
              {dependsOn.join(", ")}
            </div>
          )}
          {enables.length > 0 && (
            <div style={styles.connectionRow}>
              <span style={{ color: "var(--text-secondary)" }}>→ habilita: </span>
              {enables.join(", ")}
            </div>
          )}
          {parent && (
            <div style={styles.connectionRow}>
              <span style={{ color: "var(--text-secondary)" }}>⊂ faz parte de: </span>
              {parent}
            </div>
          )}
          {childrenCount > 0 && (
            <div style={styles.connectionRow}>
              <span style={{ color: "#3ac97b" }}>⊃ contém: </span>
              {childrenCount} módulo(s)/ideia(s)
            </div>
          )}
          {idea.readiness && (
            <div style={styles.connectionRow}>
              <span style={{ color: "var(--text-secondary)" }}>prontidão: </span>
              {idea.readiness}
            </div>
          )}
          {idea.source && (
            <div style={{ marginTop: 4, fontSize: 10, color: "var(--text-secondary)", fontStyle: "italic" }}>
              {idea.source}
            </div>
          )}

          <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {hasPrev && (
              <button onClick={() => onMove(idea, -1)} style={styles.actionBtn}>
                ← Recuar
              </button>
            )}
            {hasNext && (
              <button
                onClick={() => onMove(idea, 1)}
                style={{ ...styles.actionBtn, color: "#00d4ff", borderColor: "#00d4ff44" }}
              >
                Avançar →
              </button>
            )}
            <button
              onClick={onEdit}
              style={{ ...styles.actionBtn, color: "#ffab00", borderColor: "#ffab0044" }}
            >
              ✎ Editar
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onReadDoc(); }}
              style={{ ...styles.actionBtn, color: "#a855f7", borderColor: "#a855f744" }}
            >
              📄 Ler Detalhes
            </button>
            <button
              onClick={() => onArchive(idea)}
              title={idea.archived
                ? "Restaurar: traz a ideia de volta pro board ativo."
                : "Arquivar: cemitério de ideias rejeitadas/superadas conscientemente (com o motivo) — some do board mas fica consultável. Pra lixo real (duplicata/teste), exclua em vez de arquivar."}
              style={{ ...styles.actionBtn, marginLeft: "auto" }}
            >
              {idea.archived ? "Restaurar" : "Arquivar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── edit form ─────────────────────────────────────────────────────────────────

function IdeaEditForm({ idea, onSave, onCancel }: { idea: Idea; onSave: (i: Idea) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<Idea>({ ...idea });
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const field = (key: keyof Idea, value: string | boolean) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ ...styles.card, borderColor: "#ffab0055", display: "flex", flexDirection: "column", gap: 8 }}
    >
      <input
        ref={titleRef}
        value={draft.title}
        onChange={(e) => field("title", e.target.value)}
        placeholder="Título"
        style={{ ...styles.editInput, fontWeight: 600 }}
      />
      <textarea
        value={draft.desc}
        onChange={(e) => field("desc", e.target.value)}
        placeholder="Descrição"
        rows={4}
        style={{ ...styles.editInput, resize: "vertical", lineHeight: 1.5 }}
      />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <select
          value={draft.category}
          onChange={(e) => field("category", e.target.value as Category)}
          style={styles.editSelect}
        >
          {(["Squad","Cockpit","Feature","Service","Infra","Commercial","Platform"] as Category[]).map((c) => (
            <option key={c} value={c}>{CAT_LABEL[c] ?? c}</option>
          ))}
        </select>
        <select
          value={draft.horizon}
          onChange={(e) => field("horizon", e.target.value as Horizon)}
          style={styles.editSelect}
        >
          <option value="">— sem horizonte —</option>
          <option value="NOW">Agora</option>
          <option value="MEDIUM">Médio Prazo</option>
          <option value="LONG">Longo Prazo</option>
          <option value="NEW_COMPANY">Empresa Nova</option>
        </select>
      </div>
      <input
        value={draft.source}
        onChange={(e) => field("source", e.target.value)}
        placeholder="Fonte / referência"
        style={styles.editInput}
      />
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={draft.depends_on.join(", ")}
          onChange={(e) => setDraft((d) => ({ ...d, depends_on: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
          placeholder="Depende de (IDs separados por vírgula)"
          style={{ ...styles.editInput, fontSize: 10 }}
          title="IDs das ideias das quais esta depende"
        />
        <input
          value={draft.enables.join(", ")}
          onChange={(e) => setDraft((d) => ({ ...d, enables: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
          placeholder="Habilita (IDs separados por vírgula)"
          style={{ ...styles.editInput, fontSize: 10 }}
          title="IDs das ideias que esta ideia desbloqueia"
        />
      </div>
      <input
        value={draft.part_of ?? ""}
        onChange={(e) => setDraft((d) => ({ ...d, part_of: e.target.value.trim() || undefined }))}
        placeholder="Faz parte de (ID do módulo/umbrella — part_of)"
        style={{ ...styles.editInput, fontSize: 10 }}
        title="ID da ideia guarda-chuva/módulo que esta compõe (part_of)"
      />
      <textarea
        value={draft.readiness ?? ""}
        onChange={(e) => setDraft((d) => ({ ...d, readiness: e.target.value || undefined }))}
        placeholder="Prontidão / portões externos p/ começar (mercado, equipe, dinheiro)"
        rows={2}
        style={{ ...styles.editInput, resize: "vertical", fontSize: 10 }}
      />
      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
        <button
          type="button"
          onClick={() => onSave(draft)}
          style={{ ...styles.actionBtn, color: "#3ac97b", borderColor: "#3ac97b55", flex: 1 }}
        >
          Salvar
        </button>
        <button type="button" onClick={onCancel} style={{ ...styles.actionBtn, flex: 1 }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, CSSProperties> = {
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
    flexWrap: "wrap",
    background: "var(--bg-sidebar)",
  },
  searchInput: {
    background: "var(--bg-primary)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "4px 10px",
    color: "var(--text-primary)",
    fontSize: 12,
    fontFamily: "inherit",
    width: 180,
    outline: "none",
  },
  filterBtn: {
    padding: "3px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontFamily: "inherit",
    cursor: "pointer",
    border: "1px solid",
    transition: "all 0.12s",
  },
  board: {
    flex: 1,
    display: "flex",
    gap: 12,
    padding: 16,
    overflowX: "auto",
    overflowY: "hidden",
    alignItems: "flex-start",
  },
  column: {
    flex: 1,
    minWidth: 260,
    display: "flex",
    flexDirection: "column",
    maxHeight: "100%",
  },
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    overflowY: "auto",
    flex: 1,
  },
  card: {
    background: "var(--bg-secondary)",
    border: "1px solid",
    borderRadius: 6,
    padding: "10px 12px",
    cursor: "pointer",
    transition: "border-color 0.12s",
  },
  badge: {
    fontSize: 10,
    padding: "2px 5px",
    borderRadius: 3,
  },
  connectionRow: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 1.5,
    color: "var(--text-primary)",
  },
  actionBtn: {
    padding: "3px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontFamily: "inherit",
    cursor: "pointer",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text-secondary)",
  },
  editInput: {
    background: "var(--bg-primary)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "5px 8px",
    color: "var(--text-primary)",
    fontSize: 12,
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box" as const,
    outline: "none",
  },
  editSelect: {
    background: "var(--bg-primary)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "4px 6px",
    color: "var(--text-primary)",
    fontSize: 11,
    fontFamily: "inherit",
    cursor: "pointer",
  },
};

// ── doc modal ─────────────────────────────────────────────────────────────────

function DocModal({ id, title, onClose }: { id: string; title: string; onClose: () => void }) {
  const [doc, setDoc] = useState<string>("Carregando documento...");

  useEffect(() => {
    fetch(`/api/ideas/doc?id=${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.text();
      })
      .then((text) => setDoc(text))
      .catch(() => setDoc("Este documento ainda não foi gerado pelo Curador.\n\nA ideia possui apenas o rascunho (descrição)."));
  }, [id]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 999, padding: 20
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--border)",
          borderRadius: 8, width: 600, maxWidth: "100%", maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
        }}
      >
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          <MarkdownViewer text={doc} />
        </div>
      </div>
    </div>
  );
}

function MarkdownViewer({ text }: { text: string }) {
  // Very simple regex parser for basic markdown elements
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") // escape HTML
    .replace(/^### (.*$)/gim, '<h3 style="margin-top:20px;margin-bottom:8px;font-size:14px;color:var(--text-primary);">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="margin-top:24px;margin-bottom:12px;font-size:16px;color:var(--text-primary); border-bottom:1px solid var(--border); padding-bottom:4px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="margin-top:0px;margin-bottom:16px;font-size:20px;color:#00d4ff;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`(.*?)`/gim, '<code style="background:var(--bg-secondary);padding:2px 4px;border-radius:4px;font-family:monospace;font-size:12px;">$1</code>')
    .replace(/^\> (.*$)/gim, '<blockquote style="border-left:3px solid #ffab00;margin:10px 0;padding-left:10px;color:var(--text-secondary);">$1</blockquote>')
    .replace(/\n\n/gim, '</p><p style="margin-bottom:12px;line-height:1.6;font-size:13px;color:var(--text-secondary);">')
    .replace(/\n/gim, '<br />');

  html = `<p style="margin-bottom:12px;line-height:1.6;font-size:13px;color:var(--text-secondary);">${html}</p>`;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
