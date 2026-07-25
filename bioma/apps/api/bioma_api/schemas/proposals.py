from datetime import datetime
from typing import Any
from uuid import UUID
from pydantic import BaseModel, Field

class OpportunityBase(BaseModel):
    source_platform: str
    external_id: str | None = None
    title: str
    url: str | None = None
    description: str | None = None
    budget_text: str | None = None
    fit_score: int = 0
    fit_analysis: str | None = None
    status: str = "new"
    raw_payload: dict[str, Any] = Field(default_factory=dict)

class OpportunityCreatePayload(OpportunityBase):
    pass

class OpportunityIngestPayload(BaseModel):
    source_platform: str
    title: str
    url: str | None = None
    description: str | None = None
    budget_text: str | None = None
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
    pricing_cents: int = 0
    delivery_days: int = 15
    status: str = "draft"

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
    pricing_cents: int | None = None
    delivery_days: int | None = None
    status: str | None = None

class ProposalSummary(ProposalBase):
    id: UUID
    public_token: str
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
