import json
from typing import Any

import httpx
from google.auth.transport.requests import Request
from google.oauth2 import service_account

from bioma_worker.config import WorkerSettings


class GoogleApiClient:
    def __init__(self, settings: WorkerSettings) -> None:
        self.settings = settings
        self._credentials: dict[tuple[str, ...], service_account.Credentials] = {}

    def request_json(
        self,
        method: str,
        url: str,
        scopes: tuple[str, ...],
        *,
        json_body: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        request_headers = {
            "Authorization": f"Bearer {self._access_token(scopes)}",
            "Content-Type": "application/json",
            **(headers or {}),
        }
        with httpx.Client(timeout=self.settings.google_request_timeout_seconds) as client:
            response = client.request(method, url, headers=request_headers, json=json_body)
        response.raise_for_status()
        return response.json()

    def _access_token(self, scopes: tuple[str, ...]) -> str:
        credentials = self._credentials.get(scopes)
        if credentials and credentials.valid and credentials.token:
            return credentials.token

        raw_credentials = self.settings.google_service_account_json
        if not raw_credentials:
            raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_JSON não configurado no worker.")

        try:
            service_account_info = json.loads(raw_credentials)
        except json.JSONDecodeError as exc:
            raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_JSON contém JSON inválido.") from exc

        if credentials is None:
            credentials = service_account.Credentials.from_service_account_info(
                service_account_info,
                scopes=list(scopes),
            )
            self._credentials[scopes] = credentials
        credentials.refresh(Request())
        if not credentials.token:
            raise RuntimeError("Google OAuth não retornou access token.")
        return credentials.token
