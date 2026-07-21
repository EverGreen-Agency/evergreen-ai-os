import { useState } from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { useTasksInList, useUpdateTask } from "../../hooks/useBiomaApi";
import type { TaskSummary, TaskGroupStatus } from "../../lib/api";
import { TaskCard } from "./TaskCard";
import { TaskDrawer } from "./TaskDrawer";

type TaskBoardProps = {
  listId: string;
};

const COLUMNS: { id: TaskGroupStatus; label: string }[] = [
  { id: "NOT_STARTED", label: "To Do" },
  { id: "ACTIVE", label: "In Progress" },
  { id: "DONE", label: "Done" },
  { id: "CLOSED", label: "Closed" },
];

export function TaskBoard({ listId }: TaskBoardProps) {
  const { data: tasks, isLoading } = useTasksInList(listId);
  const updateTask = useUpdateTask();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [initialStatusForNew, setInitialStatusForNew] = useState<TaskGroupStatus>("NOT_STARTED");

  if (isLoading) return <div className="loading-state">Carregando tarefas...</div>;

  const handleStatusChange = (taskId: string, newStatus: TaskGroupStatus) => {
    updateTask.mutate({ taskId, payload: { group_status: newStatus } });
  };

  return (
    <div className="task-board" style={{ display: "flex", gap: 16, overflowX: "auto", padding: "16px 0", height: "100%", alignItems: "flex-start" }}>
      {COLUMNS.map((col) => {
        const colTasks = tasks?.filter((t) => t.group_status === col.id) || [];
        
        return (
          <div key={col.id} className="task-column" style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12, background: "var(--surface-sunken)", padding: 12, borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 14, margin: 0, color: "var(--text-normal)" }}>{col.label} <span style={{ color: "var(--text-faint)", marginLeft: 6 }}>{colTasks.length}</span></h3>
              <button className="icon-button" type="button" onClick={() => {
                setInitialStatusForNew(col.id);
                setIsCreating(true);
              }}>
                <Plus size={16} />
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 100 }}>
              {colTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onClick={() => setSelectedTaskId(task.id)} 
                  onStatusChange={(status) => handleStatusChange(task.id, status)}
                  columns={COLUMNS}
                />
              ))}
            </div>
          </div>
        );
      })}

      {(selectedTaskId || isCreating) && (
        <TaskDrawer 
          listId={listId}
          taskId={selectedTaskId}
          initialStatus={initialStatusForNew}
          onClose={() => {
            setSelectedTaskId(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}
