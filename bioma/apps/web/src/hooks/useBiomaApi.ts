import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ClientPayload, ArtifactPayload, DeliverablePayload, LeadPayload, FinancialRecordPayload, AiSubscriptionPayload, AiQuotaPayload, TaskPayload, TaskListType } from "../lib/api";
import type { Idea } from "../types/idea";
import type { Tech } from "../types/stack";

export function useApiHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    retry: false,
    refetchInterval: 60000,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: api.me,
    retry: false,
  });
}

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: api.clients,
  });
}

export function useWorkspaces(enabled = true) {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: api.workspaces,
    enabled,
  });
}

export function useMyDeliverables() {
  return useQuery({
    queryKey: ["deliverables", "me"],
    queryFn: api.getMyDeliverables,
  });
}

export function useClientPortal(clientId: string | null) {
  return useQuery({
    queryKey: ["portal", clientId],
    queryFn: () => {
      if (!clientId) throw new Error("No client ID provided");
      return api.clientPortal(clientId);
    },
    enabled: Boolean(clientId),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientPayload) => api.createClient(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.setQueryData(["portal", data.client.id], data);
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ClientPayload> }) => api.updateClient(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.setQueryData(["portal", data.client.id], data);
    },
  });
}

export function useCreateArtifact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, payload }: { clientId: string; payload: ArtifactPayload }) => api.createArtifact(clientId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.setQueryData(["portal", data.client.id], data);
    },
  });
}

export function useUpdateArtifact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, artifactId, payload }: { clientId: string; artifactId: string; payload: Partial<ArtifactPayload> }) =>
      api.updateArtifact(clientId, artifactId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(["portal", data.client.id], data);
    },
  });
}

export function useDeleteArtifact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, artifactId }: { clientId: string; artifactId: string }) => api.deleteArtifact(clientId, artifactId),
    onSuccess: (data) => {
      queryClient.setQueryData(["portal", data.client.id], data);
    },
  });
}

export function useCreateDeliverable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, payload }: { clientId: string; payload: DeliverablePayload }) => api.createDeliverable(clientId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.setQueryData(["portal", data.client.id], data);
    },
  });
}

export function useUpdateDeliverable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, deliverableId, payload }: { clientId: string; deliverableId: string; payload: Partial<DeliverablePayload> }) =>
      api.updateDeliverable(clientId, deliverableId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.setQueryData(["portal", data.client.id], data);
    },
  });
}

export function useDeleteDeliverable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, deliverableId }: { clientId: string; deliverableId: string }) => api.deleteDeliverable(clientId, deliverableId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.setQueryData(["portal", data.client.id], data);
    },
  });
}

export function useCreateApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, deliverableId, comment }: { clientId: string; deliverableId: string; comment?: string }) =>
      api.createApproval(clientId, deliverableId, comment),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.setQueryData(["portal", data.client.id], data);
    },
  });
}

export function useDecideApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, approvalId, status }: { clientId: string; approvalId: string; status: "approved" | "rejected" }) =>
      api.decideApproval(clientId, approvalId, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.setQueryData(["portal", data.client.id], data);
    },
  });
}


export function useArchiveClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) => api.archiveClient(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => api.login(email, password),
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

// --- INVITES ---

export function useCreateInvite() {
  return useMutation({
    mutationFn: ({ clientId, email }: { clientId: string; email?: string | null }) => api.createInvite(clientId, email),
  });
}

// --- INTEGRAÇÕES (status real de ambiente + conexões de Performance) ---

export function useIntegrationsStatus() {
  return useQuery({
    queryKey: ["integrations", "status"],
    queryFn: api.integrationsStatus,
  });
}

export function usePerformanceConnections(clientId: string | null) {
  return useQuery({
    queryKey: ["performance-connections", clientId],
    queryFn: () => {
      if (!clientId) throw new Error("No client ID provided");
      return api.performanceConnections(clientId);
    },
    enabled: Boolean(clientId),
  });
}

export function useCreatePerformanceConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, payload }: { clientId: string; payload: Parameters<typeof api.createPerformanceConnection>[1] }) =>
      api.createPerformanceConnection(clientId, payload),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["performance-connections", variables.clientId], data);
    },
  });
}

export function useUpdatePerformanceConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      connectionId,
      payload,
    }: {
      clientId: string;
      connectionId: string;
      payload: Parameters<typeof api.updatePerformanceConnection>[2];
    }) => api.updatePerformanceConnection(clientId, connectionId, payload),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["performance-connections", variables.clientId], data);
    },
  });
}

