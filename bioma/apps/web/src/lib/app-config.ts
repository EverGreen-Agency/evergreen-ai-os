import { BookOpen, FileText, GitBranch, LayoutDashboard, Users, type LucideIcon } from "lucide-react";

import type { ArtifactPayload, ClientPayload, ClientStatus, DeliverablePayload, DeliverableStatus } from "./api";

export type ViewId = "cockpit" | "clientes" | "conteudo" | "integracoes" | "engenharia";

export const navItems: Array<{ id: ViewId; label: string; icon: LucideIcon }> = [
  { id: "cockpit", label: "Cockpit", icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "conteudo", label: "Conteúdo", icon: BookOpen },
  { id: "integracoes", label: "Integrações", icon: GitBranch },
  { id: "engenharia", label: "Engenharia", icon: FileText },
];

export const statusLabel: Record<ClientStatus, string> = {
  onboarding: "Onboarding",
  active: "Ativo",
  paused: "Pausado",
  archived: "Arquivado",
};

export const deliverableStatusLabel: Record<DeliverableStatus, string> = {
  planned: "Planejado",
  in_progress: "Em execução",
  waiting_approval: "Aguardando aprovação",
  done: "Concluído",
  blocked: "Bloqueado",
};

export const integrationRows = [
  { name: "ClickUp", status: "MVP", detail: "dry-run manual; próximo passo é leitura real de tasks por lista" },
  { name: "Drive", status: "Backlog", detail: "centralizar links e arquivos do cliente no hub" },
  { name: "LinkedIn/Analytics", status: "Backlog", detail: "apenas quando houver fonte real, sem métricas inventadas" },
  { name: "Autentique", status: "Backlog", detail: "contratos e assinaturas sem duplicar ferramenta jurídica" },
];

export const emptyClientDraft: ClientPayload = {
  name: "",
  organization_name: "",
  status: "onboarding",
  responsible_name: "",
  clickup_folder_id: "",
};

export const emptyArtifactDraft: ArtifactPayload = {
  title: "",
  kind: "briefing",
  visibility: "client",
  content: "",
  url: "",
};

export const emptyDeliverableDraft: DeliverablePayload = {
  title: "",
  status: "planned",
  due_at: "",
  clickup_task_id: "",
};

export function currentViewFromHash(): ViewId {
  const id = window.location.hash.replace("#", "") as ViewId;
  return navItems.some((item) => item.id === id) ? id : "cockpit";
}
