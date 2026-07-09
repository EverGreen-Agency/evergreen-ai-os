from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "local"
    api_name: str = "Bioma API"
    database_url: str = "postgresql://bioma:bioma@localhost:5433/bioma"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    session_cookie_name: str = "bioma_session"
    session_ttl_hours: int = 12
    clickup_api_token: str | None = None
    clickup_api_base_url: str = "https://api.clickup.com/api/v2"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
