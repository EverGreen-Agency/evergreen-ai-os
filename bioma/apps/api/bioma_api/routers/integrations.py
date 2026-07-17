"""Status real das integrações de ambiente (sem mock).

Expõe apenas flags booleanas de configuração — nunca os valores das
credenciais. EG admin only: alimenta a aba Integrações das Configurações.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from bioma_api.access import require_platform_admin
from bioma_api.auth import current_user_from_request
from bioma_api.config import get_settings
from bioma_api.schemas.auth import CurrentUserResponse

router = APIRouter(prefix="/integrations", tags=["integrations"])


class IntegrationsStatusResponse(BaseModel):
    clickup_token_configured: bool
    storage_configured: bool
    google_oauth_configured: bool
    app_env: str


@router.get("/status", response_model=IntegrationsStatusResponse)
def get_status(user: CurrentUserResponse = Depends(current_user_from_request)) -> IntegrationsStatusResponse:
    require_platform_admin(user)
    settings = get_settings()
    return IntegrationsStatusResponse(
        clickup_token_configured=bool(settings.clickup_api_token),
        storage_configured=settings.storage_configured,
        google_oauth_configured=settings.google_oauth_configured,
        app_env=settings.app_env,
    )
