from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ClientSummary(BaseModel):
    id: UUID
    organization_id: UUID
    organization_name: str
    organization_slug: str
    name: str
    status: str
    responsible_name: str | None = None
    clickup_folder_id: str | None = None
    deliverables_total: int
    approvals_pending: int
    artifacts_client: int


class ArtifactSummary(BaseModel):
    id: UUID
    title: str
    kind: str
    visibility: str
    url: str | None = None
    content: str | None = None
    created_at: datetime


class DeliverableSummary(BaseModel):
    id: UUID
    title: str
    status: str
    due_at: datetime | None = None
    clickup_task_id: str | None = None
    updated_at: datetime


class ApprovalSummary(BaseModel):
    id: UUID
    deliverable_id: UUID | None = None
    deliverable_title: str | None = None
    status: str
    comment: str | None = None
    created_at: datetime
    decided_at: datetime | None = None


class SyncRunSummary(BaseModel):
    id: UUID
    source: str
    status: str
    summary: dict
    started_at: datetime
    finished_at: datetime | None = None


class ClientPortalResponse(BaseModel):
    client: ClientSummary
    artifacts: list[ArtifactSummary]
    deliverables: list[DeliverableSummary]
    approvals: list[ApprovalSummary]
    sync_runs: list[SyncRunSummary]
