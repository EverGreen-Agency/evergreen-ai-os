from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from bioma_api.auth import current_user_from_request
from bioma_api.db import connect
from bioma_api.domain.models import Role
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.client_hub import ClientPortalResponse, ClientSummary


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
