from datetime import datetime
from uuid import UUID


def find_accessible_client(conn, client_id: UUID, is_admin: bool, user_id: UUID):
    return conn.execute(
        """
        select c.id, c.organization_id, c.name, o.name as organization_name, o.enabled_modules
        from clients c
        join organizations o on o.id = c.organization_id
        join workspaces w
          on w.subject_organization_id = c.organization_id
         and w.kind = 'client'
         and w.status = 'active'
        where c.id = %s
          and (%s or c.organization_id in (
            select organization_id from memberships where user_id = %s
          ))
        """,
        (client_id, is_admin, user_id),
    ).fetchone()


def create_invite(
    conn,
    organization_id: UUID,
    email: str | None,
    token_hash: str,
    expires_at: datetime,
    created_by: UUID,
) -> UUID:
    return conn.execute(
        """
        insert into invites (organization_id, email, token_hash, expires_at, created_by)
        values (%s, %s, %s, %s, %s)
        returning id
        """,
        (organization_id, email, token_hash, expires_at, created_by),
    ).fetchone()["id"]


def list_invites(conn, organization_id: UUID):
    return conn.execute(
        """
        select id, email, expires_at, used_at, created_at
        from invites
        where organization_id = %s
        order by created_at desc
        limit 50
        """,
        (organization_id,),
    ).fetchall()


def delete_invite(conn, organization_id: UUID, invite_id: UUID) -> bool:
    deleted = conn.execute(
        "delete from invites where id = %s and organization_id = %s and used_at is null returning id",
        (invite_id, organization_id),
    ).fetchone()
    return deleted is not None


def find_valid_invite(conn, token_hash: str):
    return conn.execute(
        """
        select
          i.id,
          i.organization_id,
          i.email,
          i.expires_at,
          o.name as organization_name,
          c.name as client_name
        from invites i
        join organizations o on o.id = i.organization_id
        join clients c on c.organization_id = i.organization_id
        join workspaces w
          on w.subject_organization_id = i.organization_id
         and w.kind = 'client'
         and w.status = 'active'
        where i.token_hash = %s
          and i.used_at is null
          and i.expires_at > now()
        """,
        (token_hash,),
    ).fetchone()


def mark_invite_used(conn, invite_id: UUID, user_id: UUID) -> None:
    conn.execute(
        "update invites set used_at = now(), used_by = %s where id = %s",
        (user_id, invite_id),
    )


def find_user_by_email(conn, email: str):
    return conn.execute(
        "select id from users where lower(email) = %s",
        (email.lower(),),
    ).fetchone()


def create_user(conn, email: str, display_name: str, password_hash: str) -> UUID:
    return conn.execute(
        """
        insert into users (email, display_name, password_hash)
        values (%s, %s, %s)
        returning id
        """,
        (email.lower(), display_name, password_hash),
    ).fetchone()["id"]


def create_membership(conn, user_id: UUID, organization_id: UUID, role: str) -> None:
    conn.execute(
        """
        insert into memberships (user_id, organization_id, role)
        values (%s, %s, %s)
        on conflict (user_id, organization_id) do nothing
        """,
        (user_id, organization_id, role),
    )


def create_session(conn, user_id: UUID, token_hash: str, expires_at: datetime) -> None:
    conn.execute(
        "insert into sessions (user_id, token_hash, expires_at) values (%s, %s, %s)",
        (user_id, token_hash, expires_at),
    )
