from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from bioma_api.auth import current_user_from_request, session_cookie_kwargs
from bioma_api.config import get_settings
from bioma_api.db import connect
from bioma_api.schemas.auth import CurrentUserResponse, LoginRequest, LoginResponse
from bioma_api.security import hash_session_token, new_session_token, verify_password
from bioma_api.services import rate_limit


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, request: Request, response: Response) -> LoginResponse:
    settings = get_settings()
    email = payload.email.lower()
    recent_failures = rate_limit.assert_login_allowed(request, email)

    with connect() as conn:
        user = conn.execute(
            """
            select id, email, display_name, password_hash
            from users
            where lower(email) = %s and is_active = true
            """,
            (email,),
        ).fetchone()

        credentials_ok = bool(user) and verify_password(payload.password, user["password_hash"])

    # Fora do `with`: o bloco acima faz rollback ao propagar a exceção, e o
    # registro da tentativa precisa sobreviver ao 401 para o limite contar.
    if not credentials_ok:
        rate_limit.record_failed_login(request, email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
        )

    if recent_failures:
        rate_limit.clear_failed_login(request, email)

    with connect() as conn:
        token = new_session_token()
        token_hash = hash_session_token(token)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.session_ttl_hours)

        conn.execute(
            """
            insert into sessions (user_id, token_hash, expires_at)
            values (%s, %s, %s)
            """,
            (user["id"], token_hash, expires_at),
        )
        conn.execute(
            """
            insert into audit_logs (actor_user_id, event_type, metadata)
            values (%s, 'auth.login', jsonb_build_object('email', %s::text))
            """,
            (user["id"], email),
        )

    response.set_cookie(value=token, **session_cookie_kwargs(expires_at))
    current = current_user_from_request(_request_from_token(settings.session_cookie_name, token))
    return LoginResponse(user=current, expires_at=expires_at)


@router.post("/logout")
def logout(request: Request, response: Response) -> dict[str, str]:
    settings = get_settings()
    token = request.cookies.get(settings.session_cookie_name)
    if token:
        with connect() as conn:
            conn.execute(
                "update sessions set revoked_at = now() where token_hash = %s and revoked_at is null",
                (hash_session_token(token),),
            )
    response.delete_cookie(
        settings.session_cookie_name,
        path="/",
        domain=settings.session_cookie_domain,
        secure=settings.cookie_secure,
        httponly=True,
        samesite=settings.session_cookie_samesite,
    )
    return {"status": "ok"}


@router.get("/me", response_model=CurrentUserResponse)
def me(user: CurrentUserResponse = Depends(current_user_from_request)) -> CurrentUserResponse:
    return user


class _request_from_token:
    def __init__(self, cookie_name: str, token: str) -> None:
        self.cookies = {cookie_name: token}
