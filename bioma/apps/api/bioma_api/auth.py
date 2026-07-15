from datetime import datetime, timezone

from fastapi import HTTPException, Request, status

from bioma_api.config import get_settings
from bioma_api.db import connect
from bioma_api.security import hash_session_token
from bioma_api.schemas.auth import CurrentUserResponse, OrganizationSummary


def current_user_from_request(request: Request) -> CurrentUserResponse:
    settings = get_settings()
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão ausente.")

    token_hash = hash_session_token(token)
    with connect() as conn:
        session = conn.execute(
            """
            select s.user_id, s.expires_at, u.email, u.display_name
            from sessions s
            join users u on u.id = s.user_id
            where s.token_hash = %s
              and s.revoked_at is null
              and s.expires_at > now()
              and u.is_active = true
            """,
            (token_hash,),
        ).fetchone()

        if not session:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão inválida.")

        memberships = conn.execute(
            """
            select o.id, o.name, o.slug, m.role, o.enabled_modules
            from memberships m
            join organizations o on o.id = m.organization_id
            where m.user_id = %s
            order by o.type, o.name
            """,
            (session["user_id"],),
        ).fetchall()

    return CurrentUserResponse(
        id=session["user_id"],
        email=session["email"],
        display_name=session["display_name"],
        organizations=[OrganizationSummary(**row) for row in memberships],
    )


def session_cookie_kwargs(expires_at: datetime) -> dict[str, object]:
    settings = get_settings()
    max_age = max(0, int((expires_at - datetime.now(timezone.utc)).total_seconds()))
    kwargs: dict[str, object] = {
        "key": settings.session_cookie_name,
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": settings.session_cookie_samesite,
        "max_age": max_age,
        "path": "/",
    }
    if settings.session_cookie_domain:
        kwargs["domain"] = settings.session_cookie_domain
    return kwargs
