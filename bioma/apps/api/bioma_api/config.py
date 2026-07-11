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
    clickup_api_token: str | None = None
    clickup_api_base_url: str = "https://api.clickup.com/api/v2"
    clickup_task_page_limit: int = 3

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip()]

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
