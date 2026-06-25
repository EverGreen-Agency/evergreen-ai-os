import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Ring, Quadrant, Tech, StackRadar } from "@/types/stack";

// ── config ──────────────────────────────────────────────────────────────────

const RINGS: Ring[] = ["adopt", "trial", "assess", "hold"];

const RING_META: Record<Ring, { label: string; color: string; hint: string }> = {
  adopt:  { label: "Adotar",   color: "#3ac97b", hint: "Padrão da casa — usar sem pensar duas vezes." },
  trial:  { label: "Em Teste", color: "#ffab00", hint: "Testando em projeto real agora; vale apostar." },
  assess: { label: "Avaliar",  color: "#8fb4a3", hint: "Vale investigar, sem compromisso. Ainda é experimento." },
  hold:   { label: "Evitar",   color: "#ff6b5c", hint: "Não começar nada novo com isso. Substituir quando der." },
};

const QUADRANT_LABEL: Record<Quadrant, string> = {
  "languages": "Linguagens",
  "frameworks": "Frameworks",
  "tools": "Ferramentas",
  "platforms-infra": "Plataformas & Infra",
};

const QUADRANTS: Quadrant[] = ["languages", "frameworks", "tools", "platforms-infra"];

// ── component ─────────────────────────────────────────────────────────────────

export function TechRadar() {
  const [radar, setRadar] = useState<StackRadar | null>(null);
  const [loading, setLoading] = useState(true);
  const [quadFilter, setQuadFilter] = useState<Quadrant | null>(null);

  useEffect(() => {
    fetch("/api/stack", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setRadar(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Centered>Carregando Tech Radar...</Centered>;
  }
  if (!radar?.techs) {
    return <Centered>stack.json não encontrado.</Centered>;
  }

  const techs = quadFilter ? radar.techs.filter((t) => t.quadrant === quadFilter) : radar.techs;
  const byRing = (ring: Ring) => techs.filter((t) => t.ring === ring);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
          Tech Radar
        </span>
        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
          tecnologias para os projetos · {radar.techs.length} no radar
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {QUADRANTS.map((q) => {
            const active = quadFilter === q;
            return (
              <button
                key={q}
                onClick={() => setQuadFilter(active ? null : q)}
                style={{
                  ...styles.filterBtn,
                  borderColor: active ? "var(--accent-cyan)" : "var(--border)",
                  background: active ? "rgba(58,201,123,0.13)" : "transparent",
                  color: active ? "var(--accent-cyan)" : "var(--text-secondary)",
                }}
              >
                {QUADRANT_LABEL[q]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rings */}
      <div style={styles.board}>
        {RINGS.map((ring) => {
          const cards = byRing(ring);
          const meta = RING_META[ring];
          return (
            <div key={ring} style={styles.column}>
              <div style={{ borderTop: `2px solid ${meta.color}`, paddingTop: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, color: meta.color, textTransform: "uppercase" }}>
                  {meta.label}
                </span>
                <span style={{ marginLeft: 6, fontSize: 11, color: "var(--text-secondary)" }}>
                  {cards.length}
                </span>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.4 }}>
                {meta.hint}
              </div>
              <div style={styles.cardList}>
                {cards.length === 0 && (
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", fontStyle: "italic" }}>—</div>
                )}
                {cards.map((tech) => (
                  <TechCard key={tech.id} tech={tech} ringColor={meta.color} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TechCard({ tech, ringColor }: { tech: Tech; ringColor: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{ ...styles.card, borderColor: open ? `${ringColor}55` : "var(--border)" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{tech.name}</span>
        <span style={{ ...styles.badge, color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
          {QUADRANT_LABEL[tech.quadrant]}
        </span>
      </div>
      {open && (
        <>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 6 }}>
            {tech.note}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-secondary)", fontStyle: "italic", marginTop: 6 }}>
            {tech.adr ? `ADR: ${tech.adr} · ` : ""}{tech.source}
          </div>
        </>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: 13 }}>
      {children}
    </div>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, CSSProperties> = {
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 16px",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
    flexWrap: "wrap",
    background: "var(--bg-sidebar)",
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
    padding: "8px 12px",
    cursor: "pointer",
    transition: "border-color 0.12s",
  },
  badge: {
    fontSize: 10,
    padding: "2px 5px",
    borderRadius: 3,
  },
};
