import type { ClientSummary, CurrentUser } from "./api";

export type AgencyWorkspaceContext = {
  kind: "agency_internal";
  organizationId: string;
  organizationName: string;
  legacyClientId: string;
  name: string;
};

export type ClientWorkspaceContext = {
  kind: "client";
  organizationId: string;
  organizationName: string;
  clientId: string;
  name: string;
};

export type WorkspaceContext = AgencyWorkspaceContext | ClientWorkspaceContext;

export type AgencyWorkspaceResolution =
  | { status: "ready"; workspace: AgencyWorkspaceContext }
  | { status: "missing_organization" }
  | { status: "missing_bridge"; organizationName: string }
  | { status: "ambiguous_bridge"; organizationName: string };

export function clientWorkspaceContext(client: ClientSummary): ClientWorkspaceContext {
  return {
    kind: "client",
    organizationId: client.organization_id,
    organizationName: client.organization_name,
    clientId: client.id,
    name: client.name,
  };
}

/**
 * Resolve a ponte temporária usada pelos endpoints ainda baseados em client_id.
 * Não há fallback por nome, posição na lista ou cliente selecionado: a operação
 * interna precisa pertencer exatamente à organização em que o usuário é admin EG.
 */
export function resolveAgencyWorkspace(
  clients: ClientSummary[],
  user: CurrentUser | null | undefined,
): AgencyWorkspaceResolution {
  // O papel atual é de plataforma EG, não o futuro tenant_admin white-label.
  const agencyOrganization = user?.organizations.find(
    (organization) => organization.slug === "eg" && organization.role === "eg_admin",
  );
  if (!agencyOrganization) return { status: "missing_organization" };

  const bridgeClients = clients.filter((client) => client.organization_id === agencyOrganization.id);
  if (bridgeClients.length === 0) {
    return { status: "missing_bridge", organizationName: agencyOrganization.name };
  }
  if (bridgeClients.length > 1) {
    return { status: "ambiguous_bridge", organizationName: agencyOrganization.name };
  }

  return {
    status: "ready",
    workspace: {
      kind: "agency_internal",
      organizationId: agencyOrganization.id,
      organizationName: agencyOrganization.name,
      legacyClientId: bridgeClients[0].id,
      name: "Operação EG",
    },
  };
}

export function operationalClientId(workspace: WorkspaceContext): string {
  return workspace.kind === "agency_internal" ? workspace.legacyClientId : workspace.clientId;
}
