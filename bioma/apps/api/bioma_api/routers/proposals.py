from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from bioma_api.auth import current_user_from_request
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.proposals import (
    OpportunityCreatePayload,
    OpportunityIngestPayload,
    OpportunitySummary,
    ProposalCreatePayload,
    ProposalSummary,
    ProposalUpdatePayload,
    PublicProposalResponse,
)
from bioma_api.services import proposals as proposals_service

router = APIRouter(prefix="/backoffice/proposals", tags=["proposals"])
public_router = APIRouter(prefix="/proposals", tags=["public-proposals"])


@router.get("/opportunities", response_model=list[OpportunitySummary])
def list_opportunities(
    status: str | None = Query(None),
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return proposals_service.list_opportunities(user, status_filter=status)


@router.post("/opportunities/ingest", response_model=OpportunitySummary, status_code=status.HTTP_201_CREATED)
def ingest_opportunity(
    payload: OpportunityIngestPayload,
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return proposals_service.ingest_opportunity(payload, user)


@router.post("/opportunities/sync")
def sync_opportunities(
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return proposals_service.sync_opportunities_from_scrapers(user)



@router.post("/opportunities/{opp_id}/generate", response_model=ProposalSummary, status_code=status.HTTP_201_CREATED)
def generate_proposal(
    opp_id: UUID,
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return proposals_service.generate_proposal_for_opportunity(opp_id, user)


@router.get("", response_model=list[ProposalSummary])
def list_proposals(
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return proposals_service.list_proposals(user)


@router.post("", response_model=ProposalSummary, status_code=status.HTTP_201_CREATED)
def create_proposal(
    payload: ProposalCreatePayload,
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return proposals_service.create_proposal(payload, user)


@router.patch("/{proposal_id}", response_model=ProposalSummary)
def update_proposal(
    proposal_id: UUID,
    payload: ProposalUpdatePayload,
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return proposals_service.update_proposal(proposal_id, payload, user)


@public_router.get("/public/{public_token}", response_model=PublicProposalResponse)
def get_public_proposal(public_token: str):
    return proposals_service.get_public_proposal(public_token)
