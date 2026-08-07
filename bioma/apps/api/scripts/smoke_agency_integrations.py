"""Smoke do dogfooding de métricas: a EG mede a própria mídia.

Por que existe: o pipeline de performance é chaveado por `clients.id`, e a EG
tem um registro próprio ("EverGreen Internal", criado por `create_eg_client.py`)
que é **escondido da carteira de propósito** (`externalClients` filtra o slug
`eg`). Essa combinação — existe no banco, some da interface — é exatamente o
tipo de caminho que quebra sem ninguém perceber, porque nenhuma tela de cliente
exercita ele.

Valida:
- o registro interno da EG existe e resolve pelo mesmo gate dos clientes;
- dá para cadastrar a conta de mídia da EG (o vínculo com o MCC/BM vive em
  `external_parent_id`, separado da credencial, que é do ambiente);
- a conexão da EG **não vaza** para a listagem de um cliente e vice-versa;
- a superfície `operacao.integracoes` é permitida para EG e inexistente para
  usuário de cliente.

NÃO valida chamada real ao Google/Meta — isso depende de credencial externa e
está fora do alcance de um smoke.
"""

from pathlib import Path
import atexit
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient

from bioma_api.db import connect
from bioma_api.main import app
from smoke_support import cleanup_smoke_data, create_smoke_workspace, grant_client_user, upsert_smoke_user

ADMIN_EMAIL = "eduardo@evergreengrowth.com.br"
CLIENT_EMAIL = "smoke-agency-integrations-client@bioma.example.com"
PASSWORD = "senha-dev-123"

# Conta fictícia mas inconfundível: se aparecer numa tela, é resíduo de smoke.
SMOKE_ACCOUNT_ID = "smoke-eg-000000"


def assert_status(response, expected: int, label: str) -> None:
    if response.status_code != expected:
        raise AssertionError(f"{label}: esperado {expected}, recebido {response.status_code}: {response.text}")


def find_internal_client(conn):
    return conn.execute(
        """
        select c.id
        from clients c
        join organizations o on o.id = c.organization_id
        where o.slug = 'eg'
        order by c.created_at
        limit 1
        """
    ).fetchone()


def main() -> None:
    with connect() as conn:
        internal = find_internal_client(conn)
    if not internal:
        raise AssertionError(
            "Registro interno da EG não existe. Rode scripts/create_eg_client.py "
            "(idempotente, não cria workspace novo)."
        )
    internal_client_id = internal["id"]

    workspace = create_smoke_workspace("AGENCYINT")
    client_user_id = upsert_smoke_user(CLIENT_EMAIL, "Smoke Cliente Integrações", PASSWORD)
    grant_client_user(workspace, client_user_id)
    atexit.register(cleanup_smoke_data, [workspace.organization_id], [CLIENT_EMAIL])

    try:
        admin = TestClient(app)
        assert_status(admin.post("/auth/login", json={"email": ADMIN_EMAIL, "password": PASSWORD}), 200, "login admin")

        # ---------------------------------------------------------------- 1
        response = admin.get(f"/clients/{internal_client_id}/performance/connections")
        assert_status(response, 200, "listar conexões da EG")
        print(f"ok: registro interno da EG resolve pelo gate de clientes ({len(response.json())} conexões)")

        # ---------------------------------------------------------------- 2
        # Cadastrar a conta da EG, com o MCC no external_parent_id.
        response = admin.post(
            f"/clients/{internal_client_id}/performance/connections",
            json={
                "provider": "google_ads",
                "external_account_id": SMOKE_ACCOUNT_ID,
                "external_parent_id": "smoke-mcc-000000",
                "display_name": "Smoke EG Ads",
            },
        )
        assert_status(response, 201, "criar conexão da EG")
        created = [item for item in response.json() if item["external_account_id"] == SMOKE_ACCOUNT_ID]
        if not created:
            raise AssertionError("conexão criada não voltou na listagem")
        if created[0]["external_parent_id"] != "smoke-mcc-000000":
            raise AssertionError("o vínculo com o MCC não foi preservado")
        print("ok: conta da EG cadastrada com o MCC em external_parent_id (credencial fica no ambiente)")

        # ---------------------------------------------------------------- 3
        # Isolamento: a conta da EG não pode aparecer na listagem do cliente.
        response = admin.get(f"/clients/{workspace.client_id}/performance/connections")
        assert_status(response, 200, "listar conexões do cliente")
        if any(item["external_account_id"] == SMOKE_ACCOUNT_ID for item in response.json()):
            raise AssertionError("a conexão da EG vazou para a listagem de um cliente")
        print("ok: conexão da EG não vaza para a carteira de cliente")

        # ---------------------------------------------------------------- 4
        # Usuário de cliente não alcança o registro interno da EG. 404 (não
        # 403) porque não se confirma a existência do que não é dele.
        cliente = TestClient(app)
        assert_status(cliente.post("/auth/login", json={"email": CLIENT_EMAIL, "password": PASSWORD}), 200, "login cliente")
        response = cliente.get(f"/clients/{internal_client_id}/performance/connections")
        if response.status_code not in (403, 404):
            raise AssertionError(f"cliente alcançou o registro interno da EG: {response.status_code}")
        print(f"ok: usuário de cliente não alcança o registro interno da EG ({response.status_code})")

        # ---------------------------------------------------------------- 5
        surfaces = admin.get("/me/surfaces").json()
        entry = next((item for item in surfaces if item["surface_key"] == "operacao.integracoes"), None)
        if not entry or not entry["allowed"]:
            raise AssertionError(f"superfície operacao.integracoes indisponível para EG: {entry}")

        client_surfaces = cliente.get("/me/surfaces").json()
        if any(item["surface_key"] == "operacao.integracoes" for item in client_surfaces):
            raise AssertionError("superfície interna da EG apareceu para usuário de cliente")
        print("ok: superfície operacao.integracoes é da EG e não existe para cliente")

        print("\nSMOKE AGENCY INTEGRATIONS: OK")
    finally:
        with connect() as conn:
            conn.execute(
                "delete from performance_connections where external_account_id = %s",
                (SMOKE_ACCOUNT_ID,),
            )
        cleanup_smoke_data([workspace.organization_id], [CLIENT_EMAIL])


if __name__ == "__main__":
    main()