export function useRequestPerformanceSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, provider }: { clientId: string; provider?: Parameters<typeof api.requestPerformanceSync>[1] }) =>
      api.requestPerformanceSync(clientId, provider),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["portal", variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ["performance-connections", variables.clientId] });
    },
  });
}

// --- KOMMO INTEGRATION ---

export function useKommoConfig(organizationId: string | null) {
  return useQuery({
    queryKey: ["kommo-config", organizationId],
    queryFn: () => {
      if (!organizationId) throw new Error("No organization ID provided");
      return api.getKommoConfig(organizationId);
    },
    enabled: Boolean(organizationId),
  });
}

export function useSetupKommoConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organizationId, payload }: { organizationId: string; payload: Parameters<typeof api.setupKommoConfig>[1] }) =>
      api.setupKommoConfig(organizationId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kommo-config", variables.organizationId] });
    },
  });
}

export function useKommoAnalytics(organizationId: string | null) {
  return useQuery({
    queryKey: ["kommo-analytics", organizationId],
    queryFn: () => {
      if (!organizationId) throw new Error("No organization ID provided");
      return api.getKommoAnalytics(organizationId);
    },
    enabled: Boolean(organizationId),
  });
}

// --- BACKOFFICE EG (banco de ideias / tech radar) ---
// Escrita com atualização otimista: o board responde na hora (drag & drop) e,
// se o POST falhar, o cache volta ao snapshot e o erro aparece no aviso global.

export function useAdminIdeas() {
  return useQuery({
    queryKey: ["admin", "ideas"],
    queryFn: api.adminIdeas,
    select: (data) => data.ideas ?? [],
  });
}

export function useSaveAdminIdeas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ideas: Idea[]) => api.saveAdminIdeas(ideas),
    onMutate: async (ideas) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "ideas"] });
      const previous = queryClient.getQueryData<{ ideas?: Idea[] }>(["admin", "ideas"]);
      queryClient.setQueryData(["admin", "ideas"], { ...(previous ?? {}), ideas });
      return { previous };
    },
    onError: (_error, _ideas, context) => {
      if (context?.previous) queryClient.setQueryData(["admin", "ideas"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin", "ideas"] }),
  });
}

export function useSaveAdminIdeaDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => api.saveAdminIdeaDoc(id, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "idea-doc", variables.id] });
    },
  });
}

export function useAdminIdeaDoc(id: string | null) {
  return useQuery({
    queryKey: ["admin", "idea-doc", id],
    queryFn: () => api.adminIdeaDoc(id ?? ""),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useSaveEngineeringDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ modId, docType, content, filename }: { modId: string; docType: string; content: string; filename?: string }) => 
      api.saveEngineeringDoc(modId, docType, content, filename),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "engineering"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "engineering", variables.modId] });
    },
  });
}

export function useAdminStack() {
  return useQuery({
    queryKey: ["admin", "stack"],
    queryFn: api.adminStack,
  });
}

export function useSaveAdminStack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (techs: Tech[]) => api.saveAdminStack(techs),
    onMutate: async (techs) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "stack"] });
      const previous = queryClient.getQueryData<{ techs?: Tech[] }>(["admin", "stack"]);
      queryClient.setQueryData(["admin", "stack"], { ...(previous ?? {}), techs });
      return { previous };
    },
    onError: (_error, _techs, context) => {
      if (context?.previous) queryClient.setQueryData(["admin", "stack"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin", "stack"] }),
  });
}

// --- LEADS ---

export function useLeads(clientId: string | null) {
  return useQuery({
    queryKey: ["leads", clientId],
    queryFn: () => {
      if (!clientId) throw new Error("No client ID provided");
      return api.leads(clientId);
    },
    enabled: Boolean(clientId),
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, payload }: { clientId: string; payload: LeadPayload }) => api.createLead(clientId, payload),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["leads", variables.clientId], data);
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, leadId, payload }: { clientId: string; leadId: string; payload: Partial<LeadPayload> }) =>
      api.updateLead(clientId, leadId, payload),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["leads", variables.clientId], data);
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, leadId }: { clientId: string; leadId: string }) => api.deleteLead(clientId, leadId),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["leads", variables.clientId], data);
    },
  });
}

// --- FINANCE ---

