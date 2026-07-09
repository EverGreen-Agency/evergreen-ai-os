from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from psycopg.types.json import Jsonb

from bioma_api.auth import current_user_from_request
from bioma_api.db import connect
from bioma_api.domain.models import Role
from bioma_api.integrations.clickup import sync_clickup_folder
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.client_hub import (
    ApprovalDecisionRequest,
    ClientPortalResponse,
    ClientSummary,
    DeliverableStatusRequest,
)


router = APIRouter(prefix="/clients", tags=["client-hub"])


def _is_platform_admin(user: CurrentUserResponse) -> bool:
    return any(org.slug == "eg" and org.role == Role.eg_admin for org in user.organizations)


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
        select c.id, c.organization_id
             , c.clickup_folder_id
        from clients c
        where c.id = %s
        """ + _client_access_filter(),
        (client_id, is_admin, user.id),
    ).fetchone()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")
    return client


@router.get("", response_model=list[ClientSummary])
def list_clients(user: CurrentUserResponse = Depends(current_user_from_request)) -> list[ClientSummary]:
    is_admin = _is_platform_admin(user)
    with connect() as conn:
        rows = conn.execute(
            _client_summary_sql(_client_access_filter()),
            (is_admin, user.id),
        ).fetchall()
    return [ClientSummary(**row) for row in rows]


@router.get("/{client_id}", response_model=ClientPortalResponse)
def get_client_portal(
    client_id: UUID,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> ClientPortalResponse:
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
            limit 20
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
            limit 20
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
            limit 20
            """,
            (client["organization_id"],),
        ).fetchall()

        sync_runs = conn.execute(
            """
            select id, source, status, summary, started_at, finished_at
            from sync_runs
            where organization_id = %s
            order by started_at desc
            limit 10
            """,
            (client["organization_id"],),
        ).fetchall()

    return ClientPortalResponse(
        client=ClientSummary(**client),
        artifacts=list(artifacts),
        deliverables=list(deliverables),
        approvals=list(approvals),
        sync_runs=list(sync_runs),
    )


@router.patch("/{client_id}/approvals/{approval_id}", response_model=ClientPortalResponse)
def decide_approval(
    client_id: UUID,
    approval_id: UUID,
    payload: ApprovalDecisionRequest,
    user: CurrentUserResponse = Depends(current_user_from_request),
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
        conn.execute(
            """
            insert into audit_logs (actor_user_id, organization_id, event_type, metadata)
            values (%s, %s, 'approval.decided', jsonb_build_object('approval_id', %s::text, 'status', %s::text))
            """,
            (user.id, client["organization_id"], approval_id, payload.status),
        )

    return get_client_portal(client_id, user)


@router.post("/{client_id}/sync/clickup", response_model=ClientPortalResponse)
def sync_clickup(
    client_id: UUID,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> ClientPortalResponse:
    if not _is_platform_admin(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas EG admin pode sincronizar ClickUp.")

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
        conn.execute(
            """
            insert into audit_logs (actor_user_id, organization_id, event_type, metadata)
            values (%s, %s, 'clickup.sync_requested', jsonb_build_object('status', %s::text))
            """,
            (user.id, client["organization_id"], sync_status),
        )

    return get_client_portal(client_id, user)


@router.patch("/{client_id}/deliverables/{deliverable_id}", response_model=ClientPortalResponse)
def update_deliverable_status(
    client_id: UUID,
    deliverable_id: UUID,
    payload: DeliverableStatusRequest,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> ClientPortalResponse:
    if not _is_platform_admin(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas EG admin pode atualizar entregas.")

    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        result = conn.execute(
            """
            update deliverables
            set status = %s, updated_at = now()
            where id = %s and organization_id = %s
            returning id
            """,
            (payload.status, deliverable_id, client["organization_id"]),
        ).fetchone()
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega não encontrada.")
        conn.execute(
            """
            insert into audit_logs (actor_user_id, organization_id, event_type, metadata)
            values (%s, %s, 'deliverable.status_updated', jsonb_build_object('deliverable_id', %s::text, 'status', %s::text))
            """,
            (user.id, client["organization_id"], deliverable_id, payload.status),
        )

    return get_client_portal(client_id, user)
