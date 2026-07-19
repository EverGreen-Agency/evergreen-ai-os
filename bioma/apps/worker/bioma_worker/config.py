from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class WorkerSettings(BaseSettings):
    database_url: str = "postgresql://bioma:bioma@localhost:5433/bioma"
    google_service_account_json: str | None = None
    google_ads_developer_token: str | None = None
    google_ads_login_customer_id: str | None = None
    google_ads_api_version: str = "v21"
    google_request_timeout_seconds: float = 60
    openai_api_key: str | None = None
    openai_model: str = "gpt-5.6-sol"
    openai_request_timeout_seconds: float = 120

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> WorkerSettings:
    return WorkerSettings()
