import { useState } from "react";
import { Archive, Bot, Brain, History, Save, User as UserIcon } from "lucide-react";

import {
  useAgentMemories,
  useAgentMemoryRevisions,
  useCreateAgentMemory,
  useSetAgentMemoryStatus,
  useUpdateAgentMemory,
} from "../hooks/useBiomaApi";
import type { AgentMemory, AgentMemoryCategory } from "../lib/api";

const CATEGORY_LABELS: Record<AgentMemoryCategory, string> = {
  identity: "Identidade",
  fact: "Fato",
  preference: "Preferência",
  directive: "Diretiva",
};

/**
 * Memória persistente do copiloto — por workspace (workspaceId preenchido) ou
 * global da EG (workspaceId=null). Toda escrita exige motivo e vira revisão
 * auditável; memória escrita pelo copiloto aparece com o selo de agente, nunca
 * se disfarça de anotação humana.
 */
export function AgentMemoryPanel({
  workspaceId,
  title,
  description,
}: {
  workspaceId: string | null;
  title: string;
  description: string;
}) {
  const { data: memories = [], isLoading } = useAgentMemories(workspaceId, false);
  const createMemory = useCreateAgentMemory();
  const updateMemory = useUpdateAgentMemory();
  const setStatus = useSetAgentMemoryStatus();

  const [category, setCategory] = useState<AgentMemoryCategory>("fact");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleCreate() {
    if (!newTitle.trim() || !newBody.trim()) return;
    createMemory.mutate(
      { workspace_id: workspaceId, category, title: newTitle.trim(), body: newBody.trim(), reason: "Criado manualmente pelo time EG." },
      { onSuccess: () => { setNewTitle(""); setNewBody(""); } },
    );
  }

  return (
    <article className="surface">
      <div className="surface-header">
        <Brain size={18} />
        <h3>{title}</h3>
      </div>
      <div style={{ padding: "0 20px 20px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 14 }}>{description}</p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16 }}>
          <label style={{ fontSize: 12 }}>
            Categoria
            <select value={category} onChange={(e) => setCategory(e.target.value as AgentMemoryCategory)}>
              {(Object.keys(CATEGORY_LABELS) as AgentMemoryCategory[]).map((key) => (
                <option key={key} value={key}>{CATEGORY_LABELS[key]}</option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 12, flex: "1 1 180px" }}>
            Título
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Cliente prefere reunião às sextas" />
          </label>
          <label style={{ fontSize: 12, flex: "2 1 260px" }}>
            Conteúdo
            <input value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="O fato, preferência ou diretiva em si" />
          </label>
          <button type="button" className="primary" disabled={createMemory.isPending || !newTitle.trim() || !newBody.trim()} onClick={handleCreate}>
            <Save size={14} /> Guardar
          </button>
        </div>

        {isLoading && <p style={{ color: "var(--text-muted)" }}>Carregando memória...</p>}
        {!isLoading && memories.length === 0 && <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Nenhuma memória guardada ainda.</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {memories.map((memory) => (
            <MemoryRow
              key={memory.id}
              memory={memory}
              expanded={expandedId === memory.id}
              onToggle={() => setExpandedId(expandedId === memory.id ? null : memory.id)}
              onArchive={() => setStatus.mutate({ memoryId: memory.id, status: "archived", reason: "Arquivada manualmente pelo time EG." })}
              onUpdate={(body) => updateMemory.mutate({ memoryId: memory.id, body, reason: "Editado manualmente pelo time EG." })}
              busy={setStatus.isPending || updateMemory.isPending}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

function MemoryRow({
  memory,
  expanded,
  onToggle,
  onArchive,
  onUpdate,
  busy,
}: {
  memory: AgentMemory;
  expanded: boolean;
  onToggle: () => void;
  onArchive: () => void;
  onUpdate: (body: string) => void;
  busy: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memory.body);
  const { data: revisions = [] } = useAgentMemoryRevisions(expanded ? memory.id : null);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, textTransform: "uppercase", color: "var(--text-dim)", fontWeight: 600 }}>
          {CATEGORY_LABELS[memory.category]}
        </span>
        <strong style={{ flex: 1 }}>{memory.title}</strong>
        <span
          title={memory.authored_by ? "Escrito por uma pessoa da EG" : "Escrito pelo copiloto"}
          style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: memory.authored_by ? "var(--text-dim)" : "var(--accent)" }}
        >
          {memory.authored_by ? <UserIcon size={12} /> : <Bot size={12} />}
          {memory.authored_by ? "humano" : "agente"}
        </span>
        <button type="button" className="icon-button" title="Histórico de revisões" onClick={onToggle}>
          <History size={13} />
        </button>
        <button type="button" className="icon-button" title="Arquivar" disabled={busy} onClick={onArchive}>
          <Archive size={13} />
        </button>
      </div>

      {editing ? (
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} style={{ flex: 1, fontSize: 13 }} />
          <button
            type="button"
            className="mini-button"
            disabled={busy || !draft.trim()}
            onClick={() => { onUpdate(draft.trim()); setEditing(false); }}
          >
            Salvar
          </button>
        </div>
      ) : (
        <p style={{ margin: "6px 0 0", fontSize: 13, cursor: "text" }} onClick={() => setEditing(true)} title="Clique para editar">
          {memory.body}
        </p>
      )}

      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px dashed var(--border)", fontSize: 11 }}>
          {revisions.length === 0 && <span style={{ color: "var(--text-dim)" }}>Sem revisões ainda.</span>}
          {revisions.map((revision) => (
            <div key={revision.id} style={{ marginBottom: 6, color: "var(--text-muted)" }}>
              <strong>{revision.action}</strong> em {new Date(revision.created_at).toLocaleString("pt-BR")}
              {" — "}
              {revision.actor_user_id ? "por um humano" : "pelo copiloto"}
              {revision.reason ? `: ${revision.reason}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
