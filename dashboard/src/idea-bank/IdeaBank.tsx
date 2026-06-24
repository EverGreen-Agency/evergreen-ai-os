import { useEffect, useState, useCallback } from "react";
import type { CSSProperties } from "react";
import { useIdeaStore } from "@/store/useIdeaStore";
import type { Idea, Stage } from "@/types/idea";

// ── config ──────────────────────────────────────────────────────────────────

const STAGES: Stage[] = ["capture", "evaluation", "processing", "project", "company"];

// Column labels are PT (printed on the front); keys are the English enum values.
const STAGE_META: Record<Stage, { label: string; color: string }> = {
  capture:    { label: "Captura",      color: "#8888a0" },
  evaluation: { label: "Avaliação",    color: "#ffab00" },
  processing: { label: "Em Progresso", color: "#00d4ff" },
  project:    { label: "Projeto",      color: "#00e676" },
  company:    { label: "Empresa Nova", color: "#a855f7" },
};

const CAT_COLOR: Record<string, string> = {
  Squad:      "#00d4ff",
  Cockpit:    "#00e676",
  Feature:    "#ffab00",
  Service:    "#a855f7",
  Infra:      "#8888a0",
  Commercial: "#ff5252",
};

// Category descriptions — tooltip on badges and filters (PT, shown on the front).
const CAT_DESC: Record<string, string> = {
  Squad:      "Time de agentes com pipeline próprio (ex: eg_setup, Curador, Guardião).",
  Cockpit:    "Interface / painel de controle — onde o humano opera (dashboard, abas, carteira).",
  Feature:    "Funcionalidade pontual dentro de um squad ou do sistema (ex: SLA Watchdog).",
  Service:    "Oferta vendável ao cliente — um entregável comercial (ex: Auditoria AI-First).",
  Infra:      "Fundação técnica que outros usam (vector store, MCP, bancos de conhecimento).",
  Commercial: "Estratégia de posicionamento, precificação ou venda (ex: AI-CMO, Dogfooding).",
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
                {cat}
              </button>
            );
          })}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setShowArchived(!showArchived)}
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
          return (
            <div key={stage} style={styles.column}>
              <div style={{ borderTop: `2px solid ${color}`, paddingTop: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color, textTransform: "uppercase" }}>
                  {label}
                </span>
                <span style={{ marginLeft: 6, fontSize: 11, color: "var(--text-secondary)" }}>
                  {cards.length}
                </span>
              </div>
              <div style={styles.cardList}>
                {cards.length === 0 && (
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", fontStyle: "italic", padding: "4px 0" }}>
                    —
                  </div>
                )}
                {cards.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    ideas={ideas}
                    stage={stage}
                    expanded={expandedId === idea.id}
                    onToggle={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
                    onMove={moveStage}
                    onArchive={toggleArchive}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── card component ────────────────────────────────────────────────────────────

interface CardProps {
  idea: Idea;
  ideas: Idea[];
  stage: Stage;
  expanded: boolean;
  onToggle: () => void;
  onMove: (idea: Idea, dir: 1 | -1) => void;
  onArchive: (idea: Idea) => void;
}

function IdeaCard({ idea, ideas, stage, expanded, onToggle, onMove, onArchive }: CardProps) {
  const catColor = CAT_COLOR[idea.category] ?? "#8888a0";
  const stageIdx = STAGES.indexOf(stage);
  const hasPrev = stageIdx > 0;
  const hasNext = stageIdx < STAGES.length - 1;

  const dependsOn = idea.depends_on.map((id) => ideas.find((i) => i.id === id)?.title ?? id);
  const enables = idea.enables.map((id) => ideas.find((i) => i.id === id)?.title ?? id);
  const horizon = HORIZON_META[idea.horizon];

  return (
    <div
      onClick={onToggle}
      style={{
        ...styles.card,
        borderColor: expanded ? `${catColor}55` : "var(--border)",
        opacity: idea.archived ? 0.45 : 1,
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
          {idea.category}
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
              onClick={() => onArchive(idea)}
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
    width: 256,
    minWidth: 256,
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
};
