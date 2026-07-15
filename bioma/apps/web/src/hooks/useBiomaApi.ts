import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ClientPayload, ArtifactPayload, DeliverablePayload, LeadPayload, FinancialRecordPayload } from "../lib/api";

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

export function useSyncClickUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) => api.syncClickUp(clientId),
    onSuccess: (data) => {
      queryClient.setQueryData(["portal", data.client.id], data);
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
