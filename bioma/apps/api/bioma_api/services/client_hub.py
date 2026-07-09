import re
from uuid import UUID

from fastapi import HTTPException, status
from psycopg.types.json import Jsonb

from bioma_api.db import connect
from bioma_api.domain.models import Role
from bioma_api.integrations.clickup import sync_clickup_folder
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.client_hub import (
    ApprovalDecisionRequest,
    ArtifactCreateRequest,
    ArtifactUpdateRequest,
    ClientCreateRequest,
    ClientPortalResponse,
    ClientSummary,
    ClientUpdateRequest,
    DeliverableCreateRequest,
    DeliverableUpdateRequest,
)


def list_clients(user: CurrentUserResponse) -> list[ClientSummary]:
    is_admin = _is_platform_admin(user)
    with connect() as conn:
        rows = conn.execute(
            _client_summary_sql(_client_access_filter()),
            (is_admin, user.id),
        ).fetchall()
    return [ClientSummary(**row) for row in rows]


def create_client(payload: ClientCreateRequest, user: CurrentUserResponse) -> ClientPortalResponse:
    _require_platform_admin(user)
    client_name = payload.name.strip()
    if not client_name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Nome do cliente é obrigatório.")

    with connect() as conn:
        organization_name = (payload.organization_name or client_name).strip()
        organization_slug = _unique_org_slug(conn, payload.organization_slug or organization_name)
        organization_id = conn.execute(
            """
            insert into organizations (name, slug, type)
            values (%s, %s, 'client')
            returning id
            """,
            (organization_name, organization_slug),
        ).fetchone()["id"]
        client_id = conn.execute(
            """
            insert into clients (organization_id, name, status, responsible_name, clickup_folder_id)
            values (%s, %s, %s, %s, %s)
            returning id
            """,
            (organization_id, client_name, payload.status, payload.responsible_name, payload.clickup_folder_id),
        ).fetchone()["id"]
        _write_audit(
            conn,
            user,
            organization_id,
            "client.created",
            {"client_id": str(client_id), "name": client_name},
        )

    return get_client_portal(client_id, user)


def get_client_portal(client_id: UUID, user: CurrentUserResponse) -> ClientPortalResponse:
    is_admin = _is_platform_admin(user)
    with connect() as conn:
        client = conn.execute(
            _client_summary_sql(f"and c.id = %s {_client_access_filter()}"),
            (client_id, is_admin, user.id),
        ).fetchone()
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")

        artifacts = conn.execute(
            """
            select id, title, kind, visibility, url, content, created_at
            from artifacts
            where organization_id = %s
              and (%s or visibility = 'client')
            order by created_at desc
            limit 50
            """,
            (client["organization_id"], is_admin),
        ).fetchall()

        deliverables = conn.execute(
            """
            select id, title, status, due_at, clickup_task_id, updated_at
            from deliverables
            where organization_id = %s
            order by
              case status
                when 'blocked' then 0
                when 'waiting_approval' then 1
                when 'in_progress' then 2
                when 'planned' then 3
                else 4
              end,
              due_at nulls last,
              updated_at desc
            limit 50
            """,
            (client["organization_id"],),
        ).fetchall()

        approvals = conn.execute(
            """
            select
              a.id,
              a.deliverable_id,
              d.title as deliverable_title,
              a.status,
              a.comment,
              a.created_at,
              a.decided_at
            from approvals a
            left join deliverables d on d.id = a.deliverable_id
            where a.organization_id = %s
            order by
              case a.status when 'pending' then 0 else 1 end,
              a.created_at desc
            limit 50
            """,
            (client["organization_id"],),
        ).fetchall()

        sync_runs = conn.execute(
            """
            select id, source, status, summary, started_at, finished_at
            from sync_runs
            where organization_id = %s
            order by started_at desc
            limit 20
            """,
            (client["organization_id"],),
        ).fetchall()

        audit_logs = conn.execute(
            """
            select id, actor_user_id, event_type, metadata, created_at
            from audit_logs
            where organization_id = %s
            order by created_at desc
            limit 20
            """,
            (client["organization_id"],),
        ).fetchall()

    return ClientPortalResponse(
        client=ClientSummary(**client),
        artifacts=list(artifacts),
        deliverables=list(deliverables),
        approvals=list(approvals),
        sync_runs=list(sync_runs),
        audit_logs=list(audit_logs),
    )


