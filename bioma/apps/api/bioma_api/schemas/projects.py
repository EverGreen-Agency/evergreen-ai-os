from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


ProjectType = Literal["social", "growth", "tech", "general"]
ProjectStatus = Literal["planned", "active", "on_hold", "completed", "cancelled", "archived"]
ContractStatus = Literal["draft", "pending_signature", "active", "expired", "terminated", "superseded"]
ScopeCadence = Literal["one_off", "weekly", "biweekly", "monthly", "quarterly", "custom"]
ScopeStatus = Literal["active", "paused", "removed"]
DeliverableStatus = Literal["planned", "in_progress", "waiting_approval", "done", "blocked"]
ProjectPhaseStatus = Literal["planned", "development", "blocked", "internal_testing", "client_validation", "released"]
ProjectDocumentKind = Literal["proposal", "technical_spec", "scope", "acceptance", "release_notes"]
ProjectUpdateKind = Literal["progress", "blocker", "testing", "release", "note"]


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    code: str | None = Field(default=None, max_length=50)
    project_type: ProjectType = "general"
    status: ProjectStatus = "planned"
    owner_user_id: UUID | None = None
    start_at: date | None = None
    due_at: date | None = None
    cadence_days: int | None = Field(default=None, gt=0, le=365)
    client_visible: bool = True
    objective: str | None = Field(default=None, max_length=5_000)

    @model_validator(mode="after")
    def valid_dates(self):
        if self.start_at and self.due_at and self.due_at < self.start_at:
            raise ValueError("A data final não pode ser anterior à inicial.")
        return self


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    code: str | None = Field(default=None, max_length=50)
    project_type: ProjectType | None = None
    status: ProjectStatus | None = None
    owner_user_id: UUID | None = None
    start_at: date | None = None
    due_at: date | None = None
    cadence_days: int | None = Field(default=None, gt=0, le=365)
    client_visible: bool | None = None
    objective: str | None = Field(default=None, max_length=5_000)


class ContractCreate(BaseModel):
    title: str = Field(min_length=2, max_length=240)
    version: int = Field(default=1, gt=0)
    status: ContractStatus = "draft"
    starts_at: date | None = None
    ends_at: date | None = None
    total_value: Decimal | None = Field(default=None, ge=0)
    currency: str = Field(default="BRL", min_length=3, max_length=3)
    source_provider: str | None = Field(default=None, max_length=80)
    external_id: str | None = Field(default=None, max_length=200)
    signed_at: datetime | None = None
    client_visible: bool = True

    @model_validator(mode="after")
    def valid_dates(self):
        if self.starts_at and self.ends_at and self.ends_at < self.starts_at:
            raise ValueError("A vigência final não pode ser anterior à inicial.")
        return self


class ContractUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=240)
    status: ContractStatus | None = None
    starts_at: date | None = None
    ends_at: date | None = None
    total_value: Decimal | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    source_provider: str | None = Field(default=None, max_length=80)
    external_id: str | None = Field(default=None, max_length=200)
    signed_at: datetime | None = None
    client_visible: bool | None = None


class ScopeItemCreate(BaseModel):
    title: str = Field(min_length=2, max_length=240)
    description: str | None = Field(default=None, max_length=5_000)
    quantity: Decimal = Field(default=Decimal("1"), gt=0)
    unit: str = Field(default="entrega", min_length=1, max_length=80)
    cadence: ScopeCadence = "one_off"
    cadence_days: int | None = Field(default=None, gt=0, le=365)
    acceptance_required: bool = True
    acceptance_criteria: str | None = Field(default=None, max_length=5_000)
    client_visible: bool = True
    status: ScopeStatus = "active"

    @model_validator(mode="after")
    def custom_requires_days(self):
        if self.cadence == "custom" and not self.cadence_days:
            raise ValueError("Cadência customizada exige cadence_days.")
        return self


class ScopeItemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=240)
    description: str | None = Field(default=None, max_length=5_000)
    quantity: Decimal | None = Field(default=None, gt=0)
    unit: str | None = Field(default=None, min_length=1, max_length=80)
    cadence: ScopeCadence | None = None
    cadence_days: int | None = Field(default=None, gt=0, le=365)
    acceptance_required: bool | None = None
    acceptance_criteria: str | None = Field(default=None, max_length=5_000)
    client_visible: bool | None = None
    status: ScopeStatus | None = None


class ProjectDeliverableCreate(BaseModel):
    title: str = Field(min_length=2, max_length=240)
    scope_item_id: UUID | None = None
    phase_id: UUID | None = None
    status: DeliverableStatus = "planned"
    due_at: datetime | None = None


