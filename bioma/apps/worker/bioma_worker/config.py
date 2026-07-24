from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class WorkerSettings(BaseSettings):
    database_url: str = "postgresql://bioma:bioma@localhost:5433/bioma"
    google_service_account_json: str | None = None
    google_ads_developer_token: str | None = None
    google_ads_login_customer_id: str | None = None
    google_ads_api_version: str = "v21"
    google_request_timeout_seconds: float = 60
    meta_ads_access_token: str | None = None
    meta_ads_api_version: str = "v21.0"
    linkedin_ads_access_token: str | None = None
    linkedin_ads_api_version: str = "202504"
    openai_api_key: str | None = None
    openai_model: str = "gpt-5.6-sol"
    openai_request_timeout_seconds: float = 120
    # QUEUE-001: o lease precisa ser maior que o job mais longo esperado
    # (sync de 30 dias em 4 providers), senão o reaper reenfileira job vivo.
    # O heartbeat entre providers dá folga; 15 min é a margem para o resto.
    job_lease_seconds: int = 900
    job_max_attempts: int = 3

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> WorkerSettings:
    return WorkerSettings()
