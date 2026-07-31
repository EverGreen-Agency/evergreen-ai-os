"""Status real das integrações de ambiente (sem mock).

Expõe apenas flags booleanas de configuração — nunca os valores das
credenciais. EG admin only: alimenta a aba Integrações das Configurações.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from bioma_api.access import require_platform_admin
from bioma_api.auth import current_user_from_request
from bioma_api.config import get_settings
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.github import (
    GitHubConnectionInput,
    GitHubConnectionSummary,
    GitHubActivitySyncRequest,
    GitHubActivitySyncResult,
    GitHubIssueCreateRequest,
    GitHubIssueLinkSummary,
    GitHubProjectActivity,
)
from bioma_api.services import github as github_service
from bioma_api.services import kommo as kommo_service

router = APIRouter(prefix="/integrations", tags=["integrations"])


class IntegrationsStatusResponse(BaseModel):
    github_token_configured: bool
    storage_configured: bool
    google_oauth_configured: bool
    app_env: str


@router.get("/status", response_model=IntegrationsStatusResponse)
def get_status(user: CurrentUserResponse = Depends(current_user_from_request)) -> IntegrationsStatusResponse:
    require_platform_admin(user)
    settings = get_settings()
    return IntegrationsStatusResponse(
        github_token_configured=bool(settings.github_api_token),
        storage_configured=settings.storage_configured,
        google_oauth_configured=settings.google_oauth_configured,
        app_env=settings.app_env,
    )


class KommoConfigInput(BaseModel):
    client_id: str
    client_secret: str
    access_token: str
    subdomain: str


class KommoConfigResponse(BaseModel):
    configured: bool
    subdomain: str | None


@router.get("/{organization_id}/kommo", response_model=KommoConfigResponse)
def get_kommo_config(
    organization_id: UUID,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> KommoConfigResponse:
    return KommoConfigResponse(**kommo_service.get_config(user, organization_id))


@router.post("/{organization_id}/kommo")
def setup_kommo_config(
    organization_id: UUID,
    payload: KommoConfigInput,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> dict[str, str]:
    kommo_service.save_config(
        user,
        organization_id,
        payload.client_id,
        payload.client_secret,
        payload.access_token,
        payload.subdomain,
    )
    return {"status": "ok"}


@router.get("/github/projects/{project_id}", response_model=GitHubConnectionSummary)
def get_github_connection(
    project_id: UUID,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> GitHubConnectionSummary:
    return github_service.get_connection(project_id, user)


@router.put("/github/projects/{project_id}", response_model=GitHubConnectionSummary)
def upsert_github_connection(
    project_id: UUID,
    payload: GitHubConnectionInput,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> GitHubConnectionSummary:
    return github_service.upsert_connection(project_id, payload, user)


@router.get("/github/projects/{project_id}/activity", response_model=GitHubProjectActivity)
def get_github_activity(
    project_id: UUID,
    limit: int = Query(default=20, ge=1, le=100),
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> GitHubProjectActivity:
    return github_service.get_activity(project_id, user, limit)


@router.post(
    "/github/projects/{project_id}/publish-update",
    response_model=GitHubActivitySyncResult,
)
def publish_github_activity_update(
    project_id: UUID,
    payload: GitHubActivitySyncRequest,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> GitHubActivitySyncResult:
    return github_service.publish_activity_update(project_id, payload, user)


@router.post("/github/deliverables/{deliverable_id}/issue", response_model=GitHubIssueLinkSummary)
def create_github_issue(
    deliverable_id: UUID,
    payload: GitHubIssueCreateRequest,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> GitHubIssueLinkSummary:
    return github_service.create_issue_from_deliverable(deliverable_id, payload, user)
