import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTaskLists, useCreateTaskList } from "../hooks/useBiomaApi";
import { TaskBoard } from "../components/tasks/TaskBoard";
import { TaskListView } from "../components/tasks/TaskListView";
import { TaskCalendarView } from "../components/tasks/TaskCalendarView";
import { EmptyState, SectionHeader } from "../components/shared";
import { LayoutDashboard, Kanban, List, Calendar } from "lucide-react";

type TasksViewProps = {
  workspaceId: string;
};

export function TasksView({ workspaceId }: TasksViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: lists, isLoading } = useTaskLists(workspaceId);
  const createList = useCreateTaskList();
  
  const activeListId = searchParams.get("list") || lists?.[0]?.id || "";
  const [viewMode, setViewMode] = useState<"board" | "list" | "calendar">("board");

  useEffect(() => {
    if (lists && lists.length > 0 && !searchParams.get("list")) {
      setSearchParams({ list: lists[0].id }, { replace: true });
    }
  }, [lists, searchParams, setSearchParams]);

  if (isLoading) {
    return <EmptyState text="Carregando tarefas..." />;
  }

  if (!lists || lists.length === 0) {
    return (
      <div className="operations-layout">
        <SectionHeader eyebrow="Workspace" title="Projetos & Operação" icon={LayoutDashboard} />
        {/* Serve tanto para workspace de cliente quanto para a Operação EG,
            então o texto não pode dizer "cliente". As frentes padrão são Growth
            e Tech: pelo Manual v2, Social vive no Estúdio IA. */}
        <EmptyState text="Nenhuma frente de trabalho criada neste workspace." />
        <div style={{ textAlign: "center", marginTop: 16, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              createList.mutate({ workspaceId, name: "Growth & Projetos", type: "growth" });
              createList.mutate({ workspaceId, name: "Tech & Software", type: "tech" });
            }}
            disabled={createList.isPending}
          >
            {createList.isPending ? "Criando..." : "Criar frentes padrão (Growth + Tech)"}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => createList.mutate({ workspaceId, name: "Growth & Projetos", type: "growth" })}
            disabled={createList.isPending}
          >
            Só Growth
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => createList.mutate({ workspaceId, name: "Tech & Software", type: "tech" })}
            disabled={createList.isPending}
          >
            Só Tech
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
          <div style={{ display: "flex", gap: 6, background: "var(--surface-sunken)", padding: 4, borderRadius: 6 }}>
            <button
              type="button"
              className={viewMode === "board" ? "primary-button" : "icon-button"}
              onClick={() => setViewMode("board")}
              title="Visão Quadro (Kanban)"
              style={{ padding: "4px 8px" }}
            >
              <Kanban size={16} />
            </button>
            <button
              type="button"
              className={viewMode === "list" ? "primary-button" : "icon-button"}
              onClick={() => setViewMode("list")}
              title="Visão em Lista (Planejamento)"
              style={{ padding: "4px 8px" }}
            >
              <List size={16} />
            </button>
            <button
              type="button"
              className={viewMode === "calendar" ? "primary-button" : "icon-button"}
              onClick={() => setViewMode("calendar")}
              title="Visão de Calendário Editorial"
              style={{ padding: "4px 8px" }}
            >
              <Calendar size={16} />
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, marginTop: 16 }}>
        {activeListId ? (
          viewMode === "board"
            ? <TaskBoard listId={activeListId} listType={activeList?.type} workspaceId={workspaceId} />
            : viewMode === "list"
              ? <TaskListView listId={activeListId} listType={activeList?.type} workspaceId={workspaceId} />
              : <TaskCalendarView listId={activeListId} listType={activeList?.type} workspaceId={workspaceId} />
        ) : (
          <EmptyState text="Selecione uma lista na barra lateral." />
        )}
      </div>
    </div>
  );
}