def update_client(client_id: UUID, payload: ClientUpdateRequest, user: CurrentUserResponse) -> ClientPortalResponse:
    _require_platform_admin(user)
    updates = payload.model_dump(exclude_unset=True)

    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        client_updates = {key: updates[key] for key in ("name", "status", "responsible_name", "clickup_folder_id") if key in updates}
        if client_updates:
            set_clause = ", ".join([f"{column} = %s" for column in client_updates])
            params = list(client_updates.values()) + [client_id]
            conn.execute(
                f"update clients set {set_clause}, updated_at = now() where id = %s",
                params,
            )
        if "organization_name" in updates:
            conn.execute(
                "update organizations set name = %s, updated_at = now() where id = %s",
                (updates["organization_name"], client["organization_id"]),
            )
        _write_audit(
            conn,
            user,
            client["organization_id"],
            "client.updated",
            {"client_id": str(client_id), "fields": sorted(updates.keys())},
        )

    return get_client_portal(client_id, user)


def create_artifact(client_id: UUID, payload: ArtifactCreateRequest, user: CurrentUserResponse) -> ClientPortalResponse:
    _require_platform_admin(user)
    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        artifact_id = conn.execute(
            """
            insert into artifacts (organization_id, title, kind, visibility, content, url, created_by)
            values (%s, %s, %s, %s, %s, %s, %s)
            returning id
            """,
            (
                client["organization_id"],
                payload.title,
                payload.kind,
                payload.visibility,
                payload.content,
                payload.url,
                user.id,
            ),
        ).fetchone()["id"]
        _write_audit(
            conn,
            user,
            client["organization_id"],
            "artifact.created",
            {"client_id": str(client_id), "artifact_id": str(artifact_id), "title": payload.title},
        )

    return get_client_portal(client_id, user)


def update_artifact(
    client_id: UUID,
    artifact_id: UUID,
    payload: ArtifactUpdateRequest,
    user: CurrentUserResponse,
) -> ClientPortalResponse:
    _require_platform_admin(user)
    updates = payload.model_dump(exclude_unset=True)

    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        if updates:
            set_clause = ", ".join([f"{column} = %s" for column in updates])
            params = list(updates.values()) + [artifact_id, client["organization_id"]]
            updated = conn.execute(
                f"update artifacts set {set_clause} where id = %s and organization_id = %s returning id",
                params,
            ).fetchone()
            if not updated:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artefato não encontrado.")
        _write_audit(
            conn,
            user,
            client["organization_id"],
            "artifact.updated",
            {"client_id": str(client_id), "artifact_id": str(artifact_id), "fields": sorted(updates.keys())},
        )

    return get_client_portal(client_id, user)


def delete_artifact(client_id: UUID, artifact_id: UUID, user: CurrentUserResponse) -> ClientPortalResponse:
    _require_platform_admin(user)
    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        deleted = conn.execute(
            "delete from artifacts where id = %s and organization_id = %s returning id",
            (artifact_id, client["organization_id"]),
        ).fetchone()
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artefato não encontrado.")
        _write_audit(
            conn,
            user,
            client["organization_id"],
            "artifact.deleted",
            {"client_id": str(client_id), "artifact_id": str(artifact_id)},
        )

    return get_client_portal(client_id, user)


def create_deliverable(client_id: UUID, payload: DeliverableCreateRequest, user: CurrentUserResponse) -> ClientPortalResponse:
    _require_platform_admin(user)
    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        deliverable_id = conn.execute(
            """
            insert into deliverables (organization_id, title, status, due_at, clickup_task_id)
            values (%s, %s, %s, %s, %s)
            returning id
            """,
            (client["organization_id"], payload.title, payload.status, payload.due_at, payload.clickup_task_id),
        ).fetchone()["id"]
        _write_audit(
            conn,
            user,
            client["organization_id"],
            "deliverable.created",
            {"client_id": str(client_id), "deliverable_id": str(deliverable_id), "title": payload.title},
        )

    return get_client_portal(client_id, user)


def update_deliverable(
    client_id: UUID,
    deliverable_id: UUID,
    payload: DeliverableUpdateRequest,
    user: CurrentUserResponse,
) -> ClientPortalResponse:
    _require_platform_admin(user)
    updates = payload.model_dump(exclude_unset=True)

    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        if updates:
            set_clause = ", ".join([f"{column} = %s" for column in updates])
            params = list(updates.values()) + [deliverable_id, client["organization_id"]]
            updated = conn.execute(
                f"""
                update deliverables
                set {set_clause}, updated_at = now()
                where id = %s and organization_id = %s
                returning id
                """,
                params,
            ).fetchone()
            if not updated:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega não encontrada.")
        _write_audit(
            conn,
            user,
            client["organization_id"],
            "deliverable.updated",
            {"client_id": str(client_id), "deliverable_id": str(deliverable_id), "fields": sorted(updates.keys())},
        )

    return get_client_portal(client_id, user)


