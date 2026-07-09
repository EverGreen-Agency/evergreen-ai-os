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


def upsert_artifact(
    conn,
    organization_id,
    title: str,
    kind: str,
    visibility: str,
    content: str,
    url: str | None = None,
) -> None:
    row = conn.execute(
        """
        select id from artifacts
        where organization_id = %s and title = %s and kind = %s
        """,
        (organization_id, title, kind),
    ).fetchone()
    if row:
        conn.execute(
            """
            update artifacts
            set visibility = %s, content = %s, url = %s
            where id = %s
            """,
            (visibility, content, url, row["id"]),
        )
        return
    conn.execute(
        """
        insert into artifacts (organization_id, title, kind, visibility, content, url)
        values (%s, %s, %s, %s, %s, %s)
        """,
        (organization_id, title, kind, visibility, content, url),
    )


def upsert_deliverable(
    conn,
    organization_id,
    title: str,
    status: str,
    due_at: str | None = None,
    clickup_task_id: str | None = None,
):
    row = conn.execute(
        """
        select id from deliverables
        where organization_id = %s and title = %s
        """,
        (organization_id, title),
    ).fetchone()
    if row:
        conn.execute(
            """
            update deliverables
            set status = %s, due_at = %s, clickup_task_id = %s, updated_at = now()
            where id = %s
            """,
            (status, due_at, clickup_task_id, row["id"]),
        )
        return row["id"]
    return conn.execute(
        """
        insert into deliverables (organization_id, title, status, due_at, clickup_task_id)
        values (%s, %s, %s, %s, %s)
        returning id
        """,
        (organization_id, title, status, due_at, clickup_task_id),
    ).fetchone()["id"]


def ensure_pending_approval(conn, organization_id, deliverable_id, requested_by, comment: str) -> None:
    row = conn.execute(
        """
        select id from approvals
        where organization_id = %s and deliverable_id = %s
        order by created_at asc
        limit 1
        """,
        (organization_id, deliverable_id),
    ).fetchone()
    if row:
        conn.execute(
            """
            update approvals
            set status = 'pending', comment = %s, requested_by = %s, decided_by = null, decided_at = null
            where id = %s
            """,
            (comment, requested_by, row["id"]),
        )
        conn.execute(
            """
            delete from approvals
            where organization_id = %s and deliverable_id = %s and id <> %s
            """,
            (organization_id, deliverable_id, row["id"]),
        )
        return
    conn.execute(
        """
        insert into approvals (organization_id, deliverable_id, requested_by, status, comment)
        values (%s, %s, %s, 'pending', %s)
        """,
        (organization_id, deliverable_id, requested_by, comment),
    )


def ensure_sync_run(conn, organization_id, source: str, status: str, summary: str) -> None:
    exists = conn.execute(
        """
        select id from sync_runs
        where organization_id = %s and source = %s
        limit 1
        """,
        (organization_id, source),
    ).fetchone()
    if exists:
        conn.execute(
            """
            update sync_runs
            set status = %s, summary = %s::jsonb, finished_at = now()
            where id = %s
            """,
            (status, summary, exists["id"]),
        )
        return
    conn.execute(
        """
        insert into sync_runs (organization_id, source, status, summary, finished_at)
        values (%s, %s, %s, %s::jsonb, now())
        """,
        (organization_id, source, status, summary),
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
            insert into clients (organization_id, name, status, responsible_name, clickup_folder_id)
            values (%s, 'HM Conexões Poderosas', 'onboarding', 'Eduardo EG', 'hm-clickup-folder-demo')
            on conflict (organization_id)
            do update set
              name = excluded.name,
              status = excluded.status,
              responsible_name = excluded.responsible_name,
              clickup_folder_id = excluded.clickup_folder_id
            """,
            (hm_id,),
        )

        upsert_artifact(
            conn,
            hm_id,
            "Briefing estratégico HM",
            "briefing",
            "client",
            "Direcionamento inicial para posicionamento, relacionamento e conteúdo no LinkedIn.",
        )
        upsert_artifact(
            conn,
            hm_id,
            "Brand book v0",
            "brand_book",
            "client",
            "Base de tom de voz, mensagens-chave e pilares editoriais para validação do cliente.",
        )
        upsert_artifact(
            conn,
            hm_id,
            "Mapa operacional ClickUp",
            "integration_map",
            "internal",
            "Estrutura inicial de listas, campos e status que será espelhada no Bioma.",
        )

        briefing_id = upsert_deliverable(
            conn,
            hm_id,
            "Aprovar briefing estratégico",
            "waiting_approval",
            "2026-07-12 18:00:00-03",
            "clickup-demo-briefing",
        )
        upsert_deliverable(
            conn,
            hm_id,
            "Configurar hub do cliente",
            "in_progress",
            "2026-07-15 18:00:00-03",
            "clickup-demo-hub",
        )
        upsert_deliverable(
            conn,
            hm_id,
            "Publicar calendário editorial inicial",
            "planned",
            "2026-07-18 18:00:00-03",
            "clickup-demo-calendar",
        )
        ensure_pending_approval(
            conn,
            hm_id,
            briefing_id,
            admin_id,
            "Cliente precisa validar antes de seguir para brand book e calendário.",
        )
        ensure_sync_run(
            conn,
            hm_id,
            "clickup",
            "partial",
            '{"listas": 2, "tarefas": 3, "modo": "demo-read-only"}',
        )

    print("seed ok")
    print("admin: eduardo@evergreengrowth.com.br / senha-dev-123")
    print("cliente: henrique@hmconexoes.com.br / senha-dev-123")


if __name__ == "__main__":
    main()
