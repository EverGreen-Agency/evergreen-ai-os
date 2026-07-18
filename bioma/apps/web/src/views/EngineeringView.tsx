import { useEffect, useState } from "react";
import { SectionHeader, EmptyState } from "../components/shared";
import { FileText, ArrowRight, Activity, Calendar, X, Terminal, BookOpen, CheckSquare, Layers, Search } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


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

  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"spec" | "adrs" | "tasks">("spec");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!selectedModule) {
      setDetailData(null);
      setActiveTab("spec");
      return;
    }
    setDetailLoading(true);
    fetch(`/api/engineering/${selectedModule}`, { credentials: "include" })
      .then(res => res.json())
      .then(setDetailData)
      .catch(console.error)
      .finally(() => setDetailLoading(false));
  }, [selectedModule]);

  if (loading) return <div className="loading-state">Carregando módulos...</div>;
  if (error) return <div className="error-state">Erro: {error}</div>;
  if (!data || data.modules.length === 0) return <EmptyState text="Nenhum módulo de engenharia encontrado." />;

  const filteredModules = search 
    ? data.modules.filter(m => m.id.toLowerCase().includes(search.toLowerCase()) || m.specTitle?.toLowerCase().includes(search.toLowerCase()))
    : data.modules;

  const groups = new Map<string, Array<{ mod: EngineeringModule; mat?: ModuleMaturity }>>();
  for (const mod of filteredModules) {
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SectionHeader eyebrow="Engenharia" title="Módulos de Engenharia" icon={FileText} />
          <div style={{ position: "relative", width: "300px" }}>
            <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
            <input 
              type="text" 
              placeholder="Buscar por módulo ou título..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 1rem 0.5rem 2.2rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--text)", fontSize: "0.9rem", outline: "none" }}
            />
          </div>
        </div>
        
        {orderedPhases.length === 0 ? (
          <EmptyState text="Nenhum módulo encontrado para a sua busca." />
        ) : (
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
                      onClick={() => setSelectedModule(mod.id)}
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
        )}
      </article>

      {selectedModule && (
        <div className="modal-backdrop" onClick={() => setSelectedModule(null)} style={{ padding: '2rem' }}>
          <div className="modal-content" style={{ maxWidth: '1000px', width: '100%', height: '85vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--background)' }} onClick={e => e.stopPropagation()}>
            
            {/* Header Sticky */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(96, 165, 250, 0.1)', borderRadius: '8px', color: '#60a5fa' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontFamily: 'monospace', color: '#e5e7eb', margin: 0 }}>{selectedModule}</h2>
                  <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Detalhes do Módulo de Engenharia</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedModule(null)}
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '0.5rem', borderRadius: '4px', display: 'flex' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
              >
                <X size={20} />
              </button>
            </div>
            
            {detailLoading ? (
              <div className="loading-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Carregando documentos...
              </div>
            ) : detailData ? (
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* Sidebar com Abas */}
                <div style={{ width: '220px', borderRight: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', padding: '1rem 0', flexShrink: 0 }}>
                  <button 
                    onClick={() => setActiveTab('spec')}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem', 
                      background: activeTab === 'spec' ? 'rgba(255,255,255,0.05)' : 'transparent',
                      border: 'none', color: activeTab === 'spec' ? '#fff' : '#9ca3af',
                      borderRight: activeTab === 'spec' ? '3px solid #a78bfa' : '3px solid transparent',
                      cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', fontWeight: activeTab === 'spec' ? 600 : 400,
                      outline: 'none'
                    }}
                  >
                    <BookOpen size={16} color={activeTab === 'spec' ? '#a78bfa' : '#9ca3af'} />
                    Especificação
                  </button>
                  <button 
                    onClick={() => setActiveTab('adrs')}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', 
                      background: activeTab === 'adrs' ? 'rgba(255,255,255,0.05)' : 'transparent',
                      border: 'none', color: activeTab === 'adrs' ? '#fff' : '#9ca3af',
                      borderRight: activeTab === 'adrs' ? '3px solid #34d399' : '3px solid transparent',
                      cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', fontWeight: activeTab === 'adrs' ? 600 : 400,
                      outline: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Terminal size={16} color={activeTab === 'adrs' ? '#34d399' : '#9ca3af'} />
                      ADRs
                    </div>
                    {detailData.adrs && detailData.adrs.length > 0 && (
                      <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                        {detailData.adrs.length}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => setActiveTab('tasks')}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem', 
                      background: activeTab === 'tasks' ? 'rgba(255,255,255,0.05)' : 'transparent',
                      border: 'none', color: activeTab === 'tasks' ? '#fff' : '#9ca3af',
                      borderRight: activeTab === 'tasks' ? '3px solid #fb923c' : '3px solid transparent',
                      cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', fontWeight: activeTab === 'tasks' ? 600 : 400,
                      outline: 'none'
                    }}
                  >
                    <CheckSquare size={16} color={activeTab === 'tasks' ? '#fb923c' : '#9ca3af'} />
                    Tarefas
                  </button>
                </div>

                {/* Conteúdo Principal (Scrollable) */}
                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: 'var(--background)' }}>
                  {activeTab === 'spec' && (
                    detailData.specContent ? (
                      <div className="prose-content" style={{ padding: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#d1d5db', lineHeight: 1.6 }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {detailData.specContent}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <EmptyState text="Nenhuma especificação (spec.md) definida para este módulo." />
                    )
                  )}

                  {activeTab === 'adrs' && (
                    detailData.adrs && detailData.adrs.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {detailData.adrs.map((adr: any) => (
                          <details key={adr.file} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#34d399', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', outline: 'none' }}>
                              {adr.file}: {adr.title}
                            </summary>
                            <div className="prose-content" style={{ borderTop: '1px solid var(--border)', padding: '1.5rem', background: 'transparent', color: '#d1d5db', lineHeight: 1.6 }}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {adr.content}
                              </ReactMarkdown>
                            </div>
                          </details>
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="Nenhuma ADR documentada para este módulo." />
                    )
                  )}

                  {activeTab === 'tasks' && (
                    detailData.tasksContent ? (
                      <div className="prose-content" style={{ padding: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#d1d5db', lineHeight: 1.6 }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {detailData.tasksContent}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <EmptyState text="Nenhum plano de tarefas (tasks.md) definido para este módulo." />
                    )
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                Erro ao carregar detalhes do módulo.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