def delete_deliverable(client_id: UUID, deliverable_id: UUID, user: CurrentUserResponse) -> ClientPortalResponse:
    _require_platform_admin(user)
    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        conn.execute(
            "delete from approvals where deliverable_id = %s and organization_id = %s",
            (deliverable_id, client["organization_id"]),
        )
        deleted = conn.execute(
            "delete from deliverables where id = %s and organization_id = %s returning id",
            (deliverable_id, client["organization_id"]),
        ).fetchone()
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega não encontrada.")
        _write_audit(
            conn,
            user,
            client["organization_id"],
            "deliverable.deleted",
            {"client_id": str(client_id), "deliverable_id": str(deliverable_id)},
        )

    return get_client_portal(client_id, user)


def decide_approval(
    client_id: UUID,
    approval_id: UUID,
    payload: ApprovalDecisionRequest,
    user: CurrentUserResponse,
) -> ClientPortalResponse:
    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        approval = conn.execute(
            """
            select id, deliverable_id, status
            from approvals
            where id = %s and organization_id = %s
            """,
            (approval_id, client["organization_id"]),
        ).fetchone()
        if not approval:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aprovação não encontrada.")
        if approval["status"] != "pending":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Aprovação já decidida.")

        conn.execute(
            """
            update approvals
            set status = %s, comment = coalesce(%s, comment), decided_by = %s, decided_at = now()
            where id = %s
            """,
            (payload.status, payload.comment, user.id, approval_id),
        )
        if approval["deliverable_id"]:
            next_status = "done" if payload.status == "approved" else "blocked"
            conn.execute(
                """
                update deliverables
                set status = %s, updated_at = now()
                where id = %s and status = 'waiting_approval'
                """,
                (next_status, approval["deliverable_id"]),
            )
        _write_audit(
            conn,
            user,
            client["organization_id"],
            "approval.decided",
            {"approval_id": str(approval_id), "status": payload.status},
        )

    return get_client_portal(client_id, user)


def sync_clickup(client_id: UUID, user: CurrentUserResponse) -> ClientPortalResponse:
    _require_platform_admin(user)

    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        sync_status, summary = sync_clickup_folder(client["clickup_folder_id"])
        conn.execute(
            """
            insert into sync_runs (source, organization_id, status, summary, finished_at)
            values ('clickup', %s, %s, %s, now())
            """,
            (client["organization_id"], sync_status, Jsonb(summary)),
        )
        _write_audit(
            conn,
            user,
            client["organization_id"],
            "clickup.sync_requested",
            {"client_id": str(client_id), "status": sync_status},
        )

    return get_client_portal(client_id, user)


def _is_platform_admin(user: CurrentUserResponse) -> bool:
    return any(org.slug == "eg" and org.role == Role.eg_admin for org in user.organizations)


def _require_platform_admin(user: CurrentUserResponse) -> None:
    if not _is_platform_admin(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas EG admin pode executar esta ação.")


def _slugify(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return normalized or "cliente"


def _unique_org_slug(conn, base_slug: str) -> str:
    slug = _slugify(base_slug)
    candidate = slug
    suffix = 2
    while conn.execute("select 1 from organizations where slug = %s", (candidate,)).fetchone():
        candidate = f"{slug}-{suffix}"
        suffix += 1
    return candidate


def _write_audit(conn, user: CurrentUserResponse, organization_id: UUID, event_type: str, metadata: dict) -> None:
    conn.execute(
        """
        insert into audit_logs (actor_user_id, organization_id, event_type, metadata)
        values (%s, %s, %s, %s)
        """,
        (user.id, organization_id, event_type, Jsonb(metadata)),
    )


def _client_access_filter() -> str:
    return """
      and (%s or c.organization_id in (
        select organization_id from memberships where user_id = %s
      ))
    """


def _client_summary_sql(extra_where: str = "") -> str:
    return f"""
        select
          c.id,
          c.organization_id,
          o.name as organization_name,
          o.slug as organization_slug,
          c.name,
          c.status,
          c.responsible_name,
          c.clickup_folder_id,
          count(distinct d.id)::int as deliverables_total,
          count(distinct a.id) filter (where a.status = 'pending')::int as approvals_pending,
          count(distinct ar.id) filter (where ar.visibility = 'client')::int as artifacts_client
        from clients c
        join organizations o on o.id = c.organization_id
        left join deliverables d on d.organization_id = c.organization_id
        left join approvals a on a.organization_id = c.organization_id
        left join artifacts ar on ar.organization_id = c.organization_id
        where 1 = 1
          {extra_where}
        group by c.id, o.id
        order by c.created_at desc
    """


def _accessible_client(conn, client_id: UUID, user: CurrentUserResponse):
    is_admin = _is_platform_admin(user)
    client = conn.execute(
        """
        select c.id, c.organization_id, c.clickup_folder_id
        from clients c
        where c.id = %s
        """ + _client_access_filter(),
        (client_id, is_admin, user.id),
    ).fetchone()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")
    return client
