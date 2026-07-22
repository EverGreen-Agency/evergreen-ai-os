import { useState, useEffect } from "react";
import { X, Save, Trash2, Plus, CheckSquare, Square, Link2, Repeat } from "lucide-react";
import { useCreateTask, useUpdateTask, useDeleteTask, useTasksInList } from "../../hooks/useBiomaApi";
import type { TaskDependency, TaskGroupStatus, TaskPriority, TaskCustomField, TaskSubtaskInput } from "../../lib/api";

type TaskDrawerProps = {
  listId: string;
  taskId: string | null;
  initialStatus?: TaskGroupStatus;
  onClose: () => void;
};

const GROWTH_STATUSES = ["BRAIN", "BACKLOG", "IN PROGRESS", "IN REVIEW", "REJECTED", "BLOCKED", "DONE", "CLOSED"];
const SOCIAL_STATUSES = ["IDEAÇÃO", "ROTEIRIZAÇÃO", "EM PRODUÇÃO", "REVISÃO INTERNA", "APROVAÇÃO CLIENTE", "EM AJUSTE", "AGENDADO", "PUBLICADO", "ANALISAR", "DESCARTADO", "FINALIZADO"];

export function TaskDrawer({ listId, taskId, initialStatus, onClose }: TaskDrawerProps) {
  const { data: tasks } = useTasksInList(listId);
  const existingTask = taskId ? tasks?.find(t => t.id === taskId) : null;
  const readOnlyProjection = existingTask?.external_source === "clickup";
  
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [groupStatus, setGroupStatus] = useState<TaskGroupStatus>("NOT_STARTED");
  const [specificStatus, setSpecificStatus] = useState("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [dueDate, setDueDate] = useState("");
  const [recurrence, setRecurrence] = useState<"none" | "weekly" | "monthly">("none");
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [subtasks, setSubtasks] = useState<TaskSubtaskInput[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [waitingOnTaskId, setWaitingOnTaskId] = useState<string>("");

  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setDescription(existingTask.description || "");
      setGroupStatus(existingTask.group_status);
      setSpecificStatus(existingTask.status);
      setPriority(existingTask.priority || "");
      setDueDate(existingTask.due_date ? existingTask.due_date.split("T")[0] : "");
      setRecurrence(existingTask.recurrence || "none");
      
      const fields: Record<string, string> = {};
      existingTask.custom_fields?.forEach(f => {
        fields[f.field_name] = f.field_value;
      });
      setCustomFields(fields);

      setSubtasks(existingTask.subtasks || []);
      setWaitingOnTaskId(existingTask.dependencies?.[0]?.depends_on_task_id || "");
    } else {
      setTitle("");
      setDescription("");
      setGroupStatus(initialStatus || "NOT_STARTED");
      setSpecificStatus("");
      setPriority("");
      setDueDate("");
      setRecurrence("none");
      setCustomFields({});
      setSubtasks([]);
      setWaitingOnTaskId("");
    }
  }, [existingTask, initialStatus]);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks(prev => [...prev, { title: newSubtaskTitle.trim(), is_completed: false }]);
    setNewSubtaskTitle("");
  };

  const handleToggleSubtask = (index: number) => {
    setSubtasks(prev => prev.map((st, i) => i === index ? { ...st, is_completed: !st.is_completed } : st));
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!title) return;
    
    const formattedFields: TaskCustomField[] = Object.entries(customFields).map(([k, v]) => ({
      field_name: k,
      field_value: v
    }));

    const dependencies: TaskDependency[] = waitingOnTaskId
      ? [{ depends_on_task_id: waitingOnTaskId, type: "waiting_on" }]
      : [];
    
    if (taskId) {
      updateTask.mutate({
        taskId,
        payload: {
          title,
          description,
          group_status: groupStatus,
          status: specificStatus || "pending",
          priority: priority || null,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          recurrence,
          custom_fields: formattedFields,
          dependencies,
          subtasks,
        }
      }, {
        onSuccess: onClose
      });
    } else {
      createTask.mutate({
        listId,
        payload: {
          title,
          description,
          status: specificStatus || "pending",
          group_status: groupStatus,
          priority: priority || null,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          recurrence,
          custom_fields: formattedFields,
          dependencies,
          subtasks,
        }
      }, {
        onSuccess: onClose
      });
    }
  };

  const handleDelete = () => {
    if (taskId && confirm("Tem certeza que deseja excluir esta tarefa?")) {
      deleteTask.mutate({ taskId, listId }, {
        onSuccess: onClose
      });
    }
  };

  const isBusy = createTask.isPending || updateTask.isPending || deleteTask.isPending;

  const updateField = (name: string, value: string) => {
    setCustomFields(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <div 
        className="drawer-overlay" 
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100 }} 
        onClick={onClose}
      />
      <div 
        className="drawer-content surface" 
        style={{ 
          position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: 520,
          zIndex: 101, padding: 24, display: "flex", flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.2)",
          overflowY: "auto"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{taskId ? "Editar Tarefa" : "Nova Tarefa"}</h2>
          <button className="icon-button" type="button" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
          {readOnlyProjection && (
            <div className="empty-state compact">
              Registro legado importado em modo somente leitura. Duplique-o como tarefa nativa para continuar o trabalho no Bioma.
            </div>
          )}
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Título</span>
            <input 
              className="text-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Definir personas da campanha"
              disabled={isBusy}
            />
          </label>
          
          <div style={{ display: "flex", gap: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Grupo (Kanban)</span>
              <select 
                className="text-input" 
                value={groupStatus}
                onChange={(e) => setGroupStatus(e.target.value as TaskGroupStatus)}
                disabled={isBusy}
              >
                <option value="NOT_STARTED">To Do</option>
                <option value="ACTIVE">In Progress</option>
                <option value="DONE">Done</option>
                <option value="CLOSED">Closed</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Status Detalhado</span>
              <input 
                className="text-input"
                list="status-options"
                value={specificStatus}
                onChange={(e) => setSpecificStatus(e.target.value)}
                placeholder="Ex: ROTEIRIZAÇÃO"
                disabled={isBusy}
              />
              <datalist id="status-options">
                {GROWTH_STATUSES.map(s => <option key={s} value={s} />)}
                {SOCIAL_STATUSES.map(s => <option key={s} value={s} />)}
              </datalist>
            </label>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Prioridade</span>
              <select 
                className="text-input" 
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority | "")}
                disabled={isBusy}
              >
                <option value="">Nenhuma</option>
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Data de Vencimento</span>
              <input 
                type="date"
                className="text-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isBusy}
              />
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
              <Repeat size={14} /> Recorrência Automática (Growth)
            </span>
            <select 
              className="text-input"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as "none" | "weekly" | "monthly")}
              disabled={isBusy}
            >
              <option value="none">Não recorrente (Única)</option>
              <option value="weekly">Semanal (Recria a cada 7 dias)</option>
              <option value="monthly">Mensal (Recria a cada 30 dias)</option>
            </select>
          </label>

          {/* Subtarefas / Checklists */}
          <div style={{ background: "var(--surface-sunken)", padding: 12, borderRadius: 6, display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Checklist de Subtarefas</h3>
            
            <div style={{ display: "flex", gap: 8 }}>
              <input 
                className="text-input" 
                placeholder="Adicionar item ao checklist..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSubtask(); } }}
                style={{ flex: 1, fontSize: 12 }}
              />
              <button className="secondary-button" type="button" onClick={handleAddSubtask} style={{ padding: "4px 10px" }}>
                <Plus size={14} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
              {subtasks.map((st, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-color)", padding: "6px 10px", borderRadius: 4, border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => handleToggleSubtask(i)}>
                    {st.is_completed ? <CheckSquare size={16} color="var(--primary-color)" /> : <Square size={16} color="var(--text-dim)" />}
                    <span style={{ fontSize: 13, textDecoration: st.is_completed ? "line-through" : "none", color: st.is_completed ? "var(--text-dim)" : "var(--text-normal)" }}>
                      {st.title}
                    </span>
                  </div>
                  <button className="icon-button danger" type="button" onClick={() => handleRemoveSubtask(i)} style={{ padding: 2 }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Relacionamento / Waiting On */}
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
              <Link2 size={14} /> Dependência (Aguardando Tarefa)
            </span>
            <select 
              className="text-input" 
              value={waitingOnTaskId}
              onChange={(e) => setWaitingOnTaskId(e.target.value)}
              disabled={isBusy}
            >
              <option value="">Nenhuma dependência (Livre)</option>
              {tasks?.filter(t => t.id !== taskId).map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.status || t.group_status})
                </option>
              ))}
            </select>
          </label>
          
          <div style={{ background: "var(--surface-sunken)", padding: 12, borderRadius: 6, display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Campos Personalizados (Custom Fields)</h3>
            
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Esforço</span>
              <select className="text-input" value={customFields["Esforço"] || ""} onChange={e => updateField("Esforço", e.target.value)}>
                <option value="">-</option>
                <option value="Baixo">Baixo (horas)</option>
                <option value="Médio">Médio (dias)</option>
                <option value="Alto">Alto (semanas)</option>
              </select>
            </label>
            
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Área do Projeto</span>
              <select className="text-input" value={customFields["Área do Projeto"] || ""} onChange={e => updateField("Área do Projeto", e.target.value)}>
                <option value="">-</option>
                <option value="Tráfego">Tráfego</option>
                <option value="CRM">CRM</option>
                <option value="Web/Landing Page">Web/Landing Page</option>
                <option value="Automação">Automação</option>
              </select>
            </label>
            
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Missão (Social)</span>
              <select className="text-input" value={customFields["Missão"] || ""} onChange={e => updateField("Missão", e.target.value)}>
                <option value="">-</option>
                <option value="Atrair">Atrair</option>
                <option value="Nutrir">Nutrir</option>
                <option value="Posicionar">Posicionar</option>
                <option value="Converter">Converter</option>
              </select>
            </label>
            
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Verba / Budget</span>
              <input type="text" className="text-input" placeholder="R$ 0,00" value={customFields["Verba"] || ""} onChange={e => updateField("Verba", e.target.value)} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Link do Doc</span>
              <input type="url" className="text-input" placeholder="https://" value={customFields["Link do Doc"] || ""} onChange={e => updateField("Link do Doc", e.target.value)} />
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Descrição / Copy</span>
            <textarea 
              className="text-input"
              style={{ minHeight: 100, resize: "vertical" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes ou roteiro da tarefa..."
              disabled={isBusy}
            />
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
          {taskId ? (
            <button className="danger-button" type="button" onClick={handleDelete} disabled={isBusy || readOnlyProjection}>
              <Trash2 size={16} /> Excluir
            </button>
          ) : <div></div>}
          
          <div style={{ display: "flex", gap: 12 }}>
            <button className="secondary-button" type="button" onClick={onClose} disabled={isBusy}>
              Cancelar
            </button>
            <button className="primary-button" type="button" onClick={handleSave} disabled={isBusy || !title || readOnlyProjection}>
              <Save size={16} /> Salvar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
