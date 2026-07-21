import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTaskLists, useCreateTaskList, useTasksInList } from "../hooks/useBiomaApi";
import { TaskBoard } from "../components/tasks/TaskBoard";
import { TaskListView } from "../components/tasks/TaskListView";
import { EmptyState, SectionHeader } from "../components/shared";
import { LayoutDashboard, Kanban, List } from "lucide-react";

type TasksViewProps = {
  workspaceId: string;
};

export function TasksView({ workspaceId }: TasksViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: lists, isLoading } = useTaskLists(workspaceId);
  const createList = useCreateTaskList();
  
  const activeListId = searchParams.get("list");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");

  // Se não tiver lista selecionada mas existirem listas, pega a primeira
  useEffect(() => {
    if (lists && lists.length > 0 && !activeListId) {
      setSearchParams({ list: lists[0].id });
    }
  }, [lists, activeListId, setSearchParams]);

  if (isLoading) {
    return <EmptyState text="Carregando tarefas..." />;
  }

  if (!lists || lists.length === 0) {
    return (
      <div className="operations-layout">
        <SectionHeader eyebrow="Workspace" title="Projetos & Operação" icon={LayoutDashboard} />
        <EmptyState text="Nenhuma lista de tarefas encontrada para este cliente." />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button 
            className="primary-button" 
            type="button" 
            onClick={() => {
              createList.mutate({ workspaceId, name: "Growth & Projetos", type: "growth" });
              createList.mutate({ workspaceId, name: "Social Media Engine", type: "social" });
            }}
            disabled={createList.isPending}
          >
            {createList.isPending ? "Criando..." : "Criar listas padrão (Growth & Social)"}
          </button>
        </div>
      </div>
    );
  }

  const activeList = lists.find(l => l.id === activeListId);

  return (
    <div className="operations-layout" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionHeader eyebrow="Lista" title={activeList?.name || "Tarefas"} icon={LayoutDashboard} />
        
        {activeListId && (
          <div style={{ display: "flex", gap: 8, background: "var(--surface-sunken)", padding: 4, borderRadius: 6 }}>
            <button
              type="button"
              className={viewMode === "board" ? "primary-button" : "icon-button"}
              onClick={() => setViewMode("board")}
              title="Visão Kanban"
              style={{ padding: "4px 8px" }}
            >
              <Kanban size={16} />
            </button>
            <button
              type="button"
              className={viewMode === "list" ? "primary-button" : "icon-button"}
              onClick={() => setViewMode("list")}
              title="Visão em Lista"
              style={{ padding: "4px 8px" }}
            >
              <List size={16} />
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, marginTop: 16 }}>
        {activeListId ? (
          viewMode === "board" 
            ? <TaskBoard listId={activeListId} /> 
            : <TaskListView listId={activeListId} />
        ) : (
          <EmptyState text="Selecione uma lista na barra lateral." />
        )}
      </div>
    </div>
  );
}
