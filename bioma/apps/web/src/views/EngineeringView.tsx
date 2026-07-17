import { useEffect, useState } from "react";
import { SectionHeader, EmptyState } from "../components/shared";
import { FileText, ArrowRight, Activity, Calendar } from "lucide-react";


interface ModuleMaturity {
  id: string;
  phase: string;
  maturity: string;
  nextGate: string;
}

interface EngineeringModule {
  id: string;
  hasSpec: boolean;
  specTitle: string | null;
  specStatus: string | null;
  specDate: string | null;
  adrCount: number;
  hasTasks: boolean;
}

interface EngineeringData {
  modules: EngineeringModule[];
  matrix: Record<string, ModuleMaturity>;
}

const PHASE_ORDER = ["P0", "P0.5", "P1", "P2", "P3", "P4"];

function normalizePhase(phase: string | undefined): string {
  if (!phase) return "—";
  const match = phase.match(/P\d(?:\.\d)?/);
  return match ? match[0] : phase;
}

const PHASE_COLOR: Record<string, string> = {
  P0: "#ef4444",
  "P0.5": "#f97316",
  P1: "#eab308",
  P2: "#22c55e",
  P3: "#3b82f6",
  P4: "#8b5cf6",
};
const FALLBACK_COLOR = "#6b7280";

export function EngineeringView() {
  const [data, setData] = useState<EngineeringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/engineering", { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch engineering data");
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Carregando módulos...</div>;
  if (error) return <div className="error-state">Erro: {error}</div>;
  if (!data || data.modules.length === 0) return <EmptyState text="Nenhum módulo de engenharia encontrado." />;

  const groups = new Map<string, Array<{ mod: EngineeringModule; mat?: ModuleMaturity }>>();
  for (const mod of data.modules) {
    const mat = data.matrix[mod.id];
    const phase = normalizePhase(mat?.phase);
    if (!groups.has(phase)) groups.set(phase, []);
    groups.get(phase)!.push({ mod, mat });
  }

  const orderedPhases = [
    ...PHASE_ORDER.filter((p) => groups.has(p)),
    ...[...groups.keys()].filter((p) => !PHASE_ORDER.includes(p)).sort(),
  ];

  return (
    <section className="content-grid">
      <article className="surface large">
        <SectionHeader eyebrow="Engenharia" title="Módulos de Engenharia" icon={FileText} />
        
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginTop: "1rem" }}>
          {orderedPhases.map((phase) => {
            const items = groups.get(phase)!;
            const color = PHASE_COLOR[phase] ?? FALLBACK_COLOR;
            return (
              <section key={phase}>
                <h2 style={{ color, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem" }}>
                  {phase === "—" ? "Sem Fase Definida" : phase}{" "}
                  <span style={{ color: "#6b7280", fontFamily: "monospace" }}>({items.length})</span>
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                  {items.map(({ mod, mat }) => (
                    <div 
                      key={mod.id} 
                      className="engine-card" 
                      style={{ 
                        border: "1px solid #333", 
                        borderRadius: "8px", 
                        padding: "1rem", 
                        cursor: "pointer", 
                        transition: "border-color 0.2s" 
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = color}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "#333"}
                    >
                      <h3 style={{ fontFamily: "monospace", fontSize: "1rem", marginBottom: "0.5rem", color: "#60a5fa" }}>{mod.id}</h3>
                      {mod.specTitle && <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: "0.5rem" }}>{mod.specTitle}</p>}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", fontSize: "0.75rem" }}>
                        {mat?.maturity && (
                          <span style={{ background: "#374151", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                            <Activity size={12} style={{ display: "inline", marginRight: "4px" }}/> 
                            {mat.maturity}
                          </span>
                        )}
                        {mod.specStatus && (
                          <span style={{ background: "#374151", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                            {mod.specStatus}
                          </span>
                        )}
                        {mod.adrCount > 0 && (
                          <span style={{ background: "#047857", padding: "0.1rem 0.4rem", borderRadius: "4px", color: "#a7f3d0" }}>
                            {mod.adrCount} ADRs
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </article>
    </section>
  );
}

