"""Limpeza de dados transitórios (item de retenção do LGPD-001).

Remove o que já não tem função e só acumula dado pessoal/técnico:
- sessões expiradas ou revogadas há mais de 7 dias;
- convites usados ou expirados há mais de 30 dias;
- resets de senha usados ou expirados há mais de 30 dias.

Roda no boot da API (scripts/start.py) e pode ser executado manualmente:
    python scripts/cleanup.py
"""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bioma_api.db import connect  # noqa: E402


def run_cleanup(conn) -> dict[str, int]:
    sessions = conn.execute(
        """
        delete from sessions
        where expires_at < now() - interval '7 days'
           or revoked_at < now() - interval '7 days'
        returning id
        """
    ).fetchall()
    invites = conn.execute(
        """
        delete from invites
        where (used_at is not null and used_at < now() - interval '30 days')
           or (used_at is null and expires_at < now() - interval '30 days')
        returning id
        """
    ).fetchall()
    resets = conn.execute(
        """
        delete from password_resets
        where (used_at is not null and used_at < now() - interval '30 days')
           or (used_at is null and expires_at < now() - interval '30 days')
        returning id
        """
    ).fetchall()
    return {"sessions": len(sessions), "invites": len(invites), "password_resets": len(resets)}


def main() -> None:
    with connect() as conn:
        removed = run_cleanup(conn)
    print(f"cleanup ok: {removed}")


if __name__ == "__main__":
    main()
