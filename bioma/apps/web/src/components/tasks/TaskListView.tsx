import { useState } from "react";
import { useTasksInList, useUpdateTask } from "../../hooks/useBiomaApi";
import { EmptyState } from "../shared";
import { TaskDrawer } from "./TaskDrawer";
import { formatDueDate } from "../../lib/format";
import type { TaskListType } from "../../lib/api";
import { CheckSquare, Circle, Plus } from "lucide-react";

type TaskListViewProps = {
  listId: string;
  listType?: TaskListType;
  workspaceId?: string;
};

export function TaskListView({ listId, listType, workspaceId }: TaskListViewProps) {
  const { data: tasks, isLoading } = useTasksInList(listId);
  const updateTask = useUpdateTask();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  // Criar tarefa existia só no Kanban; a lista e o calendário eram somente
  // leitura, obrigando a trocar de visão só para adicionar algo.
  const [isCreating, setIsCreating] = useState(false);

  if (isLoading) {
    return <EmptyState text="Carregando tarefas..." />;
  }

  const newTaskButton = (
    <button
      className="mini-button"
      type="button"
      onClick={() => setIsCreating(true)}
      style={{ width: "fit-content" }}
    >
      <Plus size={13} /> Nova tarefa
    </button>
  );

  if (!tasks || tasks.length === 0) {
    return (
      <>
        <EmptyState text="Nenhuma tarefa encontrada." />
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>{newTaskButton}</div>
        {isCreating && (
          <TaskDrawer listId={listId}
          listType={listType}
          workspaceId={workspaceId} taskId={null} onClose={() => setIsCreating(false)} />
        )}
      </>
    );
  }

  // Ordenar: ativos primeiro, depois feitos
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.group_status === "DONE" && b.group_status !== "DONE") return 1;
    if (a.group_status !== "DONE" && b.group_status === "DONE") return -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <>
      <div className="surface" style={{ borderRadius: 6, border: "1px solid var(--border-color)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "var(--surface-sunken)", borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
            <tr>
              <th style={{ padding: "12px 16px", width: 40 }}></th>
              <th style={{ padding: "12px 16px" }}>Nome</th>
              <th style={{ padding: "12px 16px", width: 150 }}>Status</th>
              <th style={{ padding: "12px 16px", width: 120 }}>Prioridade</th>
              <th style={{ padding: "12px 16px", width: 150 }}>Área / Missão</th>
              <th style={{ padding: "12px 16px", width: 120 }}>Esforço</th>
              <th style={{ padding: "12px 16px", width: 120 }}>Vencimento</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map(task => {
              const isDone = task.group_status === "DONE" || task.group_status === "CLOSED";
              
              const area = task.custom_fields?.find(f => f.field_name === "Área do Projeto")?.field_value 
                        || task.custom_fields?.find(f => f.field_name === "Missão")?.field_value 
                        || "-";
                        
              const effort = task.custom_fields?.find(f => f.field_name === "Esforço")?.field_value || "-";

              return (
                <tr 
                  key={task.id} 
                  style={{ 
                    borderBottom: "1px solid var(--border-color)", 
                    cursor: "pointer",
                    background: isDone ? "var(--surface-sunken)" : "transparent",
                    opacity: isDone ? 0.7 : 1
                  }}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <td style={{ padding: "12px 16px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                    <button 
                      className="icon-button" 
                      style={{ padding: 4 }}
                      disabled={task.external_source === "clickup"}
                      title={task.external_source === "clickup" ? "Registro legado importado; duplique como tarefa nativa para editar." : undefined}
                      onClick={() => {
                        updateTask.mutate({ 
                          taskId: task.id, 
                          payload: { group_status: isDone ? "ACTIVE" : "DONE" } 
                        });
                      }}
                    >
                      {isDone ? <CheckSquare size={16} color="var(--primary-color)" /> : <Circle size={16} color="var(--text-dim)" />}
                    </button>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 500, textDecoration: isDone ? "line-through" : "none" }}>
                    {task.title}
                    {task.external_source === "clickup" && <small style={{ display: "block", color: "var(--text-faint)" }}>Legado importado · somente leitura</small>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, background: "rgba(0,0,0,0.05)", border: "1px solid var(--border-color)" }}>
                      {task.status || task.group_status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {task.priority || "-"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-dim)" }}>
                    {area}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-dim)" }}>
                    {effort}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-dim)" }}>
                    {task.due_date ? formatDueDate(task.due_date) : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: 12 }}>{newTaskButton}</div>

      {(selectedTaskId || isCreating) && (
        <TaskDrawer
          listId={listId}
          listType={listType}
          workspaceId={workspaceId}
          taskId={selectedTaskId}
          onClose={() => {
            setSelectedTaskId(null);
            setIsCreating(false);
          }}
        />
      )}
    </>
  );
}
