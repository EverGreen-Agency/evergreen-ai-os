import { BarChart3, BookOpen, FileText, GitBranch, LayoutDashboard, Users, WalletCards, type LucideIcon } from "lucide-react";

import type { ArtifactPayload, ClientModule, ClientPayload, ClientStatus, CurrentUser, DeliverablePayload, DeliverableStatus } from "./api";

export type ViewId =
  | "cockpit"
  | "clientes"
  | "crm"
  | "finance"
  | "conteudo"
  | "engenharia"
  | "analytics"
  | "eg-office"
  | "eg-ideas"
  | "eg-tech"
  | "eg-architecture";

export const navItems: Array<{ id: ViewId; label: string; icon: LucideIcon }> = [
  // Rotas normais (Módulos de Cliente/Operação)
  { id: "cockpit", label: "Cockpit", icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "crm", label: "CRM / Leads", icon: Users },
  { id: "finance", label: "Financeiro", icon: WalletCards },
  { id: "conteudo", label: "Conteúdo", icon: BookOpen },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "engenharia", label: "Engenharia", icon: FileText },
  
  // Rotas Internas EG (Administrativas)
  { id: "eg-office", label: "Escritório", icon: LayoutDashboard }, // O ícone pode ser ajustado depois
  { id: "eg-ideas", label: "Banco de Ideias", icon: BookOpen },
  { id: "eg-tech", label: "Banco de Stack", icon: GitBranch },
  { id: "eg-architecture", label: "Arquitetura", icon: FileText },
];

// Feature-gating por organização (decisão 2026-07-14): cada view exige um
// módulo habilitado; EG admin enxerga tudo, client_user só o que a org tem.
export const viewModule: Record<ViewId, ClientModule> = {
  cockpit: "hub",
  clientes: "hub",
  crm: "commercial",
  finance: "commercial",
  conteudo: "content",
  analytics: "analytics",
  engenharia: "engineering",
  // Rotas internas não devem depender de módulos de cliente,
  // mas para obedecer à tipagem sem erro, colocamos hub.
  // A proteção real se dará no App.tsx com isEgAdmin.
  "eg-office": "hub",
  "eg-ideas": "hub",
  "eg-tech": "hub",
  "eg-architecture": "hub",
};

export const moduleLabels: Record<ClientModule, string> = {
  hub: "Hub do cliente",
  content: "Conteúdo",
  files: "Arquivos",
  commercial: "Comercial",
  analytics: "Analytics",
  integrations: "Integrações",
  engineering: "Engenharia",
};

// Módulos que o EG admin pode ligar/desligar por cliente ("hub" é o núcleo,
// sempre ativo — o backend força isso também).
export const toggleableModules: ClientModule[] = ["content", "files", "commercial", "analytics", "integrations", "engineering"];

export function enabledModulesFor(user: CurrentUser | null | undefined, isEgAdmin: boolean): Set<ClientModule> {
  if (isEgAdmin) {
    return new Set<ClientModule>(["hub", "content", "files", "commercial", "analytics", "integrations", "engineering"]);
  }
  const modules = new Set<ClientModule>();
  for (const organization of user?.organizations ?? []) {
    for (const module of organization.enabled_modules ?? []) {
      modules.add(module);
    }
  }
  modules.add("hub");
  return modules;
}

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
  { name: "LinkedIn/Analytics", status: "MVP Demo", detail: "Demonstração visual do dashboard de performance (sem dados reais ainda)" },
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
