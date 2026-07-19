from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


ContentChannel = Literal["instagram", "linkedin", "facebook", "tiktok", "youtube"]


class AiContentRequestCreate(BaseModel):
    brief: str = Field(min_length=10, max_length=6000)
    channels: list[ContentChannel] = Field(min_length=1)
    quantity: int = Field(default=3, ge=1, le=12)
    tone: str | None = Field(default=None, max_length=300)
    objective: str | None = Field(default=None, max_length=500)
    methodology_refs: list[str] = Field(default_factory=list, max_length=20)


class AiContentPost(BaseModel):
    title: str
    channel: ContentChannel
    format: str
    hook: str
    caption: str
    cta: str


class AiContentOutput(BaseModel):
    strategy_note: str
    posts: list[AiContentPost]


class AiContentRequestSummary(BaseModel):
    id: UUID
    workspace_id: UUID
    content_type: Literal["social_posts"]
    status: Literal["queued", "running", "ready", "error", "cancelled"]
    brief: str
    channels: list[ContentChannel]
    quantity: int
    tone: str | None = None
    objective: str | None = None
    methodology_refs: list[str]
    provider: str | None = None
    model: str | None = None
    generation_mode: Literal["live", "preview"] | None = None
    output: AiContentOutput | None = None
    error_message: str | None = None
    created_at: datetime
    finished_at: datetime | None = None
