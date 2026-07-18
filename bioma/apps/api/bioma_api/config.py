from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: Literal["local", "staging", "production"] = "local"
    api_name: str = "Bioma API"
    database_url: str = "postgresql://bioma:bioma@localhost:5433/bioma"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
    session_cookie_name: str = "bioma_session"
    session_ttl_hours: int = 12
    session_cookie_secure: bool | None = None
    session_cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    session_cookie_domain: str | None = None
    login_rate_limit_attempts: int = 5
    login_rate_limit_window_seconds: int = 300
    clickup_api_token: str | None = None
    clickup_api_base_url: str = "https://api.clickup.com/api/v2"
    clickup_task_page_limit: int = 3
    storage_s3_bucket: str | None = None
    storage_s3_region: str = "auto"
    storage_s3_endpoint_url: str | None = None
    storage_s3_access_key_id: str | None = None
    storage_s3_secret_access_key: str | None = None
    storage_s3_force_path_style: bool = True
    storage_max_upload_mb: int = 20
    google_oauth_client_id: str | None = None
    google_oauth_client_secret: str | None = None
    # Chave Fernet para segredos de integração em repouso (Kommo etc.).
    secret_encryption_key: str | None = None
    # Base pública da própria API (redirect_uri do OAuth) e do app web
    # (destino final dos redirects) — distintas porque web e API vivem em
    # subdomínios diferentes.
    api_public_url: str = "http://127.0.0.1:8000"
    web_app_url: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def storage_configured(self) -> bool:
        return bool(
            self.storage_s3_bucket and self.storage_s3_access_key_id and self.storage_s3_secret_access_key
        )

    @property
    def google_oauth_configured(self) -> bool:
        return bool(self.google_oauth_client_id and self.google_oauth_client_secret)

    @property
    def cookie_secure(self) -> bool:
        if self.session_cookie_secure is not None:
            return self.session_cookie_secure
        return self.app_env != "local"

    @model_validator(mode="after")
    def validate_deployment_settings(self) -> "Settings":
        if self.session_ttl_hours <= 0:
            raise ValueError("SESSION_TTL_HOURS precisa ser maior que zero.")

        if self.session_cookie_samesite == "none" and not self.cookie_secure:
            raise ValueError("SESSION_COOKIE_SAMESITE=none exige SESSION_COOKIE_SECURE=true.")

        if self.app_env != "local":
            if "localhost" in self.database_url or "127.0.0.1" in self.database_url:
                raise ValueError("DATABASE_URL de staging/produção não pode apontar para localhost.")
            if not self.cors_origin_list:
                raise ValueError("CORS_ORIGINS precisa declarar ao menos uma origem em staging/produção.")
            if any("localhost" in origin or "127.0.0.1" in origin for origin in self.cors_origin_list):
                raise ValueError("CORS_ORIGINS de staging/produção não pode conter origem local.")
            if not self.cookie_secure:
                raise ValueError("Cookies de sessão precisam ser Secure em staging/produção.")

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
