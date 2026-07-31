from fastapi import APIRouter, Depends, Query

from bioma_api.auth import current_user_from_request
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.copilot import CopilotCommand, CopilotRequest, CopilotResponse
from bioma_api.services import copilot as service

router = APIRouter(prefix="/copilot", tags=["copilot"])


@router.get("/commands", response_model=list[CopilotCommand])
def list_commands(
    surface: str = Query(default="workspace"),
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> list[CopilotCommand]:
    """Alimenta o menu de `/` — o front nunca inventa comando."""
    from bioma_api.access import require_platform_admin

    require_platform_admin(user)
    return [CopilotCommand(**item) for item in service.catalog_for(surface)]


@router.post("", response_model=CopilotResponse)
def run_copilot(
    payload: CopilotRequest,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> CopilotResponse:
    """Interpreta a mensagem, responde com fontes e executa só o reversível."""
    return service.run(payload, user)
