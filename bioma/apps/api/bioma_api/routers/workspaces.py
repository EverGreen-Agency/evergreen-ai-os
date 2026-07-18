from fastapi import APIRouter, Depends

from bioma_api.auth import current_user_from_request
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.workspaces import WorkspaceSummary
from bioma_api.services import workspaces as workspaces_service


router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("", response_model=list[WorkspaceSummary])
def list_workspaces(
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> list[WorkspaceSummary]:
    return workspaces_service.list_workspaces(user)
