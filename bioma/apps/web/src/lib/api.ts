import type { Idea } from "../types/idea";
import type { SquadInfo, SquadState } from "../types/state";
import type { StackRadar, Tech } from "../types/stack";

export type ApiHealth = {
  status: string;
  checked_at: string;
};

export type ClientModule = "hub" | "content" | "files" | "commercial" | "finance" | "analytics" | "integrations" | "engineering";

export type UserOrganization = {
  id: string;
  name: string;
  slug: string;
  role: "eg_admin" | "client_user";
  enabled_modules: ClientModule[];
};

export type CurrentUser = {
  id: string;
  email: string;
  display_name: string;
  has_password: boolean;
  organizations: UserOrganization[];
};

export type ClientStatus = "onboarding" | "active" | "paused" | "completed" | "archived";

export type ClientSummary = {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  name: string;
  status: ClientStatus;
  responsible_name: string | null;
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

export type AiContentImage = {
  title: string;
  channel: "instagram" | "linkedin" | "facebook" | "tiktok" | "youtube";
  aspect_ratio: string;
  visual_description: string;
  prompt_en: string;
  provider: string;
  preview_url: string | null;
};

export type AiContentVideoScript = {
  title: string;
  channel: "instagram" | "linkedin" | "facebook" | "tiktok" | "youtube";
  format: string;
  duration_seconds: number;
  hook_0_3s: string;
  script_body: string;
  cta_final: string;
  broll_notes: string;
  camera_angle_notes?: string | null;
};

export type AiContentRequest = {
  id: string;
  workspace_id: string;
  content_type: "social_posts" | "image_generation" | "video_scripts";
  status: "queued" | "running" | "ready" | "error" | "cancelled";
  brief: string;
  channels: AiContentPost["channel"][];
  quantity: number;
  tone: string | null;
  objective: string | null;
  methodology_refs: string[];
  provider: string | null;
  model: string | null;
  generation_mode: "live" | "preview" | "manual" | null;
  output: {
    strategy_note: string;
    posts?: AiContentPost[];
    images?: AiContentImage[];
    video_scripts?: AiContentVideoScript[];
  } | null;
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

export type PerformanceProvider = "google_ads" | "ga4" | "search_console" | "gtm" | "meta_ads" | "linkedin_ads";

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

export type SocialDailyMetric = {
  id: string;
  workspace_id: string;
  client_id: string | null;
  date: string;
  account_id: string | null;
  account_name: string | null;
  campaign_id: string;
  campaign_name: string;
  impressions: number;
  clicks: number;
  spend_cents: number;
  conversions: number;
  leads: number;
  revenue_cents: number;
  ctr: number;
  cpc_cents: number;
  cpa_cents: number;
  roas: number;
  created_at: string;
};

export type PerformanceAiSummaryInsight = {
  channel: string;
  title: string;
  finding: string;
  action_recommendation: string;
  impact_level: "high" | "medium" | "low";
};

export type PerformanceAiSummaryResponse = {
  workspace_id: string;
  generated_at: string;
  summary_text: string;
  total_spend_cents: number;
  total_leads: number;
  overall_cpa_cents: number;
  insights: PerformanceAiSummaryInsight[];
};

export type WhatsAppProviderType = "evolution" | "meta_cloud" | "zapi" | "custom";

export type WhatsAppProviderConfigSummary = {
  id: string;
  workspace_id: string;
  provider_type: WhatsAppProviderType;
  api_url: string | null;
  instance_name: string | null;
  phone_number: string | null;
  status: "active" | "inactive" | "error";
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type WhatsAppMessageLogSummary = {
  id: string;
  workspace_id: string;
  provider_type: WhatsAppProviderType;
  to_number: string;
  message_type: "text" | "template" | "media";
  payload: Record<string, unknown>;
  status: "queued" | "sent" | "delivered" | "read" | "failed";
  error_message: string | null;
  sent_at: string;
};

export type PilarType = "oferta" | "demanda" | "conversao" | "onboarding" | "planning";

export type SquadDefinitionSummary = {
  id: string;
  workspace_id: string;
  pilar: PilarType;
  squad_slug: string;
  squad_name: string;
  description: string | null;
  agents_config: Record<string, unknown>[];
  pipeline_yaml: string | null;
  status: "active" | "paused";
  created_at: string;
  updated_at: string;
};

export type SquadExecutionSummary = {
  id: string;
  workspace_id: string;
  squad_id: string | null;
  pilar: PilarType;
  squad_name: string;
  triggered_by: string;
  status: "running" | "completed" | "failed";
  generation_mode: "live" | "preview" | "manual";
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  estimated_cost_cents: number;
  execution_logs: Array<{
    timestamp: string;
    agent: string;
    message: string;
  }>;
  started_at: string;
  completed_at: string | null;
};

export type FinOpsSummaryResponse = {
  workspace_id: string;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_cost_cents: number;
  total_executions: number;
};

export type MarketResearchFocusOption = {
  key: string;
  label: string;
  description: string;
};

export type MarketResearchRefinement = {
  sector_interpretation: string;
  assumptions: string[];
  focus_options: MarketResearchFocusOption[];
  generation_mode: "live" | "preview" | "manual";
};

export type MarketResearchSource = {
  url: string;
  title: string | null;
  publisher: string | null;
  publication_date: string | null;
  consulted_at: string | null;
};

export type MarketResearchReport = {
  title: string;
  executive_summary: string;
  market_overview: {
    description: string;
    market_size_and_segments: string[];
    business_models: string[];
    growth_outlook: string;
    trends: string[];
    source_urls: string[];
  };
  commercial_process: {
    sales_strategies: string[];
    acquisition_and_retention: string[];
    buying_journey: string[];
    qualification_signals: string[];
    source_urls: string[];
  };
  challenges: Array<{
    challenge: string;
    business_impact: string;
    opportunity: string;
    source_urls: string[];
  }>;
  market_leaders: Array<{
    name: string;
    segment: string;
    success_strategy: string;
    source_urls: string[];
  }>;
  terminology: Array<{
    term: string;
    definition: string;
    source_urls: string[];
  }>;
  growth_opportunities: Array<{
    opportunity: string;
    recommended_service: string;
    rationale: string;
    priority: "high" | "medium" | "low";
    source_urls: string[];
  }>;
  prospecting_playbook: {
    opening_angles: string[];
    qualification_questions: string[];
    likely_objections: string[];
    credibility_cautions: string[];
  };
  content_opportunities: Array<{
    theme: string;
    recommended_format: string;
    funnel_stage: "awareness" | "consideration" | "decision" | "retention";
    rationale: string;
    source_urls: string[];
  }>;
  caveats: string[];
  sources: MarketResearchSource[];
};

export type MarketResearchSummary = {
  id: string;
  workspace_id: string;
  version: number;
  sector: string;
  geographic_scope: string;
  objective: string | null;
  selected_focus: MarketResearchFocusOption[];
  status: "running" | "completed" | "failed" | "archived";
  generation_mode: "live" | "preview" | "manual";
  provider: string | null;
  model: string | null;
  token_usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  estimated_cost_cents: number | null;
  source_count: number;
  client_visible: boolean;
  error_message: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketResearchDetail = MarketResearchSummary & {
  report: MarketResearchReport | null;
  sources: MarketResearchSource[];
};

export type BrandBookSummary = {
  id: string;
  workspace_id: string;
  version: number;
  tom_de_voz: string;
  arquetipo: string;
  posicionamento: string | null;
  proposta_valor: string | null;
  regras_copy: string[];
  paleta_cores: string[];
  status: string;
  created_at: string;
  updated_at: string;
};

export type EditorialCalendarItemSummary = {
  id: string;
  workspace_id: string;
  title: string;
  content_type: "social_post" | "image_ad" | "video_script" | "article";
  channel: "instagram" | "facebook" | "linkedin" | "youtube" | "tiktok" | "blog";
  scheduled_at: string | null;
  stage: "ideation" | "production" | "review" | "approved" | "scheduled" | "published";
  post_text: string | null;
  media_urls: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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

export type WikiCategory = "comercial" | "rh" | "operacao" | "geral";

export type WikiAttachment = {
  id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
};

export type WikiDocumentSummary = {
  id: string;
  category: WikiCategory;
  title: string;
  updated_at: string;
  attachment_count: number;
};

export type WikiDocumentDetail = {
  id: string;
  category: WikiCategory;
  title: string;
  content: string;
  updated_at: string;
  attachments: WikiAttachment[];
};

export type WikiDocumentPayload = {
  category?: WikiCategory;
  title?: string;
  content?: string;
};

export type WikiAttachmentDownload = {
  url: string;
  file_name: string;
};

export type WikiImportResult = {
  imported: string[];
  skipped: string[];
  available: boolean;
};

export type CommercialPilar = "oferta" | "demanda" | "conversao";
export type CommercialMaturityLevel = "semente" | "muda" | "arvore" | "floresta";
export type CommercialPlanStatus = "em_andamento" | "concluido" | "pausado";

export type CommercialScoreSummary = {
  id: string;
  workspace_id: string;
  oferta_score: number;
  demanda_score: number;
  conversao_score: number;
  oferta_level: number;
  demanda_level: number;
  conversao_level: number;
  gargalo_prioritario: CommercialPilar;
  maturity_level: CommercialMaturityLevel;
  updated_at: string;
  created_at: string;
};

export type DiagnosticAnswerSummary = {
  id: string;
  workspace_id: string;
  pilar: CommercialPilar;
  regua_level: 1 | 2;
  question_key: string;
  score_value: number;
  notes: string | null;
  updated_at: string;
};

export type ActionPlanSummary = {
  id: string;
  workspace_id: string;
  pilar_gargalo: CommercialPilar;
  sprint_title: string;
  sprint_goals: string;
  status: CommercialPlanStatus;
  start_date: string;
  end_date: string | null;
  created_at: string;
};

export type CommercialPortalResponse = {
  scores: CommercialScoreSummary;
  answers: DiagnosticAnswerSummary[];
  action_plans: ActionPlanSummary[];
};

// --- Kits & Logística ---
export type KitPieceSummary = {
  id: string;
  name: string;
  supplier?: string | null;
  unit_cost_cents: number;
  stock_qty: number;
  image_url?: string | null;
  status: "active" | "discontinued";
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type KitDefinitionSummary = {
  id: string;
  name: string;
  level: string;
  description?: string | null;
  status: "active" | "discontinued";
  pieces: Array<{ piece_id: string; quantity: number }>;
  total_cost_cents: number;
  created_at: string;
  updated_at: string;
};

export type KitShipmentSummary = {
  id: string;
  kit_definition_id: string;
  kit_name: string;
  client_id: string;
  client_name: string;
  status: "em_producao" | "enviado" | "entregue" | "cancelado";
  notes?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
  updated_at: string;
};

// --- RH & Rampagem ---
export type MilestoneTemplateSummary = {
  id: string;
  day_offset: number;
  title: string;
  description?: string | null;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
};

export type OnboardingPlanSummary = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  hire_date: string;
  milestones: Array<{
    template_id?: string | null;
    day_offset: number;
    title: string;
    status: "pending" | "done";
    completed_at?: string | null;
  }>;
  created_at: string;
  updated_at: string;
};

export type SatisfactionScoreSummary = {
  id: string;
  workspace_id: string;
  score: number;
  source: string;
  notes?: string | null;
  captured_at: string;
};

export type ManagerPortfolioWorkspace = {
  workspace_id: string;
  workspace_name: string;
  client_name: string;
  projects_total: number;
  deliverables_total: number;
  deliverables_done: number;
  deliverables_blocked: number;
  deliverables_overdue: number;
  completion_percentage: number;
  pace_status: "unknown" | "on_track" | "at_risk" | "off_track";
  latest_satisfaction_score?: number | null;
  latest_satisfaction_captured_at?: string | null;
};

export type ManagerPortfolioResponse = {
  user_id: string;
  user_name: string;
  workspaces: ManagerPortfolioWorkspace[];
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
  github_token_configured: boolean;
  storage_configured: boolean;
  google_oauth_configured: boolean;
  app_env: string;
};

export type AiQuotaSnapshot = {
  id: string;
  total_units: string | null;
  used_units: string | null;
  remaining_units: string | null;
  unit: string;
  source: "api" | "manual" | "configured" | "unavailable";
  period_start: string | null;
  period_end: string | null;
  measured_at: string;
  notes: string | null;
};

export type AiSubscription = {
  id: string;
  provider: string;
  product_name: string;
  billing_mode: "subscription" | "api" | "hybrid";
  billing_cycle: "monthly" | "annual" | "custom";
  billing_cycle_months: number;
  amount_cents: number;
  monthly_equivalent_cents: number;
  currency: string;
  seats: number;
  status: "active" | "paused" | "cancelled";
  renews_at: string | null;
  owner_label: string | null;
  notes: string | null;
  latest_quota: AiQuotaSnapshot | null;
  created_at: string;
  updated_at: string;
};

export type AiSubscriptionPayload = {
  provider: string;
  product_name: string;
  billing_mode?: AiSubscription["billing_mode"];
  billing_cycle?: AiSubscription["billing_cycle"];
  billing_cycle_months?: number;
  amount_cents?: number;
  currency?: string;
  seats?: number;
  status?: AiSubscription["status"];
  renews_at?: string | null;
  owner_label?: string | null;
  notes?: string | null;
};

export type AiQuotaPayload = {
  total_units: string | null;
  used_units: string | null;
  unit: string;
  source: AiQuotaSnapshot["source"];
  period_start?: string | null;
  period_end?: string | null;
  notes?: string | null;
};

export type AiFinOpsDashboard = {
  subscriptions: AiSubscription[];
  totals_by_currency: Array<{
    currency: string;
    committed_monthly_cents: number;
    measured_usage_cents: number;
  }>;
  usage_current_month: Array<{
    provider: string;
    model: string | null;
    source: string;
    events: number;
    input_units: number;
    output_units: number;
    cached_units: number;
    known_cost_cents: number;
    unknown_cost_events: number;
    currency: string;
  }>;
  generated_at: string;
};

export type AiWorkflowStepDefinition = {
  key: string;
  name: string;
  description: string;
  interactive: boolean;
  capability: string | null;
};

export type AiWorkflowTemplate = {
  slug: string;
  name: string;
  version: number;
  description: string;
  source_ref: string;
  input_schema: Record<string, unknown>;
  steps: AiWorkflowStepDefinition[];
};

export type AiWorkflowDefinition = AiWorkflowTemplate & {
  id: string;
  status: "draft" | "active" | "retired";
  created_at: string;
};

export type AiWorkflowRun = {
  id: string;
  definition_id: string;
  definition_slug: string;
  definition_name: string;
  definition_version: number;
  workspace_id: string | null;
  status: "pending_approval" | "ready" | "running" | "completed" | "failed" | "cancelled";
  idempotency_key: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  current_step_key: string | null;
  estimated_cost_cents: number | null;
  actual_cost_cents: number;
  currency: string;
  approved_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  steps: Array<{
    id: string;
    step_key: string;
    position: number;
    name: string;
    interactive: boolean;
    status: "pending" | "running" | "waiting_approval" | "completed" | "failed" | "skipped";
    provider: string | null;
    model: string | null;
    output: Record<string, unknown> | null;
    cost_cents: number | null;
    started_at: string | null;
    finished_at: string | null;
  }>;
};

export type GitHubConnection = {
  id: string;
  project_id: string;
  repository: string;
  default_branch: string;
  status: "active" | "paused";
  updated_at: string;
};

export type GitHubProjectActivity = {
  project_id: string;
  repository: string;
  default_branch: string;
  fetched_at: string;
  issues: Array<{ number: number; title: string; state: string; url: string; labels: string[]; updated_at: string }>;
  pull_requests: Array<{ number: number; title: string; state: string; draft: boolean; url: string; source_branch: string; target_branch: string; updated_at: string }>;
  commits: Array<{ sha: string; message: string; url: string; author_name: string | null; authored_at: string | null }>;
};

export type ClientProfilePayload = {
  sector?: string | null;
  primary_offer?: string | null;
  initial_objective?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  business_address?: string | null;
  business_details?: string | null;
  target_audience?: string | null;
  competitors?: string | null;
  marketing_objectives?: string | null;
  marketing_history?: string | null;
  challenges_opportunities?: string | null;
  resources_budget?: string | null;
  tone_of_voice?: string | null;
  preferences_restrictions?: string | null;
};

export type ClientProfileSectionProgress = {
  key: string;
  label: string;
  filled: number;
  total: number;
  percentage: number;
};

export type ClientProfile = ClientProfilePayload & {
  workspace_id: string;
  completion_percentage: number;
  sections: ClientProfileSectionProgress[];
  updated_at: string | null;
};

export type GitHubIssueLink = {
  deliverable_id: string;
  repository: string;
  issue_number: number;
  issue_url: string;
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
  github_issue_number: number | null;
  github_issue_url: string | null;
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
  contract_id: string | null;
  planning_excerpt: string | null;
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

export type ProjectPlanItem = {
  id: string;
  plan_id: string;
  sequence: number;
  source_scope_item_id: string | null;
  phase_name: string;
  title: string;
  description: string | null;
  item_kind: "milestone" | "deliverable" | "content" | "campaign" | "technical_task";
  due_offset_days: number | null;
  client_visible: boolean;
  approval_required: boolean;
  github_eligible: boolean;
  selected: boolean;
  priority: "low" | "medium" | "high" | "critical";
  definition_of_done: string | null;
  subtasks: string[];
  metadata: Record<string, unknown>;
  materialized_phase_id: string | null;
  materialized_deliverable_id: string | null;
  github_issue_number: number | null;
  github_issue_url: string | null;
};

export type ProjectPlan = {
  id: string;
  project_id: string;
  source_contract_id: string | null;
  planning_intake_id: string | null;
  version: number;
  discipline: ProjectType;
  source_kind: "contract" | "briefing" | "onboarding" | "manual";
  status: "draft" | "approved" | "materialized" | "superseded";
  generation_mode: "live" | "preview" | "manual";
  title: string;
  objective: string | null;
  assumptions: string[];
  intake_snapshot: Record<string, unknown>;
  approved_at: string | null;
  materialized_at: string | null;
  created_at: string;
  updated_at: string;
  items: ProjectPlanItem[];
};

export type ProjectPlanningIntake = {
  id: string;
  project_id: string;
  schema_key: PlanningIntakeSchemaKey;
  schema_version: number;
  status: "draft" | "finalized";
  title: string;
  objective: string;
  answers: Record<string, unknown>;
  derived_context: Record<string, unknown>;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PlanningIntakeSchemaKey = "retail_v1" | "tech_v1" | "growth_social_v1";

export type PlanningIntakeField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "multi_text";
  options?: string[];
};

export type PlanningIntakeSchema = {
  schema_key: PlanningIntakeSchemaKey;
  schema_version: number;
  label: string;
  required_fields: string[];
  fields: PlanningIntakeField[];
  marketing_maturities: string[];
  commercial_maturities: string[];
  marketing_goals_by_maturity: Record<string, string[]>;
  commercial_goals_by_maturity: Record<string, string[]>;
};

export type PlanningPortfolioItem = {
  project_id: string;
  project_name: string;
  project_type: ProjectSummary["project_type"];
  project_status: ProjectSummary["status"];
  workspace_id: string;
  client_name: string;
  intake_id: string | null;
  intake_schema_key: PlanningIntakeSchemaKey | null;
  intake_status: "draft" | "finalized" | null;
  plan_id: string | null;
  plan_title: string | null;
  plan_version: number | null;
  plan_status: ProjectPlan["status"] | null;
  generation_mode: ProjectPlan["generation_mode"] | null;
  updated_at: string;
};

export type ProjectDetail = ProjectSummary & {
  contracts: ProjectContract[];
  deliverables: ProjectDeliverable[];
  phases: ProjectPhase[];
  documents: ProjectDocument[];
  updates: ProjectUpdateEntry[];
  plans: ProjectPlan[];
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

async function requestBlob(path: string): Promise<Blob> {
  const response = await fetch(`${apiBaseUrl}${path}`, { credentials: "include" });
  if (!response.ok) {
    let message = "Falha ao baixar o arquivo.";
    try {
      const body = await response.json();
      message = body.detail ?? message;
    } catch {
      // Keep the generic message for non-JSON failures.
    }
    throw new Error(message);
  }
  return response.blob();
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
  me: async () => {
    const user = await request<CurrentUser>("/auth/me");
    try { localStorage.setItem("bioma_user_cache", JSON.stringify(user)); } catch {}
    return user;
  },
  login: async (email: string, password: string, remember_me: boolean = true) => {
    const res = await request<{ user: CurrentUser; expires_at: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, remember_me }),
    });
    try { localStorage.setItem("bioma_user_cache", JSON.stringify(res.user)); } catch {}
    return res;
  },
  logout: async () => {
    try { localStorage.removeItem("bioma_user_cache"); } catch {}
    return request<{ status: string }>("/auth/logout", { method: "POST" });
  },
  sessions: () => request<Array<{ id: string; created_at: string; expires_at: string; is_current: boolean }>>("/auth/sessions"),
  revokeSession: (sessionId: string) => request<{ status: string }>(`/auth/sessions/${sessionId}`, { method: "DELETE" }),
  revokeOtherSessions: () => request<{ status: string }>("/auth/sessions/other", { method: "DELETE" }),
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
      content_type?: "social_posts" | "image_generation" | "video_scripts";
      brief: string;
      channels: AiContentPost["channel"][];
      quantity: number;
      tone?: string | null;
      objective?: string | null;
      methodology_refs?: string[];
      image_provider?: "dalle_3" | "flux" | "higgsfield" | "custom";
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
  createProjectDocument: (projectId: string, payload: { kind: ProjectDocument["kind"]; title: string; url: string; contract_id?: string | null; planning_excerpt?: string | null; client_visible?: boolean }) =>
    request<ProjectDetail>(`/projects/${projectId}/documents`, { method: "POST", body: JSON.stringify(payload) }),
  createProjectUpdate: (projectId: string, payload: { phase_id?: string | null; kind?: ProjectUpdateEntry["kind"]; summary: string; detail?: string | null; client_visible?: boolean }) =>
    request<ProjectDetail>(`/projects/${projectId}/updates`, { method: "POST", body: JSON.stringify(payload) }),
  generateProjectPlan: (
    projectId: string,
    payload: {
      contract_id?: string | null;
      planning_intake_id?: string | null;
      source_kind?: ProjectPlan["source_kind"];
      briefing?: string | null;
      technical_context?: string | null;
      objective?: string | null;
      social_approval_flow?: "adaptive" | "idea_before_production" | "after_production" | "final_only";
    },
  ) =>
    request<ProjectPlan>(`/projects/${projectId}/plans/generate`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  projectPlanningIntakeSchema: (projectId: string, schemaKey: PlanningIntakeSchemaKey = "retail_v1") =>
    request<PlanningIntakeSchema>(`/projects/${projectId}/planning-intake-schema/${schemaKey}`),
  planningPortfolio: () => request<PlanningPortfolioItem[]>("/backoffice/planning-portfolio"),
  projectPlanningIntakes: (projectId: string) =>
    request<ProjectPlanningIntake[]>(`/projects/${projectId}/planning-intakes`),
  createProjectPlanningIntake: (
    projectId: string,
    payload: { schema_key?: PlanningIntakeSchemaKey; title: string; objective: string; answers: Record<string, unknown> },
  ) => request<ProjectPlanningIntake>(`/projects/${projectId}/planning-intakes`, {
    method: "POST", body: JSON.stringify(payload),
  }),
  updateProjectPlanningIntake: (
    intakeId: string,
    payload: { title?: string; objective?: string; answers?: Record<string, unknown> },
  ) => request<ProjectPlanningIntake>(`/project-planning-intakes/${intakeId}`, {
    method: "PATCH", body: JSON.stringify(payload),
  }),
  finalizeProjectPlanningIntake: (intakeId: string) =>
    request<ProjectPlanningIntake>(`/project-planning-intakes/${intakeId}/finalize`, { method: "POST" }),
  approveProjectPlan: (planId: string) =>
    request<ProjectPlan>(`/project-plans/${planId}/approve`, {
      method: "POST",
      body: JSON.stringify({ confirm: true }),
    }),
  updateProjectPlanItem: (
    itemId: string,
    payload: Partial<Pick<
      ProjectPlanItem,
      "selected" | "phase_name" | "title" | "description" | "due_offset_days" |
      "client_visible" | "approval_required" | "priority" | "definition_of_done" | "subtasks"
    >>,
  ) =>
    request<ProjectPlan>(`/project-plan-items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  materializeProjectPlan: (planId: string) =>
    request<ProjectDetail>(`/project-plans/${planId}/materialize`, {
      method: "POST",
      body: JSON.stringify({ confirm: true }),
    }),
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
  aiFinOps: () => request<AiFinOpsDashboard>("/backoffice/ai-operations/finops"),
  createAiSubscription: (payload: AiSubscriptionPayload) =>
    request<AiFinOpsDashboard>("/backoffice/ai-operations/subscriptions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAiSubscription: (subscriptionId: string, payload: Partial<AiSubscriptionPayload>) =>
    request<AiFinOpsDashboard>(`/backoffice/ai-operations/subscriptions/${subscriptionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  recordAiQuota: (subscriptionId: string, payload: AiQuotaPayload) =>
    request<AiFinOpsDashboard>(`/backoffice/ai-operations/subscriptions/${subscriptionId}/quota`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  aiWorkflowTemplates: () =>
    request<AiWorkflowTemplate[]>("/backoffice/ai-operations/workflow-templates"),
  aiWorkflowDefinitions: () =>
    request<AiWorkflowDefinition[]>("/backoffice/ai-operations/workflow-definitions"),
  installAiWorkflowTemplate: (slug: string) =>
    request<AiWorkflowDefinition[]>(`/backoffice/ai-operations/workflow-templates/${slug}/install`, {
      method: "POST",
    }),
  aiWorkflowRuns: () =>
    request<AiWorkflowRun[]>("/backoffice/ai-operations/workflow-runs"),
  createAiWorkflowRun: (payload: {
    definition_id: string;
    workspace_id?: string | null;
    idempotency_key: string;
    input: Record<string, unknown>;
    estimated_cost_cents?: number | null;
    currency?: string;
  }) =>
    request<AiWorkflowRun>("/backoffice/ai-operations/workflow-runs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  approveAiWorkflowRun: (runId: string) =>
    request<AiWorkflowRun>(`/backoffice/ai-operations/workflow-runs/${runId}/approve`, {
      method: "POST",
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
  metaAdsDaily: (clientId: string) =>
    request<SocialDailyMetric[]>(`/workspaces/${clientId}/performance/meta-ads/daily`),
  linkedInAdsDaily: (clientId: string) =>
    request<SocialDailyMetric[]>(`/workspaces/${clientId}/performance/linkedin-ads/daily`),
  performanceAiSummary: (clientId: string) =>
    request<PerformanceAiSummaryResponse>(`/workspaces/${clientId}/performance/ai-summary`),
  whatsAppProviders: (workspaceId: string) =>
    request<WhatsAppProviderConfigSummary[]>(`/workspaces/${workspaceId}/whatsapp/providers`),
  saveWhatsAppProvider: (
    workspaceId: string,
    payload: {
      provider_type: WhatsAppProviderType;
      api_url?: string | null;
      api_token?: string | null;
      instance_name?: string | null;
      phone_number?: string | null;
      status?: "active" | "inactive" | "error";
      metadata?: Record<string, unknown>;
    }
  ) =>
    request<WhatsAppProviderConfigSummary>(`/workspaces/${workspaceId}/whatsapp/providers`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  sendWhatsAppMessage: (
    workspaceId: string,
    payload: {
      provider_type: WhatsAppProviderType;
      to_number: string;
      message_text: string;
      template_name?: string | null;
      template_variables?: string[];
    }
  ) =>
    request<WhatsAppMessageLogSummary>(`/workspaces/${workspaceId}/whatsapp/send`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  whatsAppLogs: (workspaceId: string) =>
    request<WhatsAppMessageLogSummary[]>(`/workspaces/${workspaceId}/whatsapp/logs`),
  squads: (workspaceId: string) =>
    request<SquadDefinitionSummary[]>(`/workspaces/${workspaceId}/squads`),
  runSquad: (
    workspaceId: string,
    payload: {
      pilar: PilarType;
      squad_slug: string;
      squad_name: string;
      input_data?: Record<string, unknown>;
    }
  ) =>
    request<SquadExecutionSummary>(`/workspaces/${workspaceId}/squads/run`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  squadExecutions: (workspaceId: string) =>
    request<SquadExecutionSummary[]>(`/workspaces/${workspaceId}/squads/executions`),
  squadFinOps: (workspaceId: string) =>
    request<FinOpsSummaryResponse>(`/workspaces/${workspaceId}/squads/finops`),
  marketResearches: (workspaceId: string) =>
    request<MarketResearchSummary[]>(`/workspaces/${workspaceId}/market-research`),
  refineMarketResearch: (
    workspaceId: string,
    payload: { sector: string; objective?: string | null; geographic_scope?: string },
  ) =>
    request<MarketResearchRefinement>(`/workspaces/${workspaceId}/market-research/refine`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  clientProfile: (workspaceId: string) =>
    request<ClientProfile>(`/workspaces/${workspaceId}/client-profile`),
  updateClientProfile: (workspaceId: string, payload: ClientProfilePayload) =>
    request<ClientProfile>(`/workspaces/${workspaceId}/client-profile`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  createMarketResearch: (
    workspaceId: string,
    payload: {
      sector: string;
      objective?: string | null;
      geographic_scope: string;
      selected_focus: MarketResearchFocusOption[];
    },
  ) =>
    request<MarketResearchDetail>(`/workspaces/${workspaceId}/market-research`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  marketResearch: (workspaceId: string, researchId: string) =>
    request<MarketResearchDetail>(`/workspaces/${workspaceId}/market-research/${researchId}`),
  brandBook: (workspaceId: string) =>
    request<BrandBookSummary>(`/workspaces/${workspaceId}/brand-book`),
  saveBrandBook: (
    workspaceId: string,
    payload: {
      tom_de_voz: string;
      arquetipo: string;
      posicionamento?: string | null;
      proposta_valor?: string | null;
      regras_copy?: string[];
      paleta_cores?: string[];
    }
  ) =>
    request<BrandBookSummary>(`/workspaces/${workspaceId}/brand-book`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  calendarItems: (workspaceId: string, stage?: string) =>
    request<EditorialCalendarItemSummary[]>(
      `/workspaces/${workspaceId}/calendar${stage ? `?stage=${stage}` : ""}`
    ),
  createCalendarItem: (
    workspaceId: string,
    payload: {
      title: string;
      content_type?: "social_post" | "image_ad" | "video_script" | "article";
      channel?: "instagram" | "facebook" | "linkedin" | "youtube" | "tiktok" | "blog";
      scheduled_at?: string | null;
      stage?: "ideation" | "production" | "review" | "approved" | "scheduled" | "published";
      post_text?: string | null;
      media_urls?: string[];
      metadata?: Record<string, unknown>;
    }
  ) =>
    request<EditorialCalendarItemSummary>(`/workspaces/${workspaceId}/calendar`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCalendarStage: (workspaceId: string, itemId: string, stage: string) =>
    request<EditorialCalendarItemSummary>(
      `/workspaces/${workspaceId}/calendar/${itemId}/stage?stage=${stage}`,
      { method: "PATCH" }
    ),
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
  githubConnection: (projectId: string) => request<GitHubConnection>(`/integrations/github/projects/${projectId}`),
  configureGitHubConnection: (projectId: string, payload: { repository: string; default_branch: string; status?: "active" | "paused" }) =>
    request<GitHubConnection>(`/integrations/github/projects/${projectId}`, { method: "PUT", body: JSON.stringify(payload) }),
  githubProjectActivity: (projectId: string, limit = 20) =>
    request<GitHubProjectActivity>(`/integrations/github/projects/${projectId}/activity?limit=${limit}`),
  publishGitHubProjectUpdate: (projectId: string, clientVisible = true) =>
    request<{
      project_id: string;
      project_update_id: string;
      idempotency_key: string;
      repository: string;
      client_visible: boolean;
      created_at: string;
    }>(`/integrations/github/projects/${projectId}/publish-update`, {
      method: "POST",
      body: JSON.stringify({
        confirm: true,
        idempotency_key: `github-${projectId}-${crypto.randomUUID()}`,
        client_visible: clientVisible,
        limit: 20,
      }),
    }),
  createGitHubIssue: (deliverableId: string, body?: string | null) =>
    request<GitHubIssueLink>(`/integrations/github/deliverables/${deliverableId}/issue`, {
      method: "POST",
      body: JSON.stringify({ body: body || null, confirm: true }),
    }),
  
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

  // Wiki EG (base de conhecimento interna; só EG admin)
  wikiDocuments: () => request<WikiDocumentSummary[]>("/backoffice/wiki/documents"),
  importCoreWikiDocuments: () =>
    request<WikiImportResult>("/backoffice/wiki/import-core", { method: "POST" }),
  wikiDocument: (id: string) => request<WikiDocumentDetail>(`/backoffice/wiki/documents/${id}`),
  createWikiDocument: (payload: WikiDocumentPayload) =>
    request<WikiDocumentDetail>("/backoffice/wiki/documents", { method: "POST", body: JSON.stringify(payload) }),
  updateWikiDocument: (id: string, payload: WikiDocumentPayload) =>
    request<WikiDocumentDetail>(`/backoffice/wiki/documents/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteWikiDocument: (id: string) =>
    request<void>(`/backoffice/wiki/documents/${id}`, { method: "DELETE" }),
  uploadWikiAttachment: (documentId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<WikiAttachment>(`/backoffice/wiki/documents/${documentId}/attachments`, { method: "POST", body: formData });
  },
  wikiAttachmentDownloadUrl: (attachmentId: string) =>
    request<WikiAttachmentDownload>(`/backoffice/wiki/attachments/${attachmentId}/download`),
  deleteWikiAttachment: (attachmentId: string) =>
    request<void>(`/backoffice/wiki/attachments/${attachmentId}`, { method: "DELETE" }),

  // Commercial Raio-X (3 Pilares: Oferta, Demanda, Conversao)
  commercialPortal: (workspaceId: string) =>
    request<CommercialPortalResponse>(`/workspaces/${workspaceId}/commercial`),
  answerDiagnosticQuestion: (
    workspaceId: string,
    payload: {
      pilar: CommercialPilar;
      regua_level: 1 | 2;
      question_key: string;
      score_value: number;
      notes?: string | null;
    }
  ) =>
    request<CommercialPortalResponse>(`/workspaces/${workspaceId}/commercial/diagnostic`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createActionPlan: (
    workspaceId: string,
    payload: {
      pilar_gargalo: CommercialPilar;
      sprint_title: string;
      sprint_goals: string;
    }
  ) =>
    request<CommercialPortalResponse>(`/workspaces/${workspaceId}/commercial/action-plans`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateActionPlanStatus: (
    workspaceId: string,
    planId: string,
    status: CommercialPlanStatus
  ) =>
    request<CommercialPortalResponse>(`/workspaces/${workspaceId}/commercial/action-plans/${planId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // --- Kits & Logística ---
  listKitPieces: () => request<KitPieceSummary[]>("/backoffice/logistics/pieces"),
  createKitPiece: (payload: Partial<KitPieceSummary>) =>
    request<KitPieceSummary>("/backoffice/logistics/pieces", { method: "POST", body: JSON.stringify(payload) }),
  listKitDefinitions: () => request<KitDefinitionSummary[]>("/backoffice/logistics/kits"),
  createKitDefinition: (payload: Partial<KitDefinitionSummary>) =>
    request<KitDefinitionSummary>("/backoffice/logistics/kits", { method: "POST", body: JSON.stringify(payload) }),
  listKitShipments: () => request<KitShipmentSummary[]>("/backoffice/logistics/shipments"),
  createKitShipment: (payload: { kit_definition_id: string; client_id: string; notes?: string }) =>
    request<KitShipmentSummary>("/backoffice/logistics/shipments", { method: "POST", body: JSON.stringify(payload) }),
  updateKitShipmentStatus: (shipmentId: string, status: string, notes?: string) =>
    request<KitShipmentSummary>(`/backoffice/logistics/shipments/${shipmentId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    }),

  // --- RH & Rampagem ---
  listRhOnboardingTemplates: () => request<MilestoneTemplateSummary[]>("/backoffice/rh/onboarding/templates"),
  createRhOnboardingTemplate: (payload: Partial<MilestoneTemplateSummary>) =>
    request<MilestoneTemplateSummary>("/backoffice/rh/onboarding/templates", { method: "POST", body: JSON.stringify(payload) }),
  listRhOnboardingPlans: () => request<OnboardingPlanSummary[]>("/backoffice/rh/onboarding/plans"),
  createRhOnboardingPlan: (payload: { user_id: string; hire_date: string }) =>
    request<OnboardingPlanSummary>("/backoffice/rh/onboarding/plans", { method: "POST", body: JSON.stringify(payload) }),
  toggleRhMilestone: (planId: string, dayOffset: number, status: "pending" | "done") =>
    request<OnboardingPlanSummary>(`/backoffice/rh/onboarding/plans/${planId}/milestone`, {
      method: "PATCH",
      body: JSON.stringify({ day_offset: dayOffset, status }),
    }),
  getRhSatisfaction: (workspaceId: string) =>
    request<SatisfactionScoreSummary[]>(`/backoffice/rh/workspaces/${workspaceId}/satisfaction`),
  addRhSatisfaction: (workspaceId: string, payload: { score: number; source?: string; notes?: string }) =>
    request<SatisfactionScoreSummary>(`/backoffice/rh/workspaces/${workspaceId}/satisfaction`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getRhManagerPortfolio: (managerUserId: string) =>
    request<ManagerPortfolioResponse>(`/backoffice/rh/managers/${managerUserId}/portfolio`),

  // --- Oportunidades & Propostas ---
  listOpportunities: (status?: string) =>
    request<OpportunitySummary[]>(`/backoffice/proposals/opportunities${status ? `?status=${status}` : ""}`),
  ingestOpportunity: (payload: { source_platform: string; title: string; url?: string; description?: string; budget_text?: string }) =>
    request<OpportunitySummary>("/backoffice/proposals/opportunities/ingest", { method: "POST", body: JSON.stringify(payload) }),
  syncOpportunities: () =>
    request<{ status: string; scanned: number; new: number; skipped: number }>("/backoffice/proposals/opportunities/sync", { method: "POST" }),
  evaluateOpportunityWithAi: (oppId: string) =>
    request<OpportunitySummary>(`/backoffice/proposals/opportunities/${oppId}/evaluate-ai`, { method: "POST" }),
  listOpportunityPlatforms: () =>
    request<OpportunityPlatformConfig[]>("/backoffice/proposals/platforms"),
  updateOpportunityPlatform: (platformKey: string, payload: Partial<OpportunityPlatformConfig>) =>
    request<OpportunityPlatformConfig>(`/backoffice/proposals/platforms/${platformKey}`, { method: "PUT", body: JSON.stringify(payload) }),
  generateProposalForOpportunity: (oppId: string) =>
    request<ProposalSummary>(`/backoffice/proposals/opportunities/${oppId}/generate`, { method: "POST" }),
  proposalCatalog: () => request<ProposalCatalog>("/backoffice/proposals/catalog"),
  createProposalFromBrief: (payload: ProposalBriefPayload) =>
    request<ProposalSummary>("/backoffice/proposals/from-brief", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listProposals: () => request<ProposalSummary[]>("/backoffice/proposals"),
  proposalDetail: (proposalId: string) =>
    request<ProposalDetail>(`/backoffice/proposals/${proposalId}`),
  proposalCohorts: () => request<ProposalCohortAnalytics>("/backoffice/proposals/cohorts"),
  saveProposalContent: (proposalId: string, contentMarkdown: string, claims: ProposalClaim[]) =>
    request<ProposalDetail>(`/backoffice/proposals/${proposalId}/content`, {
      method: "PUT",
      body: JSON.stringify({ content_markdown: contentMarkdown, claims }),
    }),
  reviewProposalClaims: (proposalId: string, status: "approved" | "rejected", note?: string) =>
    request<ProposalDetail>(`/backoffice/proposals/${proposalId}/claims-review`, {
      method: "POST",
      body: JSON.stringify({ status, note: note || null }),
    }),
  transitionProposal: (proposalId: string, status: ProposalSummary["status"], reason?: string) =>
    request<ProposalDetail>(`/backoffice/proposals/${proposalId}/transition`, {
      method: "POST",
      body: JSON.stringify({ status, reason: reason || null }),
    }),
  createProposalRevision: (proposalId: string, reason?: string) =>
    request<ProposalDetail>(`/backoffice/proposals/${proposalId}/revisions`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || null }),
    }),
  createProposalDelivery: (proposalId: string, payload: ProposalDeliveryPayload) =>
    request<ProposalDetail>(`/backoffice/proposals/${proposalId}/deliveries`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  convertProposal: (proposalId: string, payload: ProposalConversionPayload) =>
    request<ProposalDetail>(`/backoffice/proposals/${proposalId}/convert`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  archiveProposal: (proposalId: string, reason?: string) =>
    request<void>(`/backoffice/proposals/${proposalId}`, {
      method: "DELETE",
      body: JSON.stringify({ confirm: true, reason: reason || null }),
    }),
  downloadProposalPdf: (proposalId: string) =>
    requestBlob(`/backoffice/proposals/${proposalId}/pdf`),
  salesCopilotSessions: () => request<SalesCopilotSession[]>("/backoffice/sales-copilot"),
  salesCopilotSession: (sessionId: string) =>
    request<SalesCopilotSession>(`/backoffice/sales-copilot/${sessionId}`),
  salesCopilotMetrics: () => request<SalesCopilotMetrics>("/backoffice/sales-copilot/metrics"),
  salesCopilotRealtimeStatus: () =>
    request<SalesCopilotRealtimeStatus>("/backoffice/sales-copilot/realtime-adapter"),
  createSalesCopilotSession: (payload: SalesCopilotSessionPayload) =>
    request<SalesCopilotSession>("/backoffice/sales-copilot", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  prepareSalesCopilotSession: (sessionId: string) =>
    request<SalesCopilotSession>(`/backoffice/sales-copilot/${sessionId}/prepare`, { method: "POST" }),
  addSalesCopilotEvent: (
    sessionId: string,
    payload: { event_type: SalesCopilotEvent["event_type"]; content: string; recommendation?: string | null; source_refs?: Record<string, unknown>[] },
  ) => request<SalesCopilotSession>(`/backoffice/sales-copilot/${sessionId}/events`, {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  completeSalesCopilotSession: (sessionId: string, durationSeconds: number) =>
    request<SalesCopilotSession>(`/backoffice/sales-copilot/${sessionId}/complete`, {
      method: "POST",
      body: JSON.stringify({ duration_seconds: durationSeconds }),
    }),
  configureSalesCopilotMeeting: (sessionId: string, payload: SalesCopilotMeetingPayload) =>
    request<SalesCopilotSession>(`/backoffice/sales-copilot/${sessionId}/meeting`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  issueSalesCopilotIngestionCredential: (sessionId: string) =>
    request<SalesCopilotIngestionCredential>(
      `/backoffice/sales-copilot/${sessionId}/ingestion-credential`,
      { method: "POST" },
    ),
  addSalesCopilotParticipant: (sessionId: string, payload: SalesCopilotParticipantPayload) =>
    request<SalesCopilotSession>(`/backoffice/sales-copilot/${sessionId}/participants`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  ingestSalesCopilotSegments: (sessionId: string, payload: SalesCopilotTranscriptBatchPayload) =>
    request<SalesCopilotSession>(`/backoffice/sales-copilot/${sessionId}/transcript-segments`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  analyzeSalesCopilotLive: (sessionId: string, focus?: string) =>
    request<SalesCopilotSession>(`/backoffice/sales-copilot/${sessionId}/analyze-live`, {
      method: "POST",
      body: JSON.stringify({ window_segments: 12, focus: focus || null }),
    }),
  addSalesCopilotAction: (sessionId: string, payload: SalesCopilotActionPayload) =>
    request<SalesCopilotSession>(`/backoffice/sales-copilot/${sessionId}/actions`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  materializeSalesCopilotAction: (actionId: string, idempotencyKey: string) =>
    request<SalesCopilotSession>(`/backoffice/sales-copilot/actions/${actionId}/materialize`, {
      method: "POST",
      body: JSON.stringify({ confirm: true, idempotency_key: idempotencyKey }),
    }),
  updateProposal: (proposalId: string, payload: ProposalUpdatePayload) =>
    request<ProposalSummary>(`/backoffice/proposals/${proposalId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  getPublicProposal: (token: string) => request<PublicProposalResponse>(`/proposals/public/${token}`),
  getPublicProposalDetail: (token: string) =>
    request<PublicProposalLifecycleRecord>(`/proposals/public/${token}/detail`),
  acceptPublicProposal: (token: string, signerName: string, signerEmail: string) =>
    request<PublicProposalLifecycleRecord>(`/proposals/public/${token}/accept`, {
      method: "POST",
      body: JSON.stringify({
        accepted: true,
        signer_name: signerName,
        signer_email: signerEmail,
        confirmation: "ACEITO_OS_TERMOS_DA_PROPOSTA",
      }),
    }),
  listFreelancerProfiles: () => request<FreelancerProfile[]>("/backoffice/proposals/profiles"),
  syncFreelancerProfile: (payload: { profile_url: string; platform_key?: string }) =>
    request<FreelancerProfile>("/backoffice/proposals/profiles/sync", { method: "POST", body: JSON.stringify(payload) }),
  deleteFreelancerProfile: (profileId: string) =>
    request<{ status: string }>(`/backoffice/proposals/profiles/${profileId}`, { method: "DELETE" }),
  listTechSkills: () => request<TechSkill[]>("/backoffice/proposals/skills"),
  listSkillGaps: () => request<OpportunitySkillGap[]>("/backoffice/proposals/gaps"),
  resolveSkillGap: (gapId: string) =>
    request<OpportunitySkillGap>(`/backoffice/proposals/gaps/${gapId}/resolve`, { method: "POST" }),
  getProposalAnalytics: () => request<ProposalAnalytics>("/backoffice/proposals/analytics"),
};

export type OpportunityPlatformConfig = {
  id: string;
  platform_key: string;
  platform_name: string;
  status: "active" | "paused" | "not_configured";
  rss_url: string | null;
  monthly_cost_cents: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OpportunitySummary = {
  id: string;
  source_platform: string;
  external_id: string | null;
  title: string;
  url: string | null;
  description: string | null;
  budget_text: string | null;
  fit_score: number;
  fit_analysis: string | null;
  status: "new" | "qualified" | "proposal_generated" | "rejected" | "archived";
  raw_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ProposalSummary = {
  id: string;
  opportunity_id: string | null;
  workspace_id: string | null;
  series_id: string | null;
  version: number;
  title: string | null;
  client_name: string;
  target_niche: string | null;
  executive_summary: string;
  scope_offer: string | null;
  scope_conversion: string | null;
  scope_demand: string | null;
  scope_items: Array<{ item: string; pilar?: string; prazo_dias?: number; details?: Record<string, unknown> }>;
  attached_cases?: Array<{ case_title: string; description: string; skill: string; results_highlight: string }>;
  pricing_cents: number;
  delivery_days: number;
  status: "draft" | "approved" | "sent" | "negotiating" | "won" | "lost";
  public_token: string;
  public_expires_at: string;
  generation_mode: "live" | "preview" | "manual";
  proposal_type: string | null;
  contractor_name: string | null;
  team_members: string[];
  delivery_modality: string | null;
  selected_services: string[];
  special_requirements: string | null;
  estimated_budget: string | null;
  payment_terms: string | null;
  urgency: string | null;
  decision_maker: string | null;
  problem_summary: string | null;
  additional_context: string | null;
  intake_snapshot: Record<string, unknown>;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ProposalClaim = {
  text: string;
  evidence_ref: string | null;
  approved: boolean;
};

export type ProposalLifecycleRecord = ProposalSummary & {
  content_markdown: string;
  content_sections: Record<string, unknown>[];
  claims: ProposalClaim[];
  claims_review_status: "pending" | "approved" | "rejected";
  archived_at: string | null;
  viewed_at: string | null;
  approved_at: string | null;
  sent_at: string | null;
  negotiating_at: string | null;
  won_at: string | null;
  lost_at: string | null;
  acceptance_status: "not_requested" | "pending" | "accepted" | "rejected";
  accepted_at: string | null;
  accepted_by_name: string | null;
  accepted_by_email: string | null;
};

export type PublicProposalLifecycleRecord = {
  title: string | null;
  client_name: string;
  contractor_name: string | null;
  version: number;
  status: ProposalSummary["status"];
  content_markdown: string;
  claims_review_status: "pending" | "approved" | "rejected";
  acceptance_status: "not_requested" | "pending" | "accepted" | "rejected";
  accepted_at: string | null;
  accepted_by_name: string | null;
};

export type ProposalEvent = {
  id: string;
  proposal_id: string;
  event_type: string;
  actor_user_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export type ProposalDelivery = {
  id: string;
  proposal_id: string;
  channel: "share_link" | "manual_email" | "signature_adapter";
  recipient_name: string | null;
  recipient_email: string | null;
  provider: string | null;
  external_id: string | null;
  status: "prepared" | "sent" | "delivered" | "accepted" | "rejected" | "failed";
  metadata: Record<string, unknown>;
  sent_at: string | null;
  delivered_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProposalConversion = {
  id: string;
  proposal_id: string;
  idempotency_key: string;
  project_id: string;
  contract_id: string;
  plan_id: string | null;
  created_by: string | null;
  created_at: string;
};

export type ProposalDetail = {
  proposal: ProposalLifecycleRecord;
  revisions: ProposalLifecycleRecord[];
  events: ProposalEvent[];
  deliveries: ProposalDelivery[];
  conversion: ProposalConversion | null;
};

export type ProposalDeliveryPayload = {
  channel: ProposalDelivery["channel"];
  recipient_name?: string | null;
  recipient_email?: string | null;
  provider?: string | null;
  external_id?: string | null;
  confirm_external_send?: boolean;
};

export type ProposalConversionPayload = {
  confirm: boolean;
  idempotency_key: string;
  project_name?: string | null;
  project_type: "tech" | "growth" | "social" | "general";
};

export type ProposalCohortAnalytics = {
  cohorts: Array<{
    month: string;
    created: number;
    sent: number;
    won: number;
    lost: number;
    win_rate_percentage: number;
    average_days_to_close: number | null;
  }>;
  median_days_to_first_send: number | null;
  median_days_to_close: number | null;
  generated_at: string;
};

export type SalesCopilotEvent = {
  id: string;
  session_id: string;
  event_type: "transcript_chunk" | "objection" | "insight" | "note" | "action_item";
  content: string;
  recommendation: string | null;
  source_refs: Record<string, unknown>[];
  sequence: number;
  created_by: string | null;
  created_at: string;
};

export type SalesCopilotParticipant = {
  id: string;
  session_id: string;
  display_name: string;
  participant_group: "eg_team" | "client" | "partner" | "unknown";
  organization_name: string | null;
  job_title: string | null;
  seniority: "individual" | "manager" | "director" | "c_level" | "owner" | "unknown";
  decision_role: "champion" | "decision_maker" | "influencer" | "technical" | "user" | "unknown";
  email: string | null;
  external_speaker_id: string | null;
  context_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SalesCopilotTranscriptSegment = {
  id: string;
  session_id: string;
  participant_id: string | null;
  idempotency_key: string;
  source: string;
  external_speaker_id: string | null;
  speaker_label: string | null;
  start_ms: number;
  end_ms: number | null;
  content: string;
  confidence: number | null;
  is_final: boolean;
  sequence: number;
  created_by: string | null;
  created_at: string;
};

export type SalesCopilotLiveSuggestion = {
  id: string;
  session_id: string;
  suggestion_type: "question" | "objection_response" | "risk" | "opportunity" | "next_step";
  title: string;
  content: string;
  rationale: string | null;
  confidence: number | null;
  source_refs: Record<string, unknown>[];
  generation_mode: string;
  status: "active" | "used" | "dismissed";
  created_at: string;
};

export type SalesCopilotAction = {
  id: string;
  session_id: string;
  action_type: "follow_up_task" | "proposal_revision" | "project_update";
  title: string;
  detail: string | null;
  owner_hint: string | null;
  due_at: string | null;
  source_refs: Record<string, unknown>[];
  idempotency_key: string | null;
  status: "proposed" | "approved" | "materialized" | "dismissed" | "failed";
  materialized_ref: Record<string, unknown>;
  created_by: string | null;
  approved_by: string | null;
  materialized_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SalesCopilotSession = {
  id: string;
  workspace_id: string | null;
  proposal_id: string | null;
  title: string;
  session_type: "sales_call" | "discovery" | "proposal_review" | "follow_up";
  language: string;
  status: "draft" | "prepared" | "active" | "completed" | "cancelled";
  realtime_status: "not_configured" | "adapter_ready" | "live" | "failed";
  objective: string | null;
  participant_context: string | null;
  meeting_provider: "manual" | "google_meet" | "microsoft_teams";
  meeting_url: string | null;
  external_meeting_id: string | null;
  consent_status: "pending" | "granted" | "revoked";
  consent_recorded_at: string | null;
  retention_until: string | null;
  live_context: Record<string, unknown>;
  knowledge_snapshot: Record<string, unknown>;
  preparation_brief: Record<string, unknown>;
  transcript: string;
  summary: string | null;
  duration_seconds: number;
  created_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  events: SalesCopilotEvent[];
  participants: SalesCopilotParticipant[];
  segments: SalesCopilotTranscriptSegment[];
  suggestions: SalesCopilotLiveSuggestion[];
  actions: SalesCopilotAction[];
};

export type SalesCopilotSessionPayload = {
  workspace_id?: string | null;
  proposal_id?: string | null;
  title: string;
  session_type: SalesCopilotSession["session_type"];
  language?: string;
  objective?: string | null;
  participant_context?: string | null;
};

export type SalesCopilotMetrics = {
  total_sessions: number;
  total_duration_seconds: number;
  analyses_completed: number;
  sessions_by_status: Record<string, number>;
};

export type SalesCopilotRealtimeStatus = {
  available: boolean;
  status: "not_configured" | "adapter_ready";
  message: string;
  supported_input: string[];
  supported_meeting_providers: Array<"manual" | "google_meet" | "microsoft_teams">;
  transport: "polling" | "sse" | "websocket";
};

export type SalesCopilotMeetingPayload = {
  meeting_provider: SalesCopilotSession["meeting_provider"];
  meeting_url?: string | null;
  external_meeting_id?: string | null;
  consent_granted: boolean;
  retention_days?: number;
};

export type SalesCopilotIngestionCredential = {
  session_id: string;
  ingest_token: string;
  endpoint_path: string;
  expires_at: string | null;
};

export type SalesCopilotParticipantPayload = {
  display_name: string;
  participant_group: SalesCopilotParticipant["participant_group"];
  organization_name?: string | null;
  job_title?: string | null;
  seniority?: SalesCopilotParticipant["seniority"];
  decision_role?: SalesCopilotParticipant["decision_role"];
  email?: string | null;
  external_speaker_id?: string | null;
  context_notes?: string | null;
};

export type SalesCopilotTranscriptBatchPayload = {
  segments: Array<{
    idempotency_key: string;
    participant_id?: string | null;
    source: "manual" | "upload" | "google_meet" | "microsoft_teams" | "provider_webhook";
    external_speaker_id?: string | null;
    speaker_label?: string | null;
    start_ms?: number;
    end_ms?: number | null;
    content: string;
    confidence?: number | null;
    is_final?: boolean;
  }>;
  analyze_after_ingest?: boolean;
};

export type SalesCopilotActionPayload = {
  action_type: SalesCopilotAction["action_type"];
  title: string;
  detail?: string | null;
  owner_hint?: string | null;
  due_at?: string | null;
  source_refs?: Record<string, unknown>[];
  idempotency_key?: string | null;
};

export type ProposalCatalogOption = { key: string; label: string };

export type ProposalCatalog = {
  schema_key: "commercial_proposal_v1";
  schema_version: number;
  proposal_types: ProposalCatalogOption[];
  delivery_modalities: ProposalCatalogOption[];
  urgency_levels: ProposalCatalogOption[];
  service_groups: Array<{
    key: string;
    label: string;
    services: ProposalCatalogOption[];
  }>;
};

export type ProposalBriefPayload = {
  workspace_id: string;
  title: string;
  proposal_type: string;
  contractor_name: string;
  team_members: string[];
  delivery_modality: string;
  selected_services: string[];
  special_requirements?: string | null;
  estimated_budget: string;
  payment_terms: string;
  urgency: string;
  decision_maker: string;
  problem_summary: string;
  additional_context?: string | null;
};

export type ProposalUpdatePayload = Partial<Pick<
  ProposalSummary,
  "title" | "client_name" | "target_niche" | "executive_summary" |
  "scope_offer" | "scope_conversion" | "scope_demand" | "scope_items" |
  "pricing_cents" | "delivery_days" | "contractor_name" |
  "team_members" | "special_requirements" | "estimated_budget" |
  "payment_terms" | "urgency" | "decision_maker" | "problem_summary" |
  "additional_context"
>>;

export type PublicProposalResponse = {
  client_name: string;
  target_niche: string | null;
  executive_summary: string;
  scope_offer: string | null;
  scope_conversion: string | null;
  scope_demand: string | null;
  scope_items: Array<{ item: string; pilar?: string; prazo_dias?: number }>;
  pricing_cents: number;
  delivery_days: number;
  created_at: string;
};

export type FreelancerProfile = {
  id: string;
  platform_key: string;
  profile_url: string;
  profile_name: string | null;
  headline: string | null;
  bio: string | null;
  audit_score: number;
  audit_analysis: {
    strengths?: string[];
    gaps?: string[];
    optimized_headline?: string;
    optimized_bio?: string;
    portfolio_tips?: string;
  };
  last_audited_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TechSkill = {
  id: string;
  skill_name: string;
  category: string;
  status: "available" | "wanted" | "in_progress";
  case_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OpportunitySkillGap = {
  id: string;
  opportunity_id: string | null;
  missing_skill: string;
  impact_level: "high" | "medium" | "low";
  opportunity_title: string;
  opportunity_url: string | null;
  status: "open" | "resolved" | "ignored";
  created_at: string;
};

export type ProposalAnalytics = {
  total_proposals: number;
  status_counts: { draft: number; sent: number; won: number; lost: number };
  win_rate_percentage: number;
  total_pipeline_value_cents: number;
  total_won_value_cents: number;
  average_won_ticket_cents: number;
  total_platform_investment_cents: number;
  net_growth_profit_cents: number;
  overall_roi_percentage: number;
  platform_performance: Array<{
    platform_name: string;
    monthly_cost_cents: number;
    total_proposals: number;
    won_proposals: number;
    lost_proposals: number;
    win_rate_percentage: number;
    cost_per_proposal_cents: number;
    cac_cents: number;
    won_revenue_cents: number;
    net_profit_cents: number;
    roi_percentage: number;
  }>;
};