class ProjectPhaseCreate(BaseModel):
    sequence: int = Field(gt=0, le=100)
    name: str = Field(min_length=2, max_length=240)
    description: str | None = Field(default=None, max_length=5_000)
    status: ProjectPhaseStatus = "planned"
    client_summary: str | None = Field(default=None, max_length=2_000)
    client_visible: bool = True
    starts_at: date | None = None
    due_at: date | None = None

    @model_validator(mode="after")
    def valid_dates(self):
        if self.starts_at and self.due_at and self.due_at < self.starts_at:
            raise ValueError("A data final da fase não pode ser anterior à inicial.")
        return self


class ProjectPhaseUpdate(BaseModel):
    sequence: int | None = Field(default=None, gt=0, le=100)
    name: str | None = Field(default=None, min_length=2, max_length=240)
    description: str | None = Field(default=None, max_length=5_000)
    status: ProjectPhaseStatus | None = None
    client_summary: str | None = Field(default=None, max_length=2_000)
    client_visible: bool | None = None
    starts_at: date | None = None
    due_at: date | None = None


class ProjectDocumentCreate(BaseModel):
    kind: ProjectDocumentKind
    title: str = Field(min_length=2, max_length=240)
    url: str = Field(min_length=8, max_length=2_000)
    client_visible: bool = True


class ProjectUpdateCreate(BaseModel):
    phase_id: UUID | None = None
    kind: ProjectUpdateKind = "progress"
    summary: str = Field(min_length=3, max_length=1_000)
    detail: str | None = Field(default=None, max_length=5_000)
    client_visible: bool = True


class ScopeItemSummary(BaseModel):
    id: UUID
    contract_id: UUID
    title: str
    description: str | None = None
    quantity: Decimal
    unit: str
    cadence: ScopeCadence
    cadence_days: int | None = None
    acceptance_required: bool
    acceptance_criteria: str | None = None
    client_visible: bool
    status: ScopeStatus
    delivered_total: int = 0
    accepted_total: int = 0


class ContractSummary(BaseModel):
    id: UUID
    project_id: UUID
    version: int
    title: str
    status: ContractStatus
    starts_at: date | None = None
    ends_at: date | None = None
    total_value: Decimal | None = None
    currency: str
    source_provider: str | None = None
    external_id: str | None = None
    signed_at: datetime | None = None
    client_visible: bool
    scope_items: list[ScopeItemSummary] = Field(default_factory=list)


class ProjectDeliverableSummary(BaseModel):
    id: UUID
    project_id: UUID
    scope_item_id: UUID | None = None
    phase_id: UUID | None = None
    title: str
    status: DeliverableStatus
    due_at: datetime | None = None
    completed_at: datetime | None = None
    approval_status: str | None = None
    updated_at: datetime


class ProjectPhaseSummary(BaseModel):
    id: UUID
    project_id: UUID
    sequence: int
    name: str
    description: str | None = None
    status: ProjectPhaseStatus
    client_summary: str | None = None
    client_visible: bool
    starts_at: date | None = None
    due_at: date | None = None
    released_at: datetime | None = None
    deliverables_total: int = 0
    deliverables_done: int = 0


class ProjectDocumentSummary(BaseModel):
    id: UUID
    project_id: UUID
    kind: ProjectDocumentKind
    title: str
    url: str
    client_visible: bool
    created_at: datetime


class ProjectUpdateSummary(BaseModel):
    id: UUID
    project_id: UUID
    phase_id: UUID | None = None
    kind: ProjectUpdateKind
    summary: str
    detail: str | None = None
    client_visible: bool
    created_at: datetime


class ProjectSummary(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    code: str | None = None
    project_type: ProjectType
    status: ProjectStatus
    owner_user_id: UUID | None = None
    owner_name: str | None = None
    start_at: date | None = None
    due_at: date | None = None
    cadence_days: int | None = None
    client_visible: bool
    objective: str | None = None
    deliverables_total: int = 0
    deliverables_done: int = 0
    deliverables_overdue: int = 0
    deliverables_blocked: int = 0
    completion_percentage: float = 0
    pace_status: Literal["unknown", "on_track", "at_risk", "off_track"] = "unknown"
    updated_at: datetime


class ProjectDetail(ProjectSummary):
    contracts: list[ContractSummary] = Field(default_factory=list)
    deliverables: list[ProjectDeliverableSummary] = Field(default_factory=list)
    phases: list[ProjectPhaseSummary] = Field(default_factory=list)
    documents: list[ProjectDocumentSummary] = Field(default_factory=list)
    updates: list[ProjectUpdateSummary] = Field(default_factory=list)
