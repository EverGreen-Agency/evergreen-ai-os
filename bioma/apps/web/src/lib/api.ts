import type { Idea } from "../types/idea";
import type { SquadInfo, SquadState } from "../types/state";
import type { StackRadar, Tech } from "../types/stack";

export type ApiHealth = {
  status: string;
  checked_at: string;
};

export type ClientModule = "hub" | "content" | "files" | "commercial" | "analytics" | "integrations" | "engineering";

export type CurrentUser = {
  id: string;
  email: string;
  display_name: string;
  has_password: boolean;
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    role: "eg_admin" | "client_user";
    enabled_modules: ClientModule[];
  }>;
};

export type ClientStatus = "onboarding" | "active" | "paused" | "archived";

export type ClientSummary = {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  name: string;
  status: ClientStatus;
  responsible_name: string | null;
  clickup_folder_id: string | null;
  enabled_modules: ClientModule[];
  deliverables_total: number;
  approvals_pending: number;
  artifacts_client: number;
};

export type WorkspaceSummary = {
  id: string;
  tenant_organization_id: string;
  tenant_name: string;
  tenant_slug: string;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  kind: "agency_internal" | "client";
  name: string;
  slug: string;
  status: "active" | "archived";
  client_id: string | null;
  legacy_client_id: string | null;
  operational_client_id: string | null;
  client_status: ClientStatus | null;
  responsible_name: string | null;
  enabled_modules: ClientModule[];
  access_role:
    | "platform_admin"
    | "tenant_admin"
    | "workspace_manager"
    | "operator"
    | "approver"
    | "viewer"
    | "client_user";
  is_favorite: boolean;
  is_assigned: boolean;
};

export type WorkspaceSavedViewFilters = {
  query: string;
  kinds: WorkspaceSummary["kind"][];
  access_roles: WorkspaceSummary["access_role"][];
  statuses: string[];
  favorite_only: boolean;
  mine_only: boolean;
};

export type WorkspaceSavedView = {
  id: string;
  tenant_organization_id: string | null;
  name: string;
  filters: WorkspaceSavedViewFilters;
};

export type TenantRole = "tenant_admin" | "operator" | "approver" | "viewer";
export type TeamRole = "manager" | "member";
export type WorkspaceAssignmentRole = "workspace_manager" | "operator" | "approver" | "viewer";

export type TeamSummary = {
  id: string;
  tenant_organization_id: string;
  name: string;
  slug: string;
  status: "active" | "archived";
  members_total: number;
  workspaces_total: number;
};

export type TenantMembershipSummary = {
  tenant_organization_id: string;
  user_id: string;
  email: string;
  display_name: string;
  role: TenantRole;
};

export type TeamMemberSummary = {
  team_id: string;
  user_id: string;
  email: string;
  display_name: string;
  role: TeamRole;
};

export type WorkspaceAssignmentSummary = {
  id: string;
  workspace_id: string;
  user_id: string | null;
  team_id: string | null;
  assignee_name: string;
  assignee_email: string | null;
  role: WorkspaceAssignmentRole;
};

export type AiContentPost = {
  title: string;
  channel: "instagram" | "linkedin" | "facebook" | "tiktok" | "youtube";
  format: string;
  hook: string;
  caption: string;
  cta: string;
};

export type AiContentRequest = {
  id: string;
  workspace_id: string;
  content_type: "social_posts";
  status: "queued" | "running" | "ready" | "error" | "cancelled";
  brief: string;
  channels: AiContentPost["channel"][];
  quantity: number;
  tone: string | null;
  objective: string | null;
  methodology_refs: string[];
  provider: string | null;
  model: string | null;
  generation_mode: "live" | "preview" | null;
  output: { strategy_note: string; posts: AiContentPost[] } | null;
  error_message: string | null;
  created_at: string;
  finished_at: string | null;
};

export type ArtifactSummary = {
  id: string;
  title: string;
  kind: string;
  visibility: "internal" | "client";
  content: string | null;
  url: string | null;
  created_at: string;
};

export type DeliverableStatus = "planned" | "in_progress" | "waiting_approval" | "done" | "blocked";

export type DeliverableSummary = {
  id: string;
  title: string;
  status: DeliverableStatus;
  due_at: string | null;
  clickup_task_id: string | null;
  assignee_emails: string[];
  updated_at: string;
};

export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";

export type ApprovalSummary = {
  id: string;
  deliverable_id: string | null;
  deliverable_title: string | null;
  status: ApprovalStatus;
  comment: string | null;
  created_at: string;
  decided_at: string | null;
};

export type LeadStage = "new" | "qualifying" | "meeting" | "proposal" | "won" | "lost";

