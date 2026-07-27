from datetime import datetime
from typing import Any, Literal
from uuid import UUID
from pydantic import BaseModel, Field, HttpUrl

OpportunityStatus = Literal["new", "qualified", "proposal_generated", "rejected", "archived"]
ProposalStatus = Literal["draft", "approved", "sent", "won", "lost"]
PlatformStatus = Literal["active", "paused", "not_configured"]
GenerationMode = Literal["live", "preview", "manual"]

class OpportunityBase(BaseModel):
    source_platform: str = Field(min_length=2, max_length=50)
    external_id: str | None = None
    title: str = Field(min_length=2, max_length=255)
    url: str | None = None
    description: str | None = Field(default=None, max_length=10_000)
    budget_text: str | None = Field(default=None, max_length=100)
    fit_score: int = Field(default=0, ge=0, le=100)
    fit_analysis: str | None = None
    status: OpportunityStatus = "new"
    raw_payload: dict[str, Any] = Field(default_factory=dict)

class OpportunityCreatePayload(OpportunityBase):
    pass

class OpportunityIngestPayload(BaseModel):
    source_platform: str = Field(min_length=2, max_length=50)
    title: str = Field(min_length=2, max_length=255)
    url: str | None = None
    description: str | None = Field(default=None, max_length=10_000)
    budget_text: str | None = Field(default=None, max_length=100)
    raw_payload: dict[str, Any] = Field(default_factory=dict)

class OpportunitySummary(OpportunityBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

class ProposalBase(BaseModel):
    opportunity_id: UUID | None = None
    client_name: str
    target_niche: str | None = None
    executive_summary: str
    scope_offer: str | None = None
    scope_conversion: str | None = None
    scope_demand: str | None = None
    scope_items: list[dict[str, Any]] = Field(default_factory=list)
    attached_cases: list[dict[str, Any]] = Field(default_factory=list)
    win_loss_feedback: str | None = Field(default=None, max_length=5_000)
    pricing_cents: int = Field(default=0, ge=0)
    delivery_days: int = Field(default=0, ge=0, le=730)
    status: ProposalStatus = "draft"
    generation_mode: GenerationMode = "manual"

class ProposalCreatePayload(ProposalBase):
    pass

class ProposalUpdatePayload(BaseModel):
    client_name: str | None = None
    target_niche: str | None = None
    executive_summary: str | None = None
    scope_offer: str | None = None
    scope_conversion: str | None = None
    scope_demand: str | None = None
    scope_items: list[dict[str, Any]] | None = None
    win_loss_feedback: str | None = Field(default=None, max_length=5_000)
    pricing_cents: int | None = Field(default=None, ge=0)
    delivery_days: int | None = Field(default=None, ge=0, le=730)
    status: ProposalStatus | None = None

class ProposalSummary(ProposalBase):
    id: UUID
    public_token: str
    public_expires_at: datetime
    created_by_user_id: UUID | None = None
    created_at: datetime
    updated_at: datetime

class PublicProposalResponse(BaseModel):
    client_name: str
    target_niche: str | None = None
    executive_summary: str
    scope_offer: str | None = None
    scope_conversion: str | None = None
    scope_demand: str | None = None
    scope_items: list[dict[str, Any]]
    pricing_cents: int
    delivery_days: int
    created_at: datetime


class OpportunityPlatformUpdate(BaseModel):
    platform_name: str = Field(min_length=2, max_length=100)
    status: PlatformStatus = "active"
    rss_url: HttpUrl | None = None
    monthly_cost_cents: int = Field(default=0, ge=0)
    notes: str | None = Field(default=None, max_length=2_000)


class OpportunityPlatformSummary(BaseModel):
    id: UUID
    platform_key: str
    platform_name: str
    status: PlatformStatus
    rss_url: str | None = None
    monthly_cost_cents: int
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


class FreelancerProfileSyncRequest(BaseModel):
    profile_url: HttpUrl
    platform_key: str | None = Field(default=None, min_length=2, max_length=50)
