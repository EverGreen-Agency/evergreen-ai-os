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


@router.get("/platforms")
def list_platforms(
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return proposals_service.list_platform_configs(user)


@router.put("/platforms/{platform_key}")
def update_platform(
    platform_key: str,
    payload: dict,
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return proposals_service.update_platform_config(platform_key, payload, user)


@router.get("/profiles")
def list_freelancer_profiles(
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return proposals_service.list_freelancer_profiles(user)


@router.post("/profiles/sync")
def sync_freelancer_profile(
    payload: dict,
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    url = payload.get("profile_url")
    if not url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="profile_url é obrigatório.")
    platform_key = payload.get("platform_key")
    return proposals_service.sync_and_audit_freelancer_profile(url, platform_key, user)


@router.delete("/profiles/{profile_id}")
def delete_freelancer_profile(
    profile_id: UUID,
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return proposals_service.delete_freelancer_profile(profile_id, user)


@router.get("/skills")
def list_skills(
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return proposals_service.list_tech_skills(user)


@router.get("/gaps")
def list_gaps(
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return proposals_service.list_skill_gaps(user)


@router.post("/gaps/{gap_id}/resolve")
def resolve_gap(
    gap_id: UUID,
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return proposals_service.resolve_skill_gap(gap_id, user)


@router.get("/analytics")
def get_analytics(
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    return proposals_service.get_proposal_analytics(user)







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
