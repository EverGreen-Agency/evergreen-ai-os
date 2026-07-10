from pathlib import Path
import sys
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient

from bioma_api.db import connect
from bioma_api.main import app


ADMIN_EMAIL = "eduardo@evergreengrowth.com.br"
CLIENT_EMAIL = "henrique@hmconexoes.com.br"
DEV_PASSWORD = "senha-dev-123"


def assert_status(response, expected: int, label: str) -> None:
    if response.status_code != expected:
        raise AssertionError(f"{label}: esperado {expected}, recebido {response.status_code}: {response.text}")


def login(client: TestClient, email: str) -> None:
    response = client.post("/auth/login", json={"email": email, "password": DEV_PASSWORD})
    assert_status(response, 200, f"login {email}")


def main() -> None:
    admin = TestClient(app)
    client_user = TestClient(app)
    login(admin, ADMIN_EMAIL)
    login(client_user, CLIENT_EMAIL)

    clients = admin.get("/clients")
    assert_status(clients, 200, "listar clientes")
    hm_client_id = clients.json()[0]["id"]

    period = {"date_from": "2026-07-01", "date_to": "2026-07-31"}
    overview = admin.get(f"/clients/{hm_client_id}/performance", params=period)
    assert_status(overview, 200, "overview admin")
    overview_body = overview.json()
    assert overview_body["ads"]["impressions"] > 0
    assert overview_body["daily"]
    assert overview_body["freshness"]

    client_overview = client_user.get(f"/clients/{hm_client_id}/performance", params=period)
    assert_status(client_overview, 200, "overview cliente")

    endpoints = (
        ("google-ads/campaigns", "campanhas", period),
        ("ga4/acquisition", "aquisição GA4", period),
        ("search-console/queries", "consultas GSC", period),
        ("gtm/snapshots", "snapshots GTM", None),
    )
    for path, label, params in endpoints:
        response = admin.get(f"/clients/{hm_client_id}/performance/{path}", params=params)
        assert_status(response, 200, label)
        assert response.json(), f"seed deve popular {label}"

    blocked_sync = client_user.post(
        f"/clients/{hm_client_id}/performance/sync",
        json={"provider": "all", **period},
    )
    assert_status(blocked_sync, 403, "cliente não pode sincronizar")

    queued_sync = admin.post(
        f"/clients/{hm_client_id}/performance/sync",
        json={"provider": "all", **period},
    )
    assert_status(queued_sync, 202, "admin enfileira sync")
    assert queued_sync.json()["status"] == "queued"
    queued_sync_id = queued_sync.json()["id"]

    suffix = uuid4().hex[:8]
    created = admin.post(
        "/clients",
        json={
            "name": f"Performance Smoke {suffix}",
            "organization_name": f"Performance Smoke {suffix}",
            "status": "onboarding",
        },
    )
    assert_status(created, 201, "criar cliente isolado")
    created_client_id = created.json()["client"]["id"]
    created_org_id = created.json()["client"]["organization_id"]

    hidden = client_user.get(f"/clients/{created_client_id}/performance")
    assert_status(hidden, 404, "BOLA performance")

    connection = admin.post(
        f"/clients/{created_client_id}/performance/connections",
        json={
            "provider": "ga4",
            "external_account_id": "properties/123456",
            "display_name": "GA4 smoke",
            "credentials_ref": "env:GOOGLE_SERVICE_ACCOUNT_JSON",
        },
    )
    assert_status(connection, 201, "criar conexão")

    with connect() as conn:
        conn.execute("delete from sync_runs where id = %s", (queued_sync_id,))
        conn.execute("delete from organizations where id = %s", (created_org_id,))

    print("performance smoke ok")


if __name__ == "__main__":
    main()
