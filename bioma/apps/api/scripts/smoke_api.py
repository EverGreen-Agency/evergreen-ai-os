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
    guest = TestClient(app)
    client_user = TestClient(app)

    cors = guest.options(
        "/health",
        headers={
            "Origin": "http://127.0.0.1:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert_status(cors, 200, "cors preflight")
    assert cors.headers.get("access-control-allow-origin") == "http://127.0.0.1:5173"

    assert_status(guest.get("/health"), 200, "health")

    login(admin, ADMIN_EMAIL)
    login(client_user, CLIENT_EMAIL)

    clients_response = admin.get("/clients")
    assert_status(clients_response, 200, "admin list clients")
    clients = clients_response.json()
    assert clients, "seed precisa criar ao menos um cliente"
    hm_client_id = clients[0]["id"]

    client_clients = client_user.get("/clients")
    assert_status(client_clients, 200, "client list clients")
    assert len(client_clients.json()) == 1, "cliente deve enxergar apenas a própria organização no seed"

    blocked_sync = client_user.post(f"/clients/{hm_client_id}/sync/clickup")
    assert_status(blocked_sync, 403, "client cannot sync clickup")

    suffix = uuid4().hex[:8]
    created = admin.post(
        "/clients",
        json={
            "name": f"Smoke Cliente {suffix}",
            "organization_name": f"Smoke Organização {suffix}",
            "status": "onboarding",
            "responsible_name": "Eduardo EG",
            "clickup_folder_id": f"smoke-folder-{suffix}",
        },
    )
    assert_status(created, 201, "create client")
    created_body = created.json()
    created_client_id = created_body["client"]["id"]
    created_org_id = created_body["client"]["organization_id"]

    hidden = client_user.get(f"/clients/{created_client_id}")
    assert_status(hidden, 404, "client cannot read another client")

    updated = admin.patch(
        f"/clients/{created_client_id}",
        json={"status": "active", "responsible_name": "CTO EG"},
    )
    assert_status(updated, 200, "update client")
    assert updated.json()["client"]["status"] == "active"

    artifact = admin.post(
        f"/clients/{created_client_id}/artifacts",
        json={
            "title": "Briefing smoke",
            "kind": "briefing",
            "visibility": "client",
            "content": "Conteúdo editável criado pelo smoke test.",
        },
    )
    assert_status(artifact, 201, "create artifact")
    artifact_id = artifact.json()["artifacts"][0]["id"]

    edited_artifact = admin.patch(
        f"/clients/{created_client_id}/artifacts/{artifact_id}",
        json={"title": "Briefing smoke editado"},
    )
    assert_status(edited_artifact, 200, "update artifact")

    deliverable = admin.post(
        f"/clients/{created_client_id}/deliverables",
        json={"title": "Entrega smoke", "status": "planned"},
    )
    assert_status(deliverable, 201, "create deliverable")
    deliverable_id = deliverable.json()["deliverables"][0]["id"]

    delivered = admin.patch(
        f"/clients/{created_client_id}/deliverables/{deliverable_id}",
        json={"status": "in_progress"},
    )
    assert_status(delivered, 200, "update deliverable")

    sync = admin.post(f"/clients/{created_client_id}/sync/clickup")
    assert_status(sync, 200, "admin sync clickup dry-run")

    with connect() as conn:
        conn.execute("delete from organizations where id = %s", (created_org_id,))

    print("smoke ok")


if __name__ == "__main__":
    main()
