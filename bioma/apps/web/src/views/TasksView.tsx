import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTaskLists, useCreateTaskList, useWorkspaceProjects } from "../hooks/useBiomaApi";
import { TaskBoard } from "../components/tasks/TaskBoard";
import { TaskListView } from "../components/tasks/TaskListView";
import { TaskCalendarView } from "../components/tasks/TaskCalendarView";
import { TaskGanttView } from "../components/tasks/TaskGanttView";
import { EmptyState, SectionHeader } from "../components/shared";
import { buildTaskPredicate, quickFiltersForFrente } from "../lib/task-filters";
import { LayoutDashboard, Kanban, List, Calendar, ChartGantt } from "lucide-react";

type TasksViewProps = {
  workspaceId: string;
};

export function TasksView({ workspaceId }: TasksViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: lists, isLoading } = useTaskLists(workspaceId);
  const createList = useCreateTaskList();
  
  const activeListId = searchParams.get("list") || lists?.[0]?.id || "";
  // Gantt e uma visao como as outras, disponivel para qualquer frente --
  // nao e exclusiva do roadmap do cliente.
  const [viewMode, setViewMode] = useState<"board" | "list" | "calendar" | "gantt">("board");
  const [quickFilterId, setQuickFilterId] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>("");
  const { data: projects = [] } = useWorkspaceProjects(workspaceId);

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
            <button
              type="button"
              className={viewMode === "gantt" ? "primary-button" : "icon-button"}
              onClick={() => setViewMode("gantt")}
              title="Visão Roadmap (Gantt/Timeline)"
              style={{ padding: "4px 8px" }}
            >
              <ChartGantt size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Filtros rapidos: as "views" do manual v1 (Bug Tracker, Banco de
          Ideias, Aprovacao) viram filtros aplicaveis a qualquer visao. */}
      {activeListId && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
          {quickFiltersForFrente(activeList?.type).map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={quickFilterId === filter.id ? "primary-button" : "mini-button"}
              style={{ fontSize: 11, padding: "4px 10px" }}
              onClick={() => setQuickFilterId(quickFilterId === filter.id ? null : filter.id)}
            >
              {filter.label}
            </button>
          ))}
          {projects.length > 0 && (
            <select
              className="status-select"
              style={{ fontSize: 12, maxWidth: 220 }}
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
            >
              <option value="">Todos os projetos</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, marginTop: 16 }}>
        {activeListId ? (() => {
          const taskFilter = buildTaskPredicate(quickFilterId, projectFilter || null);
          const shared = {
            listId: activeListId,
            listType: activeList?.type,
            workspaceId,
            taskFilter,
          } as const;
          if (viewMode === "board") return <TaskBoard {...shared} />;
          if (viewMode === "list") return <TaskListView {...shared} />;
          if (viewMode === "calendar") return <TaskCalendarView {...shared} />;
          return <TaskGanttView {...shared} />;
        })() : (
          <EmptyState text="Selecione uma lista na barra lateral." />
        )}
      </div>
    </div>
  );
}
