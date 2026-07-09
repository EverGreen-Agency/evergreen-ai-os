from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bioma_api.db import connect
from bioma_api.security import hash_password


DEV_PASSWORD = "senha-dev-123"


def upsert_org(conn, name: str, slug: str, org_type: str):
    row = conn.execute("select id from organizations where slug = %s", (slug,)).fetchone()
    if row:
        conn.execute(
            "update organizations set name = %s, type = %s, updated_at = now() where id = %s",
            (name, org_type, row["id"]),
        )
        return row["id"]
    return conn.execute(
        "insert into organizations (name, slug, type) values (%s, %s, %s) returning id",
        (name, slug, org_type),
    ).fetchone()["id"]


def upsert_user(conn, email: str, display_name: str):
    password_hash = hash_password(DEV_PASSWORD)
    row = conn.execute("select id from users where lower(email) = %s", (email.lower(),)).fetchone()
    if row:
        conn.execute(
            """
            update users
            set display_name = %s, password_hash = %s, is_active = true, updated_at = now()
            where id = %s
            """,
            (display_name, password_hash, row["id"]),
        )
        return row["id"]
    return conn.execute(
        """
        insert into users (email, display_name, password_hash)
        values (%s, %s, %s)
        returning id
        """,
        (email.lower(), display_name, password_hash),
    ).fetchone()["id"]


def upsert_membership(conn, user_id, organization_id, role: str) -> None:
    conn.execute(
        """
        insert into memberships (user_id, organization_id, role)
        values (%s, %s, %s)
        on conflict (user_id, organization_id)
        do update set role = excluded.role
        """,
        (user_id, organization_id, role),
    )


def main() -> None:
    with connect() as conn:
        eg_id = upsert_org(conn, "EverGreen", "eg", "eg")
        hm_id = upsert_org(conn, "HM Conexões Poderosas", "hm-conexoes", "client")

        admin_id = upsert_user(conn, "eduardo@evergreengrowth.com.br", "Eduardo EG")
        client_id = upsert_user(conn, "henrique@hmconexoes.com.br", "Henrique Miranda")

        upsert_membership(conn, admin_id, eg_id, "eg_admin")
        upsert_membership(conn, admin_id, hm_id, "eg_admin")
        upsert_membership(conn, client_id, hm_id, "client_user")

        conn.execute(
            """
            insert into clients (organization_id, name, status, responsible_name)
            values (%s, 'HM Conexões Poderosas', 'onboarding', 'Eduardo EG')
            on conflict (organization_id)
            do update set name = excluded.name, status = excluded.status, responsible_name = excluded.responsible_name
            """,
            (hm_id,),
        )

    print("seed ok")
    print("admin: eduardo@evergreengrowth.com.br / senha-dev-123")
    print("cliente: henrique@hmconexoes.com.br / senha-dev-123")


if __name__ == "__main__":
    main()