export function useFinance(clientId: string | null) {
  return useQuery({
    queryKey: ["finance", clientId],
    queryFn: () => {
      if (!clientId) throw new Error("No client ID provided");
      return api.finance(clientId);
    },
    enabled: Boolean(clientId),
  });
}

export function useCreateFinancialRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, payload }: { clientId: string; payload: FinancialRecordPayload }) =>
      api.createFinancialRecord(clientId, payload),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["finance", variables.clientId], data);
    },
  });
}

export function useUpdateFinancialRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      recordId,
      payload,
    }: {
      clientId: string;
      recordId: string;
      payload: Partial<FinancialRecordPayload>;
    }) => api.updateFinancialRecord(clientId, recordId, payload),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["finance", variables.clientId], data);
    },
  });
}

export function useDeleteFinancialRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, recordId }: { clientId: string; recordId: string }) => api.deleteFinancialRecord(clientId, recordId),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["finance", variables.clientId], data);
    },
  });
}

export function useAiFinOps(enabled = true) {
  return useQuery({
    queryKey: ["ai-finops"],
    queryFn: api.aiFinOps,
    enabled,
  });
}

export function useCreateAiSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AiSubscriptionPayload) => api.createAiSubscription(payload),
    onSuccess: (data) => queryClient.setQueryData(["ai-finops"], data),
  });
}

export function useUpdateAiSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subscriptionId, payload }: { subscriptionId: string; payload: Partial<AiSubscriptionPayload> }) =>
      api.updateAiSubscription(subscriptionId, payload),
    onSuccess: (data) => queryClient.setQueryData(["ai-finops"], data),
  });
}

export function useRecordAiQuota() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subscriptionId, payload }: { subscriptionId: string; payload: AiQuotaPayload }) =>
      api.recordAiQuota(subscriptionId, payload),
    onSuccess: (data) => queryClient.setQueryData(["ai-finops"], data),
  });
}

export function useAiWorkflowTemplates() {
  return useQuery({ queryKey: ["ai-workflow-templates"], queryFn: api.aiWorkflowTemplates });
}

export function useAiWorkflowDefinitions() {
  return useQuery({ queryKey: ["ai-workflow-definitions"], queryFn: api.aiWorkflowDefinitions });
}

export function useInstallAiWorkflowTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => api.installAiWorkflowTemplate(slug),
    onSuccess: (data) => queryClient.setQueryData(["ai-workflow-definitions"], data),
  });
}

export function useAiWorkflowRuns() {
  return useQuery({ queryKey: ["ai-workflow-runs"], queryFn: api.aiWorkflowRuns });
}

export function useCreateAiWorkflowRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAiWorkflowRun,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-workflow-runs"] }),
  });
}

export function useApproveAiWorkflowRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => api.approveAiWorkflowRun(runId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-workflow-runs"] }),
  });
}

// Task Management Hooks

export function useTaskLists(workspaceId: string | null) {
  return useQuery({
    queryKey: ["task-lists", workspaceId],
    queryFn: () => {
      if (!workspaceId) throw new Error("No workspace ID provided");
      return api.taskLists(workspaceId);
    },
    enabled: Boolean(workspaceId),
  });
}

export function useCreateTaskList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, name, type }: { workspaceId: string; name: string; type: TaskListType }) => 
      api.createTaskList(workspaceId, name, type),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task-lists", variables.workspaceId] });
    },
  });
}

export function useTasksInList(listId: string | null) {
  return useQuery({
    queryKey: ["tasks", listId],
    queryFn: () => {
      if (!listId) throw new Error("No list ID provided");
      return api.tasksInList(listId);
    },
    enabled: Boolean(listId),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, payload }: { listId: string; payload: TaskPayload }) => 
      api.createTask(listId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.listId] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: Partial<TaskPayload> }) => 
      api.updateTask(taskId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", data.list_id] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, listId }: { taskId: string; listId: string }) => 
      api.deleteTask(taskId).then(() => listId),
    onSuccess: (listId) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", listId] });
    },
  });
}

// Commercial Raio-X Hook
export function useCommercialPortal(workspaceId: string | null) {
  return useQuery({
    queryKey: ["commercial-portal", workspaceId],
    queryFn: () => {
      if (!workspaceId) throw new Error("No workspace ID provided");
      return api.commercialPortal(workspaceId);
    },
    enabled: Boolean(workspaceId),
  });
}
