import type { ArtifactPayload, ClientPayload, DeliverablePayload } from "./api";

export function normalizeClientPayload(payload: ClientPayload): ClientPayload {
  return {
    ...payload,
    name: payload.name.trim(),
    organization_name: normalizeOptional(payload.organization_name) ?? payload.name.trim(),
    responsible_name: normalizeOptional(payload.responsible_name),
    clickup_folder_id: normalizeOptional(payload.clickup_folder_id),
  };
}

export function normalizeArtifactPayload(payload: ArtifactPayload): ArtifactPayload {
  return {
    ...payload,
    title: payload.title.trim(),
    kind: payload.kind.trim() || "briefing",
    content: normalizeOptional(payload.content),
    url: normalizeOptional(payload.url),
  };
}

export function normalizeDeliverablePayload(payload: DeliverablePayload): DeliverablePayload {
  return {
    ...payload,
    title: payload.title.trim(),
    due_at: normalizeOptional(payload.due_at),
    clickup_task_id: normalizeOptional(payload.clickup_task_id),
  };
}

export function formatDueDate(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function approvalStatusLabel(status: string) {
  const labels: Record<string, string> = {
    approved: "Aprovado",
    rejected: "Reprovado",
    cancelled: "Cancelado",
  };
  return labels[status] ?? status;
}

export function artifactKindLabel(kind: string) {
  const labels: Record<string, string> = {
    briefing: "Briefing",
    brand_book: "Brand book",
    calendar: "Calendário",
    integration_map: "Mapa de integração",
  };
  return labels[kind] ?? kind;
}

export function clickUpSummary(folderId: string | null, status: string | undefined) {
  if (!folderId) return "ClickUp sem mapeamento";
  if (!status) return "ClickUp mapeado";
  const labels: Record<string, string> = {
    ok: "ClickUp sincronizado",
    partial: "ClickUp parcial",
    error: "ClickUp com erro",
  };
  return labels[status] ?? "ClickUp mapeado";
}

export function auditLabel(eventType: string) {
  const labels: Record<string, string> = {
    "auth.login": "Login",
    "client.created": "Cliente criado",
    "client.updated": "Cliente atualizado",
    "artifact.created": "Artefato criado",
    "artifact.updated": "Artefato atualizado",
    "artifact.deleted": "Artefato excluído",
    "deliverable.created": "Entrega criada",
    "deliverable.updated": "Entrega atualizada",
    "deliverable.deleted": "Entrega excluída",
    "approval.decided": "Aprovação decidida",
    "clickup.sync_requested": "Sync ClickUp solicitado",
  };
  return labels[eventType] ?? eventType;
}

export function compactMetadata(metadata: Record<string, unknown>) {
  const keys = Object.keys(metadata);
  if (keys.length === 0) return "sem metadados";
  return keys
    .slice(0, 3)
    .map((key) => `${key}: ${String(metadata[key])}`)
    .join(" · ");
}

export function isSessionError(error: Error) {
  const message = error.message.toLowerCase();
  return message.includes("sessão ausente") || message.includes("sessão inválida");
}

function normalizeOptional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
