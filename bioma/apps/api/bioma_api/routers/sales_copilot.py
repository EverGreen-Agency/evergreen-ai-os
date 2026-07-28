from uuid import UUID

from fastapi import APIRouter, Depends, status

from bioma_api.auth import current_user_from_request
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.sales_copilot import (
    RealtimeAdapterStatus,
    SalesCopilotCompleteRequest,
    SalesCopilotEventCreate,
    SalesCopilotMetrics,
    SalesCopilotSession,
    SalesCopilotSessionCreate,
)
from bioma_api.services import sales_copilot as copilot_service


router = APIRouter(prefix="/backoffice/sales-copilot", tags=["sales-copilot"])


@router.get("", response_model=list[SalesCopilotSession])
def list_sessions(user: CurrentUserResponse = Depends(current_user_from_request)):
    return copilot_service.list_sessions(user)


@router.post("", response_model=SalesCopilotSession, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: SalesCopilotSessionCreate,
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return copilot_service.create_session(payload, user)


@router.get("/metrics", response_model=SalesCopilotMetrics)
def get_metrics(user: CurrentUserResponse = Depends(current_user_from_request)):
    return copilot_service.metrics(user)


@router.get("/realtime-adapter", response_model=RealtimeAdapterStatus)
def get_realtime_adapter(user: CurrentUserResponse = Depends(current_user_from_request)):
    return copilot_service.realtime_adapter_status(user)


@router.get("/{session_id}", response_model=SalesCopilotSession)
def get_session(
    session_id: UUID,
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return copilot_service.get_session(session_id, user)


@router.post("/{session_id}/prepare", response_model=SalesCopilotSession)
def prepare_session(
    session_id: UUID,
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return copilot_service.prepare_session(session_id, user)


@router.post("/{session_id}/events", response_model=SalesCopilotSession)
def add_event(
    session_id: UUID,
    payload: SalesCopilotEventCreate,
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return copilot_service.add_event(session_id, payload, user)


@router.post("/{session_id}/complete", response_model=SalesCopilotSession)
def complete_session(
    session_id: UUID,
    payload: SalesCopilotCompleteRequest,
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return copilot_service.complete_session(session_id, payload, user)
