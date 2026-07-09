from uuid import UUID

from fastapi import APIRouter, Depends, status

from bioma_api.auth import current_user_from_request
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.client_hub import (
    ApprovalDecisionRequest,
    ArtifactCreateRequest,
    ArtifactUpdateRequest,
    ClientCreateRequest,
    ClientPortalResponse,
    ClientSummary,
    ClientUpdateRequest,
    DeliverableCreateRequest,
    DeliverableUpdateRequest,
)
from bioma_api.services import client_hub as client_hub_service


router = APIRouter(prefix="/clients", tags=["client-hub"])


@router.get("", response_model=list[ClientSummary])
def list_clients(user: CurrentUserResponse = Depends(current_user_from_request)) -> list[ClientSummary]:
    return client_hub_service.list_clients(user)


@router.post("", response_model=ClientPortalResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    payload: ClientCreateRequest,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> ClientPortalResponse:
    return client_hub_service.create_client(payload, user)


@router.get("/{client_id}", response_model=ClientPortalResponse)
def get_client_portal(
    client_id: UUID,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> ClientPortalResponse:
    return client_hub_service.get_client_portal(client_id, user)


@router.patch("/{client_id}", response_model=ClientPortalResponse)
def update_client(
    client_id: UUID,
    payload: ClientUpdateRequest,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> ClientPortalResponse:
    return client_hub_service.update_client(client_id, payload, user)


@router.post("/{client_id}/artifacts", response_model=ClientPortalResponse, status_code=status.HTTP_201_CREATED)
def create_artifact(
    client_id: UUID,
    payload: ArtifactCreateRequest,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> ClientPortalResponse:
    return client_hub_service.create_artifact(client_id, payload, user)


@router.patch("/{client_id}/artifacts/{artifact_id}", response_model=ClientPortalResponse)
def update_artifact(
    client_id: UUID,
    artifact_id: UUID,
    payload: ArtifactUpdateRequest,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> ClientPortalResponse:
    return client_hub_service.update_artifact(client_id, artifact_id, payload, user)


@router.delete("/{client_id}/artifacts/{artifact_id}", response_model=ClientPortalResponse)
def delete_artifact(
    client_id: UUID,
    artifact_id: UUID,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> ClientPortalResponse:
    return client_hub_service.delete_artifact(client_id, artifact_id, user)


@router.post("/{client_id}/deliverables", response_model=ClientPortalResponse, status_code=status.HTTP_201_CREATED)
def create_deliverable(
    client_id: UUID,
    payload: DeliverableCreateRequest,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> ClientPortalResponse:
    return client_hub_service.create_deliverable(client_id, payload, user)


@router.patch("/{client_id}/deliverables/{deliverable_id}", response_model=ClientPortalResponse)
def update_deliverable(
    client_id: UUID,
    deliverable_id: UUID,
    payload: DeliverableUpdateRequest,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> ClientPortalResponse:
    return client_hub_service.update_deliverable(client_id, deliverable_id, payload, user)


@router.delete("/{client_id}/deliverables/{deliverable_id}", response_model=ClientPortalResponse)
def delete_deliverable(
    client_id: UUID,
    deliverable_id: UUID,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> ClientPortalResponse:
    return client_hub_service.delete_deliverable(client_id, deliverable_id, user)


@router.patch("/{client_id}/approvals/{approval_id}", response_model=ClientPortalResponse)
def decide_approval(
    client_id: UUID,
    approval_id: UUID,
    payload: ApprovalDecisionRequest,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> ClientPortalResponse:
    return client_hub_service.decide_approval(client_id, approval_id, payload, user)


@router.post("/{client_id}/sync/clickup", response_model=ClientPortalResponse)
def sync_clickup(
    client_id: UUID,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> ClientPortalResponse:
    return client_hub_service.sync_clickup(client_id, user)