export type LeadSummary = {
  id: string;
  name: string;
  company: string | null;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  source: string | null;
  stage: LeadStage;
  expected_value: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadPayload = {
  name: string;
  company?: string | null;
  role_title?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  source?: string | null;
  stage?: LeadStage;
  expected_value?: number | null;
  notes?: string | null;
};

export type FinancialRecordKind = "contract" | "invoice";
export type FinancialRecordStatus = "draft" | "open" | "paid" | "overdue" | "cancelled";

export type FinancialRecordSummary = {
  id: string;
  kind: FinancialRecordKind;
  title: string;
  amount: number | null;
  currency: string;
  status: FinancialRecordStatus;
  contract_start_at: string | null;
  contract_end_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type FinancialRecordPayload = {
  kind: FinancialRecordKind;
  title: string;
  amount?: number | null;
  currency?: string;
  status?: FinancialRecordStatus;
  contract_start_at?: string | null;
  contract_end_at?: string | null;
  due_at?: string | null;
  paid_at?: string | null;
  notes?: string | null;
};

export type PerformanceProvider = "google_ads" | "ga4" | "search_console" | "gtm";

export type PerformanceOverview = {
  workspace_id: string;
  client_id: string;
  period_start: string;
  period_end: string;
  freshness: Array<{
    provider: PerformanceProvider;
    status: "active" | "inactive" | "error";
    last_synced_at: string | null;
    last_error_at: string | null;
    last_error_message: string | null;
  }>;
  ads: {
    impressions: number;
    clicks: number;
    cost_micros: number;
    conversions: number;
    conversion_value: number;
    ctr: number;
    cpc_micros: number;
    cpa_micros: number;
    roas: number;
  };
  daily: Array<{
    date: string;
    impressions: number;
    clicks: number;
    cost_micros: number;
    conversions: number;
    conversion_value: number;
  }>;
  insights: Array<{
    id: string;
    source: string;
    category: string;
    severity: "info" | "warning" | "critical";
    title: string;
    description: string;
    recommendation: string | null;
    period_start: string;
    period_end: string;
    current_value: number | null;
    comparison_value: number | null;
    status: "active" | "archived" | "resolved";
    created_at: string;
  }>;
};

export type AdsCampaignSummary = {
  campaign_id: string;
  campaign_name: string;
  campaign_status: string;
  channel_type: string;
  budget_micros: number | null;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  conversion_value: number;
  ctr: number;
  cpa_micros: number;
  roas: number;
};

export type Ga4AcquisitionSummary = {
  source: string;
  medium: string;
  campaign: string;
  sessions: number;
  total_users: number;
  new_users: number;
  engaged_sessions: number;
  engagement_rate: number;
  key_events: number;
};

export type GscQuerySummary = {
  query: string;
  country: string;
  device: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type TrackingFindingSummary = {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  status: "open" | "resolved" | "ignored";
  created_at: string;
};

export type GtmSnapshotSummary = {
  id: string;
  workspace_id: string;
  collected_at: string;
  account_id: string;
  container_id: string;
  gtm_workspace_id: string | null;
  published_version: string | null;
  tags_count: number;
  triggers_count: number;
  variables_count: number;
  findings: TrackingFindingSummary[];
};

export type KommoConfigPayload = {
  client_id: string;
  client_secret: string;
  access_token: string;
  subdomain: string;
};

export type KommoConfigResponse = {
  configured: boolean;
  subdomain: string | null;
};

export type PipelineMetrics = {
  pipeline_id: string;
  pipeline_name: string;
  snapshot_date: string;
  total_leads: number;
  won_leads: number;
  lost_leads: number;
  active_leads: number;
  total_value: number;
  won_value: number;
};

export type KommoMetricsResponse = {
  pipelines: PipelineMetrics[];
};

export type ClientFileVisibility = "internal" | "client";

export type ClientFileSummary = {
  id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  visibility: ClientFileVisibility;
  uploaded_by: string | null;
  created_at: string;
};

export type ClientFileDownload = {
  url: string;
  expires_in: number;
};

export type SyncRunSummary = {
  id: string;
  source: string;
  status: "queued" | "running" | "ok" | "error" | "partial";
  summary: Record<string, unknown>;
  started_at: string;
  finished_at: string | null;
};

export type AuditLogSummary = {
  id: string;
  event_type: string;
  actor_user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ClientPortal = {
  client: ClientSummary;
  artifacts: ArtifactSummary[];
  deliverables: DeliverableSummary[];
  approvals: ApprovalSummary[];
  sync_runs: SyncRunSummary[];
  audit_logs: AuditLogSummary[];
};

export type ClientPayload = {
  name: string;
  organization_name?: string;
  organization_slug?: string;
  status?: ClientStatus;
  responsible_name?: string | null;
  clickup_folder_id?: string | null;
  enabled_modules?: ClientModule[];
};

export type InviteCreated = {
  id: string;
  token: string;
  path: string;
  email: string | null;
  expires_at: string;
};

export type InviteSummary = {
  id: string;
  email: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export type InvitePublicInfo = {
  client_name: string;
  organization_name: string;
  email: string | null;
  expires_at: string;
};

export type InviteAcceptPayload = {
  display_name: string;
  email: string;
  password: string;
};

export type PasswordResetCreated = {
  id: string;
  token: string;
  path: string;
  email: string;
  expires_at: string;
};

export type PasswordResetInfo = {
  email_hint: string;
  display_name: string;
  expires_at: string;
};

export type IdentitySummary = {
  id: string;
  provider: "google";
  email: string | null;
  created_at: string;
};

export type PerformanceConnectionStatus = "active" | "inactive" | "error";

export type PerformanceConnection = {
  id: string;
  workspace_id: string;
  client_id: string;
  provider: PerformanceProvider;
  external_account_id: string;
  external_parent_id: string | null;
  display_name: string | null;
  status: PerformanceConnectionStatus;
  credentials_configured: boolean;
  last_synced_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type PerformanceConnectionPayload = {
  provider: PerformanceProvider;
  external_account_id: string;
  external_parent_id?: string | null;
  display_name?: string | null;
  status?: PerformanceConnectionStatus;
};

export type PerformanceSyncRun = {
  id: string;
  workspace_id: string;
  source: string;
  provider: string | null;
  status: "queued" | "running" | "ok" | "error" | "partial";
  summary: Record<string, unknown>;
  date_from: string | null;
  date_to: string | null;
  records_processed: number;
  started_at: string;
  finished_at: string | null;
};

export type IntegrationsStatus = {
  clickup_token_configured: boolean;
  storage_configured: boolean;
  google_oauth_configured: boolean;
  app_env: string;
};

export type ArtifactPayload = {
  title: string;
  kind: string;
  visibility: "internal" | "client";
  content?: string | null;
  url?: string | null;
};

export type DeliverablePayload = {
  title: string;
  status: DeliverableStatus;
  due_at?: string | null;
  clickup_task_id?: string | null;
};

export type EngineeringModuleMaturity = {
  id: string;
  phase: string;
  maturity: string;
  nextGate: string;
};

export type EngineeringModuleSummary = {
  id: string;
  hasSpec: boolean;
  specTitle: string | null;
  specStatus: string | null;
  specDate: string | null;
  adrCount: number;
  hasTasks: boolean;
};

export type EngineeringData = {
  modules: EngineeringModuleSummary[];
  matrix: Record<string, EngineeringModuleMaturity>;
};

export type EngineeringAdr = {
  file: string;
  title: string;
  content: string;
};

export type EngineeringDetail = {
  id: string;
  specContent: string | null;
  tasksContent: string | null;
  adrs: EngineeringAdr[];
};

export type BackofficeArchitecture = {
  md: string;
  squads: SquadInfo[];
};

export type BackofficeSquads = {
  squads: SquadState[];
};

export type TaskGroupStatus = "NOT_STARTED" | "ACTIVE" | "DONE" | "CLOSED";
export type TaskPriority = "Alta" | "Média" | "Baixa";
export type TaskListType = "social" | "growth" | "tech" | "general";

export type TaskCustomField = {
  id?: string;
  task_id?: string;
  field_name: string;
  field_value: string;
};

export type TaskDependency = {
  id?: string;
  task_id?: string;
  depends_on_task_id: string;
  type?: string;
};

export type TaskSubtask = {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type VaultStatus = "active" | "expired" | "rotating" | "compromised" | "revoked";
export type VaultVisibility = "internal" | "client";
export type VaultSecretField = "username" | "email" | "password" | "other_access" | "token" | "recovery_codes" | "notes";

export type VaultSecrets = Partial<Record<VaultSecretField, string>>;

export type VaultCredentialSummary = {
  id: string;
  workspace_id: string;
  platform: string;
  label: string;
  account_hint: string | null;
  platform_url: string | null;
  visibility: VaultVisibility;
  status: VaultStatus;
  expires_at: string | null;
  owner_user_id: string | null;
  owner_name: string | null;
  version: number;
  last_rotated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VaultCredentialPayload = {
  platform: string;
  label: string;
  account_hint?: string | null;
  platform_url?: string | null;
  visibility: VaultVisibility;
  expires_at?: string | null;
  secrets: VaultSecrets;
};

export type VaultRevealResponse = {
  credential_id: string;
  secrets: VaultSecrets;
  expires_in_seconds: number;
};

export type ProjectType = "social" | "growth" | "tech" | "general";
export type ProjectStatus = "planned" | "active" | "on_hold" | "completed" | "cancelled" | "archived";
export type ProjectPace = "unknown" | "on_track" | "at_risk" | "off_track";

export type ProjectSummary = {
  id: string;
  workspace_id: string;
  name: string;
  code: string | null;
  project_type: ProjectType;
  status: ProjectStatus;
  owner_user_id: string | null;
  owner_name: string | null;
  start_at: string | null;
  due_at: string | null;
  cadence_days: number | null;
  client_visible: boolean;
  objective: string | null;
  deliverables_total: number;
  deliverables_done: number;
  deliverables_overdue: number;
  deliverables_blocked: number;
  completion_percentage: number;
  pace_status: ProjectPace;
  updated_at: string;
};

export type ContractScopeItem = {
  id: string;
  contract_id: string;
  title: string;
  description: string | null;
  quantity: string;
  unit: string;
  cadence: "one_off" | "weekly" | "biweekly" | "monthly" | "quarterly" | "custom";
  cadence_days: number | null;
  acceptance_required: boolean;
  acceptance_criteria: string | null;
  client_visible: boolean;
  status: "active" | "paused" | "removed";
  delivered_total: number;
  accepted_total: number;
};

export type ProjectContract = {
  id: string;
  project_id: string;
  version: number;
  title: string;
  status: "draft" | "pending_signature" | "active" | "expired" | "terminated" | "superseded";
  starts_at: string | null;
  ends_at: string | null;
  total_value: string | null;
  currency: string;
  source_provider: string | null;
  external_id: string | null;
  signed_at: string | null;
  client_visible: boolean;
  scope_items: ContractScopeItem[];
};

export type ProjectDeliverable = {
  id: string;
  project_id: string;
  scope_item_id: string | null;
  phase_id: string | null;
  title: string;
  status: DeliverableStatus;
  due_at: string | null;
  completed_at: string | null;
  approval_status: ApprovalStatus | null;
  updated_at: string;
};

export type ProjectPhaseStatus = "planned" | "development" | "blocked" | "internal_testing" | "client_validation" | "released";
export type ProjectPhase = {
  id: string;
  project_id: string;
  sequence: number;
  name: string;
  description: string | null;
  status: ProjectPhaseStatus;
  client_summary: string | null;
  client_visible: boolean;
  starts_at: string | null;
  due_at: string | null;
  released_at: string | null;
  deliverables_total: number;
  deliverables_done: number;
};

export type ProjectDocument = {
  id: string;
  project_id: string;
  kind: "proposal" | "technical_spec" | "scope" | "acceptance" | "release_notes";
  title: string;
  url: string;
  client_visible: boolean;
  created_at: string;
};

export type ProjectUpdateEntry = {
  id: string;
  project_id: string;
  phase_id: string | null;
  kind: "progress" | "blocker" | "testing" | "release" | "note";
  summary: string;
  detail: string | null;
  client_visible: boolean;
  created_at: string;
};

export type ProjectDetail = ProjectSummary & {
  contracts: ProjectContract[];
  deliverables: ProjectDeliverable[];
  phases: ProjectPhase[];
  documents: ProjectDocument[];
  updates: ProjectUpdateEntry[];
};

export type ProjectPayload = {
  name: string;
  code?: string | null;
  project_type?: ProjectType;
  status?: ProjectStatus;
  start_at?: string | null;
  due_at?: string | null;
  cadence_days?: number | null;
  client_visible?: boolean;
  objective?: string | null;
};

export type TaskSubtaskInput = {
  id?: string;
  title: string;
  is_completed: boolean;
};

export type TaskPayload = {
  title: string;
  description?: string | null;
  status: string;
  group_status: TaskGroupStatus;
  priority?: TaskPriority | null;
  assignee_id?: string | null;
  owner_id?: string | null;
  due_date?: string | null;
  recurrence?: "none" | "weekly" | "monthly" | null;
  custom_fields?: TaskCustomField[];
  dependencies?: TaskDependency[];
  subtasks?: TaskSubtaskInput[];
};

export type TaskSummary = TaskPayload & {
  id: string;
  list_id: string;
  external_source?: "clickup" | null;
  external_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskListSummary = {
  id: string;
  workspace_id: string;
  name: string;
  type: TaskListType;
  created_at: string;
  updated_at: string;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

/** URL absoluta de um endpoint da API — para navegação de página inteira
 *  (fluxo OAuth), onde não dá para usar fetch. */
export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = "Falha de comunicação com a API.";
    try {
      const body = await response.json();
      message = body.detail ?? message;
    } catch {
      // Keep generic message when the API returned no JSON body.
    }
    throw new Error(message);
  }

  if (response.status === 204 || response.headers.get("Content-Length") === "0") {
    return undefined as T;
  }
  const body = await response.text();
  return body ? JSON.parse(body) as T : undefined as T;
}

async function requestText(path: string): Promise<string> {
  const response = await fetch(`${apiBaseUrl}${path}`, { credentials: "include" });
  if (!response.ok) {
    let message = "Falha de comunicação com a API.";
    try {
      message = (await response.json()).detail ?? message;
    } catch {
      // Sem corpo JSON: mantém a mensagem genérica.
    }
    throw new Error(message);
  }
  return response.text();
}

export const api = {
  health: () => request<ApiHealth>("/health"),
  me: () => request<CurrentUser>("/auth/me"),
  login: (email: string, password: string) =>
    request<{ user: CurrentUser; expires_at: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ status: string }>("/auth/logout", { method: "POST" }),
  workspaces: () => request<WorkspaceSummary[]>("/workspaces"),
  teams: (tenantOrganizationId: string) =>
    request<TeamSummary[]>(`/teams?tenant_organization_id=${encodeURIComponent(tenantOrganizationId)}`),
  createTeam: (tenantOrganizationId: string, name: string) =>
    request<TeamSummary>("/teams", {
      method: "POST",
      body: JSON.stringify({ tenant_organization_id: tenantOrganizationId, name }),
    }),
  tenantMembers: (tenantOrganizationId: string) =>
    request<TenantMembershipSummary[]>(`/tenants/${tenantOrganizationId}/members`),
  upsertTenantMember: (tenantOrganizationId: string, userId: string, role: TenantRole) =>
    request<TenantMembershipSummary[]>(`/tenants/${tenantOrganizationId}/members`, {
      method: "PUT",
      body: JSON.stringify({ user_id: userId, role }),
    }),
  teamMembers: (teamId: string) => request<TeamMemberSummary[]>(`/teams/${teamId}/members`),
  upsertTeamMember: (teamId: string, userId: string, role: TeamRole) =>
    request<TeamMemberSummary[]>(`/teams/${teamId}/members`, {
      method: "PUT",
      body: JSON.stringify({ user_id: userId, role }),
    }),
  deleteTeamMember: (teamId: string, userId: string) =>
    request<TeamMemberSummary[]>(`/teams/${teamId}/members/${userId}`, { method: "DELETE" }),
  workspaceAssignments: (workspaceId: string) =>
    request<WorkspaceAssignmentSummary[]>(`/workspaces/${workspaceId}/assignments`),
  upsertWorkspaceAssignment: (
    workspaceId: string,
    payload: { user_id?: string | null; team_id?: string | null; role: WorkspaceAssignmentRole },
  ) => request<WorkspaceAssignmentSummary[]>(`/workspaces/${workspaceId}/assignments`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
  deleteWorkspaceAssignment: (workspaceId: string, assignmentId: string) =>
    request<WorkspaceAssignmentSummary[]>(`/workspaces/${workspaceId}/assignments/${assignmentId}`, {
      method: "DELETE",
    }),
  favoriteWorkspace: (workspaceId: string, favorite: boolean) =>
    request<WorkspaceSummary[]>(`/workspaces/${workspaceId}/favorite`, {
      method: favorite ? "PUT" : "DELETE",
    }),
  workspaceViews: () => request<WorkspaceSavedView[]>("/workspaces/views"),
  createWorkspaceView: (payload: { name: string; tenant_organization_id?: string | null; filters: WorkspaceSavedViewFilters }) =>
    request<WorkspaceSavedView>("/workspaces/views", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteWorkspaceView: (viewId: string) =>
    request<WorkspaceSavedView[]>(`/workspaces/views/${viewId}`, { method: "DELETE" }),
  aiContentRequests: (workspaceId: string) =>
    request<AiContentRequest[]>(`/workspaces/${workspaceId}/ai/content`),
  createAiContentRequest: (
    workspaceId: string,
    payload: {
      brief: string;
      channels: AiContentPost["channel"][];
      quantity: number;
      tone?: string | null;
      objective?: string | null;
      methodology_refs?: string[];
    },
  ) => request<AiContentRequest>(`/workspaces/${workspaceId}/ai/content`, {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  vaultCredentials: (workspaceId: string) =>
    request<VaultCredentialSummary[]>(`/workspaces/${workspaceId}/vault`),
  createVaultCredential: (workspaceId: string, payload: VaultCredentialPayload) =>
    request<VaultCredentialSummary>(`/workspaces/${workspaceId}/vault`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateVaultCredential: (workspaceId: string, credentialId: string, payload: Partial<VaultCredentialPayload>) =>
    request<VaultCredentialSummary>(`/workspaces/${workspaceId}/vault/${credentialId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  setVaultCredentialStatus: (workspaceId: string, credentialId: string, status: VaultStatus) =>
    request<VaultCredentialSummary>(`/workspaces/${workspaceId}/vault/${credentialId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  revealVaultCredential: (workspaceId: string, credentialId: string, reason: string) =>
    request<VaultRevealResponse>(`/workspaces/${workspaceId}/vault/${credentialId}/reveal`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  copyVaultSecret: (workspaceId: string, credentialId: string, field: VaultSecretField, reason: string) =>
    request<{ credential_id: string; field: VaultSecretField; value: string; expires_in_seconds: number }>(
      `/workspaces/${workspaceId}/vault/${credentialId}/copy`,
      { method: "POST", body: JSON.stringify({ field, reason }) },
    ),
  projects: (workspaceId: string) => request<ProjectSummary[]>(`/workspaces/${workspaceId}/projects`),
  project: (projectId: string) => request<ProjectDetail>(`/projects/${projectId}`),
  createProject: (workspaceId: string, payload: ProjectPayload) =>
    request<ProjectDetail>(`/workspaces/${workspaceId}/projects`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createProjectContract: (projectId: string, payload: { title: string; status?: ProjectContract["status"]; starts_at?: string | null; ends_at?: string | null; total_value?: number | null }) =>
    request<ProjectDetail>(`/projects/${projectId}/contracts`, { method: "POST", body: JSON.stringify(payload) }),
  createContractScopeItem: (contractId: string, payload: { title: string; quantity?: number; unit?: string; cadence?: ContractScopeItem["cadence"]; acceptance_criteria?: string | null }) =>
    request<ProjectDetail>(`/contracts/${contractId}/scope-items`, { method: "POST", body: JSON.stringify(payload) }),
  createProjectDeliverable: (projectId: string, payload: { title: string; scope_item_id?: string | null; phase_id?: string | null; status?: DeliverableStatus; due_at?: string | null }) =>
    request<ProjectDetail>(`/projects/${projectId}/deliverables`, { method: "POST", body: JSON.stringify(payload) }),
  createProjectPhase: (projectId: string, payload: { sequence: number; name: string; description?: string | null; status?: ProjectPhaseStatus; client_summary?: string | null; client_visible?: boolean }) =>
    request<ProjectDetail>(`/projects/${projectId}/phases`, { method: "POST", body: JSON.stringify(payload) }),
  createProjectDocument: (projectId: string, payload: { kind: ProjectDocument["kind"]; title: string; url: string; client_visible?: boolean }) =>
    request<ProjectDetail>(`/projects/${projectId}/documents`, { method: "POST", body: JSON.stringify(payload) }),
  createProjectUpdate: (projectId: string, payload: { phase_id?: string | null; kind?: ProjectUpdateEntry["kind"]; summary: string; detail?: string | null; client_visible?: boolean }) =>
    request<ProjectDetail>(`/projects/${projectId}/updates`, { method: "POST", body: JSON.stringify(payload) }),
  clients: () => request<ClientSummary[]>("/clients"),
  getMyDeliverables: () => request<DeliverableSummary[]>("/clients/deliverables/me"),
  createClient: (payload: ClientPayload) =>
    request<ClientPortal>("/clients", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateClient: (clientId: string, payload: Partial<ClientPayload>) =>
    request<ClientPortal>(`/workspaces/${clientId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  clientPortal: (clientId: string) => request<ClientPortal>(`/workspaces/${clientId}`),
  createArtifact: (clientId: string, payload: ArtifactPayload) =>
    request<ClientPortal>(`/workspaces/${clientId}/artifacts`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateArtifact: (clientId: string, artifactId: string, payload: Partial<ArtifactPayload>) =>
    request<ClientPortal>(`/workspaces/${clientId}/artifacts/${artifactId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteArtifact: (clientId: string, artifactId: string) =>
    request<ClientPortal>(`/workspaces/${clientId}/artifacts/${artifactId}`, {
      method: "DELETE",
    }),
  createDeliverable: (clientId: string, payload: DeliverablePayload) =>
    request<ClientPortal>(`/workspaces/${clientId}/deliverables`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateDeliverable: (clientId: string, deliverableId: string, payload: Partial<DeliverablePayload>) =>
    request<ClientPortal>(`/workspaces/${clientId}/deliverables/${deliverableId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteDeliverable: (clientId: string, deliverableId: string) =>
    request<ClientPortal>(`/workspaces/${clientId}/deliverables/${deliverableId}`, {
      method: "DELETE",
    }),
  createApproval: (clientId: string, deliverableId: string, comment?: string) =>
    request<ClientPortal>(`/workspaces/${clientId}/approvals`, {
      method: "POST",
      body: JSON.stringify({ deliverable_id: deliverableId, comment }),
    }),
  decideApproval: (clientId: string, approvalId: string, status: Exclude<ApprovalStatus, "pending">) =>
    request<ClientPortal>(`/workspaces/${clientId}/approvals/${approvalId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  syncClickUp: (clientId: string) =>
    request<ClientPortal>(`/workspaces/${clientId}/sync/clickup`, {
      method: "POST",
    }),
  archiveClient: (clientId: string) =>
    request<void>(`/clients/${clientId}`, {
      method: "DELETE",
    }),
  leads: (clientId: string) => request<LeadSummary[]>(`/workspaces/${clientId}/leads`),
  createLead: (clientId: string, payload: LeadPayload) =>
    request<LeadSummary[]>(`/workspaces/${clientId}/leads`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateLead: (clientId: string, leadId: string, payload: Partial<LeadPayload>) =>
    request<LeadSummary[]>(`/workspaces/${clientId}/leads/${leadId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteLead: (clientId: string, leadId: string) =>
    request<LeadSummary[]>(`/workspaces/${clientId}/leads/${leadId}`, {
      method: "DELETE",
    }),
  finance: (clientId: string) => request<FinancialRecordSummary[]>(`/workspaces/${clientId}/finance`),
  createFinancialRecord: (clientId: string, payload: FinancialRecordPayload) =>
    request<FinancialRecordSummary[]>(`/workspaces/${clientId}/finance`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateFinancialRecord: (clientId: string, recordId: string, payload: Partial<FinancialRecordPayload>) =>
    request<FinancialRecordSummary[]>(`/workspaces/${clientId}/finance/${recordId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteFinancialRecord: (clientId: string, recordId: string) =>
    request<FinancialRecordSummary[]>(`/workspaces/${clientId}/finance/${recordId}`, {
      method: "DELETE",
    }),
  performanceOverview: (clientId: string) => request<PerformanceOverview>(`/workspaces/${clientId}/performance`),
  adsCampaigns: (clientId: string) =>
    request<AdsCampaignSummary[]>(`/workspaces/${clientId}/performance/google-ads/campaigns`),
  ga4Acquisition: (clientId: string) =>
    request<Ga4AcquisitionSummary[]>(`/workspaces/${clientId}/performance/ga4/acquisition`),
  gscQueries: (clientId: string) =>
    request<GscQuerySummary[]>(`/workspaces/${clientId}/performance/search-console/queries`),
  gtmSnapshots: (clientId: string) =>
    request<GtmSnapshotSummary[]>(`/workspaces/${clientId}/performance/gtm/snapshots`),
  createInvite: (clientId: string, email?: string | null) =>
    request<InviteCreated>(`/workspaces/${clientId}/invites`, {
      method: "POST",
      body: JSON.stringify({ email: email || null }),
    }),
  listInvites: (clientId: string) => request<InviteSummary[]>(`/workspaces/${clientId}/invites`),
  revokeInvite: (clientId: string, inviteId: string) =>
    request<InviteSummary[]>(`/workspaces/${clientId}/invites/${inviteId}`, { method: "DELETE" }),
  inviteInfo: (token: string) => request<InvitePublicInfo>(`/auth/invites/${token}`),
  acceptInvite: (token: string, payload: InviteAcceptPayload) =>
    request<{ user: CurrentUser; expires_at: string }>(`/auth/invites/${token}/accept`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  identities: () => request<IdentitySummary[]>("/auth/identities"),
  unlinkIdentity: (identityId: string) =>
    request<IdentitySummary[]>(`/auth/identities/${identityId}`, { method: "DELETE" }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ status: string; revoked_sessions: number }>("/auth/password", {
      method: "POST",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    }),
  createPasswordReset: (email: string) =>
    request<PasswordResetCreated>("/auth/password-resets", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  passwordResetInfo: (token: string) => request<PasswordResetInfo>(`/auth/password-resets/${token}`),
  confirmPasswordReset: (token: string, password: string) =>
    request<{ user: CurrentUser; expires_at: string }>(`/auth/password-resets/${token}/confirm`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  performanceConnections: (clientId: string) =>
    request<PerformanceConnection[]>(`/workspaces/${clientId}/performance/connections`),
  createPerformanceConnection: (clientId: string, payload: PerformanceConnectionPayload) =>
    request<PerformanceConnection[]>(`/workspaces/${clientId}/performance/connections`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePerformanceConnection: (clientId: string, connectionId: string, payload: Partial<PerformanceConnectionPayload>) =>
    request<PerformanceConnection[]>(`/workspaces/${clientId}/performance/connections/${connectionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  requestPerformanceSync: (clientId: string, provider: PerformanceProvider | "all" = "all") =>
    request<PerformanceSyncRun>(`/workspaces/${clientId}/performance/sync`, {
      method: "POST",
      body: JSON.stringify({ provider }),
    }),
  integrationsStatus: () => request<IntegrationsStatus>("/integrations/status"),
  
  getKommoConfig: (organizationId: string) => 
    request<KommoConfigResponse>(`/integrations/${organizationId}/kommo`),
  setupKommoConfig: (organizationId: string, payload: KommoConfigPayload) =>
    request<{ status: string }>(`/integrations/${organizationId}/kommo`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getKommoAnalytics: (organizationId: string) =>
    request<KommoMetricsResponse>(`/analytics/${organizationId}/kommo`),

  // Backoffice EG (dados internos do monorepo; EG admin only)
  adminIdeas: () => request<Partial<{ ideas: Idea[] }> & { ideas?: Idea[] }>("/backoffice/ideas"),
  saveAdminIdeas: (ideas: Idea[]) =>
    request<{ status: string }>("/backoffice/ideas", { method: "POST", body: JSON.stringify({ ideas }) }),
  adminIdeaDoc: (id: string) => requestText(`/backoffice/ideas/doc?id=${encodeURIComponent(id)}`),
  saveAdminIdeaDoc: (id: string, content: string) =>
    request<{ status: string }>(`/backoffice/ideas/doc/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ content }) }),
  adminEngineering: () => request<EngineeringData>("/backoffice/engineering"),
  adminEngineeringDetail: (modId: string) =>
    request<EngineeringDetail>(`/backoffice/engineering/${encodeURIComponent(modId)}`),
  saveEngineeringDoc: (modId: string, docType: string, content: string, filename?: string) =>
    request<{ status: string }>(`/backoffice/engineering/${encodeURIComponent(modId)}/doc`, { method: "PUT", body: JSON.stringify({ doc_type: docType, content, filename }) }),
  adminArchitecture: () => request<BackofficeArchitecture>("/backoffice/architecture"),
  adminSquads: () => request<BackofficeSquads>("/backoffice/squads"),
  adminStack: () => request<Partial<StackRadar> & { techs?: Tech[] }>("/backoffice/stack"),
  saveAdminStack: (techs: Tech[]) =>
    request<{ status: string }>("/backoffice/stack", { method: "POST", body: JSON.stringify({ techs }) }),
  listFiles: (clientId: string) => request<ClientFileSummary[]>(`/workspaces/${clientId}/files`),
  uploadFile: (clientId: string, file: File, visibility: ClientFileVisibility) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("visibility", visibility);
    return request<ClientFileSummary[]>(`/workspaces/${clientId}/files`, { method: "POST", body: formData });
  },
  fileDownloadUrl: (clientId: string, fileId: string) =>
    request<ClientFileDownload>(`/workspaces/${clientId}/files/${fileId}/download`),
  deleteFile: (clientId: string, fileId: string) =>
    request<ClientFileSummary[]>(`/workspaces/${clientId}/files/${fileId}`, { method: "DELETE" }),
  
  // Task Management
  taskLists: (workspaceId: string) => 
    request<TaskListSummary[]>(`/workspaces/${workspaceId}/task-lists`),
  createTaskList: (workspaceId: string, name: string, type: TaskListType) =>
    request<TaskListSummary>(`/workspaces/${workspaceId}/task-lists`, {
      method: "POST",
      body: JSON.stringify({ name, type }),
    }),
  tasksInList: (listId: string) =>
    request<TaskSummary[]>(`/task-lists/${listId}/tasks`),
  createTask: (listId: string, payload: TaskPayload) =>
    request<TaskSummary>(`/task-lists/${listId}/tasks`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTask: (taskId: string, payload: Partial<TaskPayload>) =>
    request<TaskSummary>(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteTask: (taskId: string) =>
    request<void>(`/tasks/${taskId}`, { method: "DELETE" }),
};
