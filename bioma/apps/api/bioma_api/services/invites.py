import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status

from bioma_api.access import require_platform_admin, resolve_accessible_client
from bioma_api.config import get_settings
from bioma_api.db import connect
from bioma_api.repositories import client_hub as client_hub_repo
from bioma_api.repositories import invites as invites_repo
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.invites import (
    InviteAcceptRequest,
    InviteCreatedResponse,
    InviteCreateRequest,
    InvitePublicResponse,
    InviteSummary,
)
from bioma_api.security import hash_password, hash_session_token, new_session_token


def create_invite(
    client_id: UUID,
    payload: InviteCreateRequest,
    user: CurrentUserResponse,
) -> InviteCreatedResponse:
    require_platform_admin(user)
    expires_at = datetime.now(timezone.utc) + timedelta(days=payload.expires_in_days)
    token = secrets.token_urlsafe(32)

    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        invite_id = invites_repo.create_invite(
            conn,
            client["organization_id"],
            payload.email,
            hash_session_token(token),
            expires_at,
            user.id,
        )
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "invite.created",
            {"client_id": str(client_id), "invite_id": str(invite_id), "email": payload.email},
        )

    return InviteCreatedResponse(
        id=invite_id,
        token=token,
        path=f"/convite/{token}",
        email=payload.email,
        expires_at=expires_at,
    )


def list_invites(client_id: UUID, user: CurrentUserResponse) -> list[InviteSummary]:
    require_platform_admin(user)
    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        rows = invites_repo.list_invites(conn, client["organization_id"])
    return [InviteSummary(**row) for row in rows]


def revoke_invite(client_id: UUID, invite_id: UUID, user: CurrentUserResponse) -> list[InviteSummary]:
    require_platform_admin(user)
    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        if not invites_repo.delete_invite(conn, client["organization_id"], invite_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Convite não encontrado ou já utilizado.")
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "invite.revoked",
            {"client_id": str(client_id), "invite_id": str(invite_id)},
        )
    return list_invites(client_id, user)


def get_invite_public(token: str) -> InvitePublicResponse:
    with connect() as conn:
        invite = invites_repo.find_valid_invite(conn, hash_session_token(token))
    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Convite inválido, expirado ou já utilizado.")
    return InvitePublicResponse(
        client_name=invite["client_name"] or invite["organization_name"],
        organization_name=invite["organization_name"],
        email=invite["email"],
        expires_at=invite["expires_at"],
    )


def accept_invite(token: str, payload: InviteAcceptRequest) -> tuple[str, datetime, UUID]:
    """Cria usuário + membership a partir do convite e abre sessão.

    Retorna (session_token, expires_at, user_id) para o router setar o cookie.
    """
    settings = get_settings()
    with connect() as conn:
        invite = invites_repo.find_valid_invite(conn, hash_session_token(token))
        if not invite:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Convite inválido, expirado ou já utilizado.")

        if invites_repo.find_user_by_email(conn, payload.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Este e-mail já possui conta. Entre pelo login ou peça um novo acesso à EG.",
            )

        user_id = invites_repo.create_user(
            conn,
            payload.email,
            payload.display_name.strip(),
            hash_password(payload.password),
        )
        invites_repo.create_membership(conn, user_id, invite["organization_id"], "client_user")
        invites_repo.mark_invite_used(conn, invite["id"], user_id)

        session_token = new_session_token()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.session_ttl_hours)
        invites_repo.create_session(conn, user_id, hash_session_token(session_token), expires_at)

        client_hub_repo.write_audit(
            conn,
            user_id,
            invite["organization_id"],
            "invite.accepted",
            {"invite_id": str(invite["id"]), "email": payload.email},
        )

    return session_token, expires_at, user_id


def _accessible_client(conn, client_id: UUID, user: CurrentUserResponse):
    # Convite só faz sentido em workspace de cliente; o interno da agência não é convidável.
    return resolve_accessible_client(conn, client_id, user, require_kind="client")
