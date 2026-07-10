from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from bioma_api.auth import current_user_from_request
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.performance import (
    AdsCampaignSummary,
    Ga4AcquisitionSummary,
    GscQuerySummary,
    GtmSnapshotSummary,
    PerformanceConnectionCreateRequest,
    PerformanceConnectionSummary,
    PerformanceConnectionUpdateRequest,
    PerformanceOverviewResponse,
    PerformanceSyncRequest,
    PerformanceSyncRunSummary,
)
from bioma_api.services import performance as performance_service


router = APIRouter(prefix="/clients/{client_id}/performance", tags=["performance"])


@router.get("", response_model=PerformanceOverviewResponse)
def get_overview(
    client_id: UUID,
    date_from: date | None = None,
    date_to: date | None = None,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> PerformanceOverviewResponse:
    return performance_service.get_overview(client_id, user, date_from, date_to)


@router.get("/connections", response_model=list[PerformanceConnectionSummary])
def list_connections(
    client_id: UUID,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> list[PerformanceConnectionSummary]:
    return performance_service.list_connections(client_id, user)


@router.post("/connections", response_model=list[PerformanceConnectionSummary], status_code=status.HTTP_201_CREATED)
def create_connection(
    client_id: UUID,
    payload: PerformanceConnectionCreateRequest,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> list[PerformanceConnectionSummary]:
    return performance_service.create_connection(client_id, payload, user)


@router.patch("/connections/{connection_id}", response_model=list[PerformanceConnectionSummary])
def update_connection(
    client_id: UUID,
    connection_id: UUID,
    payload: PerformanceConnectionUpdateRequest,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> list[PerformanceConnectionSummary]:
    return performance_service.update_connection(client_id, connection_id, payload, user)


@router.get("/google-ads/campaigns", response_model=list[AdsCampaignSummary])
def list_ads_campaigns(
    client_id: UUID,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> list[AdsCampaignSummary]:
    return performance_service.list_ads_campaigns(client_id, user, date_from, date_to, limit)


@router.get("/ga4/acquisition", response_model=list[Ga4AcquisitionSummary])
def list_ga4_acquisition(
    client_id: UUID,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> list[Ga4AcquisitionSummary]:
    return performance_service.list_ga4_acquisition(client_id, user, date_from, date_to, limit)


@router.get("/search-console/queries", response_model=list[GscQuerySummary])
def list_gsc_queries(
    client_id: UUID,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> list[GscQuerySummary]:
    return performance_service.list_gsc_queries(client_id, user, date_from, date_to, limit)


@router.get("/gtm/snapshots", response_model=list[GtmSnapshotSummary])
def list_gtm_snapshots(
    client_id: UUID,
    limit: int = Query(default=10, ge=1, le=50),
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> list[GtmSnapshotSummary]:
    return performance_service.list_gtm_snapshots(client_id, user, limit)


@router.post("/sync", response_model=PerformanceSyncRunSummary, status_code=status.HTTP_202_ACCEPTED)
def request_sync(
    client_id: UUID,
    payload: PerformanceSyncRequest,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> PerformanceSyncRunSummary:
    return performance_service.request_sync(client_id, payload, user)
