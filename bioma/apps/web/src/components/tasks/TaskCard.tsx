import type { TaskSummary, TaskGroupStatus } from "../../lib/api";
import { formatDueDate } from "../../lib/format";

type TaskCardProps = {
  task: TaskSummary;
  onClick: () => void;
  onStatusChange: (status: TaskGroupStatus) => void;
  columns: { id: TaskGroupStatus; label: string }[];
};

export function TaskCard({ task, onClick, onStatusChange, columns }: TaskCardProps) {
  return (
    <div 
      className="surface task-card" 
      style={{ 
        padding: 12, 
        borderRadius: 6, 
        cursor: "pointer", 
        border: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: "var(--surface-color)",
        transition: "border-color 0.2s ease"
      }}
      onClick={onClick}
    >
      <div style={{ fontWeight: 500, fontSize: 14 }}>{task.title}</div>
      {task.description && (
        <div style={{ fontSize: 12, color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {task.description}
        </div>
      )}
      
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
        {task.external_source === "clickup" && (
          <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "var(--surface-sunken)", border: "1px solid var(--border-color)", color: "var(--text-dim)" }}>
            Legado importado · somente leitura
          </span>
        )}
        {task.recurrence && task.recurrence !== "none" && (
          <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(0,0,0,0.05)", border: "1px solid var(--border-color)", color: "var(--brand-accent)" }} title={`Recorrência: ${task.recurrence}`}>
            🔄 {task.recurrence === "weekly" ? "Semanal" : "Mensal"}
          </span>
        )}
        {task.subtasks && task.subtasks.length > 0 && (
          <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(0,0,0,0.05)", border: "1px solid var(--border-color)", color: "var(--text-normal)" }}>
            ☑️ {task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length}
          </span>
        )}
        {task.custom_fields?.filter(f => ["Área do Projeto", "Esforço", "Missão", "Plataforma"].includes(f.field_name) && f.field_value).map(f => (
          <span key={f.field_name} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(0,0,0,0.05)", border: "1px solid var(--border-color)", color: "var(--text-normal)" }}>
            {f.field_name === "Esforço" ? "⏱️ " : ""}{f.field_value}
          </span>
        ))}
      </div>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {task.priority && (
            <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "var(--surface-sunken)", color: "var(--text-dim)" }}>
              {task.priority}
            </span>
          )}
          {task.due_date && (
            <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
              {formatDueDate(task.due_date)}
            </span>
          )}
        </div>
        
        <select 
          value={task.group_status}
          disabled={task.external_source === "clickup"}
          onChange={(e) => {
            e.stopPropagation();
            onStatusChange(e.target.value as TaskGroupStatus);
          }}
          onClick={(e) => e.stopPropagation()}
          style={{ 
            fontSize: 11, 
            padding: "2px 4px", 
            background: "transparent", 
            border: "none", 
            color: "var(--text-dim)",
            cursor: task.external_source === "clickup" ? "not-allowed" : "pointer"
          }}
        >
          {columns.map(c => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
