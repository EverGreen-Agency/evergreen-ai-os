"""Cria o cliente interno "EverGreen" (dogfooding: a EG como cliente de si mesma).

Idempotente. Usa a conexão do projeto (DATABASE_URL), não string hardcoded.
"""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bioma_api.db import connect  # noqa: E402
from bioma_api.repositories import workspaces as workspaces_repo  # noqa: E402


def main() -> None:
    with connect() as conn:
        org = conn.execute("select id from organizations where slug = 'eg'").fetchone()
        if not org:
            raise SystemExit("Organização EG não encontrada — rode as migrations/seed antes.")

        existing = conn.execute(
            "select id from clients where organization_id = %s",
            (org["id"],),
        ).fetchone()
        if existing:
            client_id = existing["id"]
            print(f"Cliente EG já existe: {client_id}")
        else:
            client_id = conn.execute(
                """
                insert into clients (organization_id, name, status, responsible_name)
                values (%s, 'EverGreen Internal', 'active', 'Eduardo EG')
                returning id
                """,
                (org["id"],),
            ).fetchone()["id"]
            print(f"Cliente EG criado: {client_id}")

        workspaces_repo.provision_agency_workspace(conn, org["id"], "Operação EG")


if __name__ == "__main__":
    main()
