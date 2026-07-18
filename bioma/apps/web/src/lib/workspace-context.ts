import type { ClientSummary, CurrentUser, WorkspaceSummary } from "./api";

export type AgencyWorkspaceContext = {
  kind: "agency_internal";
  workspaceId: string;
  tenantOrganizationId: string;
  organizationId: string;
  organizationName: string;
  legacyClientId: string;
  name: string;
};

export type ClientWorkspaceContext = {
  kind: "client";
  workspaceId: string;
  organizationId: string;
  organizationName: string;
  clientId: string;
  name: string;
};

export type WorkspaceContext = AgencyWorkspaceContext | ClientWorkspaceContext;

export type AgencyWorkspaceResolution =
  | { status: "ready"; workspace: AgencyWorkspaceContext }
  | { status: "missing_organization" }
  | { status: "missing_workspace"; organizationName: string }
  | { status: "missing_bridge"; organizationName: string }
  | { status: "ambiguous_bridge"; organizationName: string };

export function clientWorkspaceContext(client: ClientSummary, workspace: WorkspaceSummary): ClientWorkspaceContext {
  return {
    kind: "client",
    workspaceId: workspace.id,
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
  workspaces: WorkspaceSummary[],
  user: CurrentUser | null | undefined,
): AgencyWorkspaceResolution {
  // O papel atual é de plataforma EG, não o futuro tenant_admin white-label.
  const agencyOrganization = user?.organizations.find(
    (organization) => organization.slug === "eg" && organization.role === "eg_admin",
  );
  if (!agencyOrganization) return { status: "missing_organization" };

  const agencyWorkspaces = workspaces.filter(
    (workspace) => workspace.kind === "agency_internal" && workspace.organization_id === agencyOrganization.id,
  );
  if (agencyWorkspaces.length === 0) {
    return { status: "missing_workspace", organizationName: agencyOrganization.name };
  }
  if (agencyWorkspaces.length > 1) {
    return { status: "ambiguous_bridge", organizationName: agencyOrganization.name };
  }

  const agencyWorkspace = agencyWorkspaces[0];
  if (!agencyWorkspace.legacy_client_id) {
    return { status: "missing_bridge", organizationName: agencyOrganization.name };
  }

  return {
    status: "ready",
    workspace: {
      kind: "agency_internal",
      workspaceId: agencyWorkspace.id,
      tenantOrganizationId: agencyWorkspace.tenant_organization_id,
      organizationId: agencyOrganization.id,
      organizationName: agencyOrganization.name,
      legacyClientId: agencyWorkspace.legacy_client_id,
      name: agencyWorkspace.name,
    },
  };
}

export function operationalClientId(workspace: WorkspaceContext): string {
  return workspace.workspaceId;
}
