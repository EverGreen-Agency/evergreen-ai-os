import { useState } from "react";
import { Plus, Info } from "lucide-react";
import { useUpdateTask } from "../../hooks/useBiomaApi";
import type { TaskSummary, TaskGroupStatus, Discipline, TaskListType } from "../../lib/api";
import { statusesForFrente, groupForStatus, getMacroGroupTooltip } from "../../lib/task-frentes";
import { TaskCard } from "./TaskCard";
import { TaskDrawer } from "./TaskDrawer";

type TaskBoardProps = {
  workspaceId: string;
  tasks: TaskSummary[];
  discipline?: Discipline | string;
  taskFilter?: (task: TaskSummary) => boolean;
  listId?: string;
};

const MACRO_COLUMNS: { id: string; group: TaskGroupStatus; label: string }[] = [
  { id: "NOT_STARTED", group: "NOT_STARTED", label: "A fazer" },
  { id: "ACTIVE", group: "ACTIVE", label: "Em progresso" },
  { id: "DONE", group: "DONE", label: "Concluído" },
  { id: "CLOSED", group: "CLOSED", label: "Finalizado" },
];

export function TaskBoard({ workspaceId, tasks: allTasks, discipline, taskFilter, listId }: TaskBoardProps) {
  const tasks = taskFilter ? allTasks.filter(taskFilter) : allTasks;
  const updateTask = useUpdateTask();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [initialStatusForNew, setInitialStatusForNew] = useState<TaskGroupStatus>("NOT_STARTED");
  const [initialDetailedStatus, setInitialDetailedStatus] = useState<string | undefined>(undefined);

  // Deriva colunas detalhadas quando há disciplina selecionada
  const frenteType = (discipline || undefined) as TaskListType | undefined;
  const detailedStatuses = frenteType ? statusesForFrente(frenteType) : null;

  const boardColumns = detailedStatuses
    ? detailedStatuses.map((s) => ({
        id: s.status,
        group: s.group,
        label: s.status,
      }))
    : MACRO_COLUMNS;

  const handleStatusChange = (taskId: string, targetColId: string) => {
    // Se a coluna for uma das macro (NOT_STARTED, ACTIVE, etc.)
    if (MACRO_COLUMNS.some((m) => m.id === targetColId)) {
      updateTask.mutate({ taskId, payload: { group_status: targetColId as TaskGroupStatus } });
      return;
    }
    // Caso seja status detalhado de uma disciplina
    const group = groupForStatus(frenteType, targetColId) ?? "ACTIVE";
    updateTask.mutate({
      taskId,
      payload: { status: targetColId, group_status: group },
    });
  };

  return (
    <div className="task-board" style={{ display: "flex", gap: 16, overflowX: "auto", padding: "16px 0", height: "100%", alignItems: "flex-start" }}>
      {boardColumns.map((col) => {
        const colTasks = tasks.filter((t) => {
          if (detailedStatuses) {
            const taskStatusNorm = (t.status || "").trim().toLowerCase();
            const colStatusNorm = col.id.toLowerCase();
            if (taskStatusNorm === colStatusNorm) return true;
            // Se a tarefa não tem status detalhado, agrupa pelo grupo Kanban correspondente
            if (!t.status && t.group_status === col.group && col.id === detailedStatuses.find((ds) => ds.group === t.group_status)?.status) {
              return true;
            }
            return false;
          }
          return t.group_status === col.group;
        });

        return (
          <div key={col.id} className="task-column" style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12, background: "var(--surface-sunken)", padding: 12, borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 13, margin: 0, fontWeight: 600, color: "var(--text-normal)", display: "flex", alignItems: "center", gap: 6 }}>
                {col.label} <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>{colTasks.length}</span>
                {!detailedStatuses && (
                  <span title={getMacroGroupTooltip(col.group)} style={{ display: "flex", alignItems: "center" }}>
                    <Info size={14} style={{ color: "var(--text-faint)", cursor: "help" }} />
                  </span>
                )}
              </h3>
              <button
                className="icon-button"
                type="button"
                onClick={() => {
                  setInitialStatusForNew(col.group);
                  setInitialDetailedStatus(detailedStatuses ? col.id : undefined);
                  setIsCreating(true);
                }}
              >
                <Plus size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 100 }}>
              {colTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => setSelectedTaskId(task.id)}
                  onStatusChange={(newStatus) => handleStatusChange(task.id, newStatus)}
                  columns={boardColumns}
                />
              ))}
            </div>
          </div>
        );
      })}

      {(selectedTaskId || isCreating) && (
        <TaskDrawer
          workspaceId={workspaceId}
          discipline={discipline as Discipline | undefined}
          listId={listId}
          taskId={selectedTaskId}
          initialStatus={initialStatusForNew}
          initialDetailedStatus={initialDetailedStatus}
          onClose={() => {
            setSelectedTaskId(null);
            setIsCreating(false);
            setInitialDetailedStatus(undefined);
          }}
        />
      )}
    </div>
  );
}
