/**
 * Status por frente — fonte única, derivada do Manual Operacional Bioma v2.
 *
 * Antes os status viviam hardcoded no TaskDrawer, com dois problemas: as
 * sugestões misturavam Growth e Social (a pessoa numa lista de Growth recebia
 * "ROTEIRIZAÇÃO" como opção) e o conjunto de **Tech não existia** — numa lista
 * tipo `tech` não havia como sugerir CODE REVIEW ou QA.
 *
 * `group_status` é o agrupamento das colunas do Kanban; `status` é o passo
 * específico dentro do grupo. O mapa abaixo diz, para cada frente, quais
 * status existem e a que grupo cada um pertence.
 */

import type { TaskGroupStatus, TaskListType } from "./api";

export type FrenteStatus = {
  status: string;
  group: TaskGroupStatus;
};

const GROWTH: FrenteStatus[] = [
  { status: "BRAIN", group: "NOT_STARTED" },
  { status: "BACKLOG", group: "ACTIVE" },
  { status: "IN PROGRESS", group: "ACTIVE" },
  { status: "IN REVIEW", group: "ACTIVE" },
  { status: "REJECTED", group: "ACTIVE" },
  { status: "BLOCKED", group: "ACTIVE" },
  { status: "DONE", group: "DONE" },
  { status: "CLOSED", group: "CLOSED" },
];

const TECH: FrenteStatus[] = [
  { status: "BRAIN", group: "NOT_STARTED" },
  { status: "BACKLOG", group: "NOT_STARTED" },
  { status: "TO DO (SPRINT)", group: "NOT_STARTED" },
  { status: "IN PROGRESS", group: "ACTIVE" },
  { status: "CODE REVIEW", group: "ACTIVE" },
  { status: "QA / TESTING", group: "ACTIVE" },
  { status: "BLOCKED", group: "ACTIVE" },
  { status: "READY FOR RELEASE", group: "DONE" },
  { status: "CANCELLED / WON'T FIX", group: "DONE" },
  { status: "DEPLOYED", group: "CLOSED" },
];

const SOCIAL: FrenteStatus[] = [
  { status: "IDEAÇÃO", group: "NOT_STARTED" },
  { status: "ROTEIRIZAÇÃO", group: "ACTIVE" },
  { status: "EM PRODUÇÃO", group: "ACTIVE" },
  { status: "REVISÃO INTERNA", group: "ACTIVE" },
  { status: "APROVAÇÃO CLIENTE", group: "ACTIVE" },
  { status: "EM AJUSTE", group: "ACTIVE" },
  // AGENDADO é DONE pelo manual. A migração do ClickUp mapeava como
  // NOT_STARTED, o que jogava 27 tarefas na coluna errada do Kanban.
  { status: "AGENDADO", group: "DONE" },
  { status: "PUBLICADO", group: "DONE" },
  { status: "ANALISAR", group: "DONE" },
  { status: "DESCARTADO", group: "DONE" },
  { status: "FINALIZADO", group: "CLOSED" },
];

/** `general` usa o vocabulário de Growth: é o mais neutro dos três. */
const STATUSES_BY_FRENTE: Record<TaskListType, FrenteStatus[]> = {
  growth: GROWTH,
  tech: TECH,
  social: SOCIAL,
  general: GROWTH,
};

export function statusesForFrente(type: TaskListType | undefined): FrenteStatus[] {
  return STATUSES_BY_FRENTE[type ?? "general"] ?? GROWTH;
}

/** Grupo correto para um status, para o Kanban não depender de digitação. */
export function groupForStatus(type: TaskListType | undefined, status: string): TaskGroupStatus | null {
  const match = statusesForFrente(type).find(
    (item) => item.status.toLowerCase() === status.trim().toLowerCase(),
  );
  return match ? match.group : null;
}

export const FRENTE_LABELS: Record<TaskListType, string> = {
  growth: "Growth & Projetos",
  tech: "Tech & Software",
  social: "Social Media",
  general: "Geral",
};
