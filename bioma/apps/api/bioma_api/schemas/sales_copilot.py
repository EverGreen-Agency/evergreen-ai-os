from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


SessionType = Literal["sales_call", "discovery", "proposal_review", "follow_up"]
SessionStatus = Literal["draft", "prepared", "active", "completed", "cancelled"]
CopilotEventType = Literal["transcript_chunk", "objection", "insight", "note", "action_item"]


class SalesCopilotSessionCreate(BaseModel):
    workspace_id: UUID | None = None
    proposal_id: UUID | None = None
    title: str = Field(min_length=2, max_length=255)
    session_type: SessionType = "sales_call"
    language: str = Field(default="pt-BR", min_length=2, max_length=20)
    objective: str | None = Field(default=None, max_length=4_000)
    participant_context: str | None = Field(default=None, max_length=4_000)


class SalesCopilotEventCreate(BaseModel):
    event_type: CopilotEventType
    content: str = Field(min_length=1, max_length=20_000)
    recommendation: str | None = Field(default=None, max_length=10_000)
    source_refs: list[dict[str, Any]] = Field(default_factory=list, max_length=50)


class SalesCopilotEvent(BaseModel):
    id: UUID
    session_id: UUID
    event_type: CopilotEventType
    content: str
    recommendation: str | None = None
    source_refs: list[dict[str, Any]] = Field(default_factory=list)
    sequence: int
    created_by: UUID | None = None
    created_at: datetime


class SalesCopilotSession(BaseModel):
    id: UUID
    workspace_id: UUID | None = None
    proposal_id: UUID | None = None
    title: str
    session_type: SessionType
    language: str
    status: SessionStatus
    realtime_status: Literal["not_configured", "adapter_ready", "live", "failed"]
    objective: str | None = None
    participant_context: str | None = None
    knowledge_snapshot: dict[str, Any] = Field(default_factory=dict)
    preparation_brief: dict[str, Any] = Field(default_factory=dict)
    transcript: str
    summary: str | None = None
    duration_seconds: int
    created_by: UUID | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    events: list[SalesCopilotEvent] = Field(default_factory=list)


class SalesCopilotCompleteRequest(BaseModel):
    duration_seconds: int = Field(default=0, ge=0, le=86_400)


class SalesCopilotMetrics(BaseModel):
    total_sessions: int
    total_duration_seconds: int
    analyses_completed: int
    sessions_by_status: dict[str, int] = Field(default_factory=dict)


class RealtimeAdapterStatus(BaseModel):
    available: bool
    status: Literal["not_configured", "adapter_ready"]
    message: str
    supported_input: list[str] = Field(default_factory=list)
