from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


WorkspaceKind = Literal["agency_internal", "client"]
WorkspaceStatus = Literal["active", "archived"]
WorkspaceAccessRole = Literal[
    "platform_admin",
    "tenant_admin",
    "workspace_manager",
    "operator",
    "approver",
    "viewer",
    "client_user",
]


class WorkspaceSummary(BaseModel):
    id: UUID
    tenant_organization_id: UUID
    tenant_name: str
    tenant_slug: str
    organization_id: UUID
    organization_name: str
    organization_slug: str
    kind: WorkspaceKind
    name: str
    slug: str
    status: WorkspaceStatus
    client_id: UUID | None = None
    legacy_client_id: UUID | None = None
    operational_client_id: UUID | None = None
    client_status: Literal["onboarding", "active", "paused", "archived"] | None = None
    responsible_name: str | None = None
    enabled_modules: list[str] = Field(default_factory=list)
    access_role: WorkspaceAccessRole
