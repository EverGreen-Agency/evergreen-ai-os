"""Regras de acesso compartilhadas: papel de plataforma e feature-gating por organização.

Decisão 2026-07-14 (ROADMAP-MVP.md): módulos habilitados por organização,
EG admin enxerga tudo; `client_user` só o que estiver em `enabled_modules`.
"""

from fastapi import HTTPException, status

from bioma_api.domain.models import Role
from bioma_api.schemas.auth import CurrentUserResponse

CLIENT_MODULES = ("hub", "content", "files", "commercial", "analytics", "integrations", "engineering")
DEFAULT_CLIENT_MODULES = ("hub", "content", "files")

MODULE_LABELS = {
    "hub": "Hub do cliente",
    "content": "Conteúdo",
    "files": "Arquivos",
    "commercial": "Comercial",
    "analytics": "Analytics",
    "integrations": "Integrações",
    "engineering": "Engenharia",
}


def is_platform_admin(user: CurrentUserResponse) -> bool:
    return any(org.slug == "eg" and org.role == Role.eg_admin for org in user.organizations)


def require_platform_admin(user: CurrentUserResponse) -> None:
    if not is_platform_admin(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas EG admin pode executar esta ação.")


def require_client_module(client_row, user: CurrentUserResponse, module: str) -> None:
    """Bloqueia `client_user` fora dos módulos habilitados da organização do cliente.

    `client_row` precisa vir de um `find_accessible_client` que selecione
    `enabled_modules` (join com organizations).
    """
    if is_platform_admin(user):
        return
    modules = client_row.get("enabled_modules") or []
    if module not in modules:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Módulo '{MODULE_LABELS.get(module, module)}' não habilitado para este cliente.",
        )
