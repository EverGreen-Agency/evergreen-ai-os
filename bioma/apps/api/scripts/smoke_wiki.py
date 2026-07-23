"""Smoke do Wiki EG: CRUD de documento markdown + degradação de anexo sem S3.

Roda in-process com TestClient contra DATABASE_URL, logado como EG admin do
seed. Cria e remove o próprio documento (self-clean). Anexo sem S3 configurado
deve responder 503 controlado, não 500.
"""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient

from bioma_api.main import app

ADMIN_EMAIL = "eduardo@evergreengrowth.com.br"
CLIENT_EMAIL = "henrique@hmconexoes.com.br"
DEV_PASSWORD = "senha-dev-123"


def assert_status(response, expected, label):
    if response.status_code != expected:
        raise AssertionError(f"{label}: esperado {expected}, recebido {response.status_code}: {response.text}")


def login(client, email):
    assert_status(client.post("/auth/login", json={"email": email, "password": DEV_PASSWORD}), 200, f"login {email}")


def main() -> None:
    admin = TestClient(app)
    client_user = TestClient(app)
    login(admin, ADMIN_EMAIL)
    login(client_user, CLIENT_EMAIL)

    # Criar documento.
    created = admin.post(
        "/backoffice/wiki/documents",
        json={"category": "operacao", "title": "Metodologia Raio-X (smoke)", "content": "# Raio-X\nConteúdo."},
    )
    assert_status(created, 201, "criar documento")
    document_id = created.json()["id"]
    assert created.json()["category"] == "operacao"

    # Cliente comum não acessa o wiki interno.
    assert_status(client_user.get("/backoffice/wiki/documents"), 403, "cliente bloqueado na listagem")
    assert_status(client_user.get(f"/backoffice/wiki/documents/{document_id}"), 403, "cliente bloqueado no detalhe")

    # Listar e encontrar o documento criado.
    listing = admin.get("/backoffice/wiki/documents")
    assert_status(listing, 200, "listar documentos")
    assert any(row["id"] == document_id for row in listing.json()), "documento criado não apareceu na lista"

    # Detalhe.
    detail = admin.get(f"/backoffice/wiki/documents/{document_id}")
    assert_status(detail, 200, "detalhe do documento")
    assert detail.json()["content"].startswith("# Raio-X")
    assert detail.json()["attachments"] == []

    # Atualizar (título + categoria).
    updated = admin.patch(
        f"/backoffice/wiki/documents/{document_id}",
        json={"title": "Metodologia Raio-X v2", "category": "geral"},
    )
    assert_status(updated, 200, "atualizar documento")
    assert updated.json()["title"] == "Metodologia Raio-X v2"
    assert updated.json()["category"] == "geral"

    # Anexo sem S3 configurado: 503 controlado, não 500.
    upload = admin.post(
        f"/backoffice/wiki/documents/{document_id}/attachments",
        files={"file": ("nota.txt", b"conteudo", "text/plain")},
    )
    if upload.status_code not in (201, 503):
        raise AssertionError(f"upload anexo: esperado 201 ou 503, recebido {upload.status_code}: {upload.text}")

    # Remover documento.
    assert_status(admin.delete(f"/backoffice/wiki/documents/{document_id}"), 204, "excluir documento")
    assert_status(admin.get(f"/backoffice/wiki/documents/{document_id}"), 404, "documento removido")

    print("wiki smoke ok")


if __name__ == "__main__":
    main()
