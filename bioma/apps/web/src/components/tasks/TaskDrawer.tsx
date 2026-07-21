import { useState, useEffect } from "react";
import { X, Save, Trash2 } from "lucide-react";
import { useCreateTask, useUpdateTask, useDeleteTask, useTasksInList, useTaskLists } from "../../hooks/useBiomaApi";
import type { TaskSummary, TaskGroupStatus, TaskPriority, TaskCustomField } from "../../lib/api";

type TaskDrawerProps = {
  listId: string;
  taskId: string | null;
  initialStatus?: TaskGroupStatus;
  onClose: () => void;
};

// Configurações baseadas nos manuais operacionais
const GROWTH_STATUSES = ["BRAIN", "BACKLOG", "IN PROGRESS", "IN REVIEW", "REJECTED", "BLOCKED", "DONE", "CLOSED"];
const SOCIAL_STATUSES = ["IDEAÇÃO", "ROTEIRIZAÇÃO", "EM PRODUÇÃO", "REVISÃO INTERNA", "APROVAÇÃO CLIENTE", "EM AJUSTE", "AGENDADO", "PUBLICADO", "ANALISAR", "DESCARTADO", "FINALIZADO"];

export function TaskDrawer({ listId, taskId, initialStatus, onClose }: TaskDrawerProps) {
  const { data: tasks } = useTasksInList(listId);
  const { data: lists } = useTaskLists("all"); // To check if list is Growth or Social. Or we can just use the name if available, actually useTaskLists requires workspaceId. Let's just pass list name or get it from a query.
  // We'll fetch the lists in a parent or just match by name if we can't easily get it here. 
  // Actually, we can fetch all tasks in the list, but we need the list type to know which fields to show.
  // For now we'll just check if the list name contains "Growth" or "Social".
  
  const existingTask = taskId ? tasks?.find(t => t.id === taskId) : null;
  
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [groupStatus, setGroupStatus] = useState<TaskGroupStatus>("NOT_STARTED");
  const [specificStatus, setSpecificStatus] = useState("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setDescription(existingTask.description || "");
      setGroupStatus(existingTask.group_status);
      setSpecificStatus(existingTask.status);
      setPriority(existingTask.priority || "");
      
      const fields: Record<string, string> = {};
      existingTask.custom_fields?.forEach(f => {
        fields[f.field_name] = f.field_value;
      });
      setCustomFields(fields);
    } else {
      setTitle("");
      setDescription("");
      setGroupStatus(initialStatus || "NOT_STARTED");
      setSpecificStatus("");
      setPriority("");
      setCustomFields({});
    }
  }, [existingTask, initialStatus]);

  const handleSave = () => {
    if (!title) return;
    
    const formattedFields: TaskCustomField[] = Object.entries(customFields).map(([k, v]) => ({
      field_name: k,
      field_value: v
    }));
    
    if (taskId) {
      updateTask.mutate({
        taskId,
        payload: {
          title,
          description,
          group_status: groupStatus,
          status: specificStatus || "pending",
          priority: priority || null,
          custom_fields: formattedFields
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
          custom_fields: formattedFields,
          dependencies: []
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
          position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: 500,
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
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Título</span>
            <input 
              className="text-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Definir personas"
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
                placeholder="Ex: IN REVIEW"
                disabled={isBusy}
              />
              <datalist id="status-options">
                {GROWTH_STATUSES.map(s => <option key={s} value={s} />)}
                {SOCIAL_STATUSES.map(s => <option key={s} value={s} />)}
              </datalist>
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
          
          <div style={{ background: "var(--surface-sunken)", padding: 12, borderRadius: 6, display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>Campos Personalizados</h3>
            
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
            
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Arquivo Final</span>
              <input type="text" className="text-input" placeholder="URL da mídia final" value={customFields["Arquivo Final"] || ""} onChange={e => updateField("Arquivo Final", e.target.value)} />
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Descrição / Copy</span>
            <textarea 
              className="text-input"
              style={{ minHeight: 120, resize: "vertical" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes ou roteiro da tarefa..."
              disabled={isBusy}
            />
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
          {taskId ? (
            <button className="danger-button" type="button" onClick={handleDelete} disabled={isBusy}>
              <Trash2 size={16} /> Excluir
            </button>
          ) : <div></div>}
          
          <div style={{ display: "flex", gap: 12 }}>
            <button className="secondary-button" type="button" onClick={onClose} disabled={isBusy}>
              Cancelar
            </button>
            <button className="primary-button" type="button" onClick={handleSave} disabled={isBusy || !title}>
              <Save size={16} /> Salvar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
