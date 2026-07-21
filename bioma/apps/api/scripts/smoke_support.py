from dataclasses import dataclass
from uuid import UUID, uuid4

from psycopg.types.json import Jsonb

from bioma_api.db import connect
from bioma_api.security import hash_password


@dataclass(frozen=True)
class SmokeWorkspace:
    tenant_id: UUID
    organization_id: UUID
    client_id: UUID
    workspace_id: UUID
    name: str
    slug: str


def create_smoke_workspace(label: str) -> SmokeWorkspace:
    suffix = uuid4().hex[:10]
    name = f"Smoke {label} {suffix}"
    slug = f"smoke-{label.lower()}-{suffix}"
    with connect() as conn:
        tenant = conn.execute(
            "select id from organizations where slug = 'eg' and type = 'eg' order by created_at limit 1"
        ).fetchone()
        if not tenant:
            raise RuntimeError("Tenant EG não encontrado; rode seed_dev.py antes dos smokes.")
        organization_id = conn.execute(
            """
            insert into organizations (name, slug, type, parent_organization_id, enabled_modules)
            values (%s, %s, 'client', %s, %s) returning id
            """,
            (
                name,
                slug,
                tenant["id"],
                Jsonb(["hub", "content", "files", "commercial", "analytics", "integrations"]),
            ),
        ).fetchone()["id"]
        client_id = conn.execute(
            """
            insert into clients (organization_id, name, status, responsible_name)
            values (%s, %s, 'active', 'Smoke') returning id
            """,
            (organization_id, name),
        ).fetchone()["id"]
        workspace_id = conn.execute(
            """
            insert into workspaces (
              tenant_organization_id, subject_organization_id, kind, name, slug, status
            ) values (%s, %s, 'client', %s, %s, 'active') returning id
            """,
            (tenant["id"], organization_id, name, slug),
        ).fetchone()["id"]
    return SmokeWorkspace(tenant["id"], organization_id, client_id, workspace_id, name, slug)


def upsert_smoke_user(email: str, name: str, password: str) -> UUID:
    with connect() as conn:
        row = conn.execute("select id from users where lower(email) = lower(%s)", (email,)).fetchone()
        if row:
            conn.execute(
                "update users set display_name = %s, password_hash = %s, is_active = true where id = %s",
                (name, hash_password(password), row["id"]),
            )
            return row["id"]
        return conn.execute(
            "insert into users (email, display_name, password_hash) values (%s, %s, %s) returning id",
            (email, name, hash_password(password)),
        ).fetchone()["id"]


def grant_client_user(workspace: SmokeWorkspace, user_id: UUID) -> None:
    with connect() as conn:
        conn.execute(
            """
            insert into memberships (user_id, organization_id, role)
            values (%s, %s, 'client_user') on conflict do nothing
            """,
            (user_id, workspace.organization_id),
        )


def cleanup_smoke_data(organization_ids: list[UUID], emails: list[str]) -> None:
    with connect() as conn:
        if organization_ids:
            conn.execute("delete from organizations where id = any(%s)", (organization_ids,))
        if emails:
            conn.execute("delete from users where lower(email) = any(%s)", ([email.lower() for email in emails],))
