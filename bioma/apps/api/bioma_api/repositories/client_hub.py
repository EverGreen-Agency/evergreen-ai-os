import re
from typing import Any
from uuid import UUID

from psycopg.types.json import Jsonb


def list_clients(conn, is_admin: bool, user_id: UUID):
    return conn.execute(
        _client_summary_sql(_client_access_filter()),
        (is_admin, user_id),
    ).fetchall()


def create_organization(conn, name: str, slug: str) -> UUID:
    return conn.execute(
        """
        insert into organizations (name, slug, type)
        values (%s, %s, 'client')
        returning id
        """,
        (name, slug),
    ).fetchone()["id"]


def create_client(
    conn,
    organization_id: UUID,
    name: str,
    status: str,
    responsible_name: str | None,
    clickup_folder_id: str | None,
) -> UUID:
    return conn.execute(
        """
        insert into clients (organization_id, name, status, responsible_name, clickup_folder_id)
        values (%s, %s, %s, %s, %s)
        returning id
        """,
        (organization_id, name, status, responsible_name, clickup_folder_id),
    ).fetchone()["id"]


def get_client_summary(conn, client_id: UUID, is_admin: bool, user_id: UUID):
    return conn.execute(
        _client_summary_sql(f"and c.id = %s {_client_access_filter()}"),
        (client_id, is_admin, user_id),
    ).fetchone()


def find_accessible_client(conn, client_id: UUID, is_admin: bool, user_id: UUID):
    return conn.execute(
        """
        select c.id, c.organization_id, c.clickup_folder_id, o.enabled_modules
        from clients c
        join organizations o on o.id = c.organization_id
        where c.id = %s
        """ + _client_access_filter(),
        (client_id, is_admin, user_id),
    ).fetchone()


def list_artifacts(conn, organization_id: UUID, is_admin: bool):
    return conn.execute(
        """
        select id, title, kind, visibility, url, content, created_at
        from artifacts
        where organization_id = %s
          and (%s or visibility = 'client')
        order by created_at desc
        limit 50
        """,
        (organization_id, is_admin),
    ).fetchall()


def list_deliverables(conn, organization_id: UUID):
    return conn.execute(
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
        (organization_id,),
    ).fetchall()


def list_approvals(conn, organization_id: UUID):
    return conn.execute(
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
        (organization_id,),
    ).fetchall()


def list_sync_runs(conn, organization_id: UUID):
    return conn.execute(
        """
        select id, source, status, summary, started_at, finished_at
        from sync_runs
        where organization_id = %s
        order by started_at desc
        limit 20
        """,
        (organization_id,),
    ).fetchall()


def list_clickup_list_ids(conn, organization_id: UUID) -> list[str]:
    rows = conn.execute(
        """
        select distinct clickup_list_id
        from clickup_mappings
        where organization_id = %s
          and clickup_list_id is not null
        order by clickup_list_id
        """,
        (organization_id,),
    ).fetchall()
    return [row["clickup_list_id"] for row in rows]


def list_audit_logs(conn, organization_id: UUID):
    return conn.execute(
        """
        select id, actor_user_id, event_type, metadata, created_at
        from audit_logs
        where organization_id = %s
        order by created_at desc
        limit 20
        """,
        (organization_id,),
    ).fetchall()


def update_client(conn, client_id: UUID, updates: dict[str, Any]) -> None:
    if not updates:
        return

    set_clause = ", ".join([f"{column} = %s" for column in updates])
    params = list(updates.values()) + [client_id]
    conn.execute(
        f"update clients set {set_clause}, updated_at = now() where id = %s",
        params,
    )


def update_organization_name(conn, organization_id: UUID, name: str) -> None:
    conn.execute(
        "update organizations set name = %s, updated_at = now() where id = %s",
        (name, organization_id),
    )


def update_organization_modules(conn, organization_id: UUID, modules: list[str]) -> None:
    conn.execute(
        "update organizations set enabled_modules = %s, updated_at = now() where id = %s",
        (Jsonb(modules), organization_id),
    )


def create_artifact(
    conn,
    organization_id: UUID,
    title: str,
    kind: str,
    visibility: str,
    content: str | None,
    url: str | None,
    created_by: UUID,
) -> UUID:
    return conn.execute(
        """
        insert into artifacts (organization_id, title, kind, visibility, content, url, created_by)
        values (%s, %s, %s, %s, %s, %s, %s)
        returning id
        """,
        (organization_id, title, kind, visibility, content, url, created_by),
    ).fetchone()["id"]


def update_artifact(conn, organization_id: UUID, artifact_id: UUID, updates: dict[str, Any]) -> bool:
    if not updates:
        return True

    set_clause = ", ".join([f"{column} = %s" for column in updates])
    params = list(updates.values()) + [artifact_id, organization_id]
    updated = conn.execute(
        f"update artifacts set {set_clause} where id = %s and organization_id = %s returning id",
        params,
    ).fetchone()
    return updated is not None


def delete_artifact(conn, organization_id: UUID, artifact_id: UUID) -> bool:
    deleted = conn.execute(
        "delete from artifacts where id = %s and organization_id = %s returning id",
        (artifact_id, organization_id),
    ).fetchone()
    return deleted is not None


def create_deliverable(
    conn,
    organization_id: UUID,
    title: str,
    status: str,
    due_at,
    clickup_task_id: str | None,
) -> UUID:
    return conn.execute(
        """
        insert into deliverables (organization_id, title, status, due_at, clickup_task_id)
        values (%s, %s, %s, %s, %s)
        returning id
        """,
        (organization_id, title, status, due_at, clickup_task_id),
    ).fetchone()["id"]


def upsert_clickup_deliverable(
    conn,
    organization_id: UUID,
    clickup_task_id: str,
    title: str,
    status: str,
    due_at: str | None,
) -> str:
    existing = conn.execute(
        """
        select id
        from deliverables
        where organization_id = %s and clickup_task_id = %s
        """,
        (organization_id, clickup_task_id),
    ).fetchone()
    if existing:
        conn.execute(
            """
            update deliverables
            set title = %s, status = %s, due_at = %s, updated_at = now()
            where id = %s
            """,
            (title, status, due_at, existing["id"]),
        )
        return "updated"

    conn.execute(
        """
        insert into deliverables (organization_id, title, status, due_at, clickup_task_id)
        values (%s, %s, %s, %s, %s)
        """,
        (organization_id, title, status, due_at, clickup_task_id),
    )
    return "created"


def update_deliverable(conn, organization_id: UUID, deliverable_id: UUID, updates: dict[str, Any]) -> bool:
    if not updates:
        return True

    set_clause = ", ".join([f"{column} = %s" for column in updates])
    params = list(updates.values()) + [deliverable_id, organization_id]
    updated = conn.execute(
        f"""
        update deliverables
        set {set_clause}, updated_at = now()
        where id = %s and organization_id = %s
        returning id
        """,
        params,
    ).fetchone()
    return updated is not None


def delete_deliverable(conn, organization_id: UUID, deliverable_id: UUID) -> bool:
    conn.execute(
        "delete from approvals where deliverable_id = %s and organization_id = %s",
        (deliverable_id, organization_id),
    )
    deleted = conn.execute(
        "delete from deliverables where id = %s and organization_id = %s returning id",
        (deliverable_id, organization_id),
    ).fetchone()
    return deleted is not None


def get_deliverable(conn, organization_id: UUID, deliverable_id: UUID):
    return conn.execute(
        "select id, status from deliverables where id = %s and organization_id = %s",
        (deliverable_id, organization_id),
    ).fetchone()


def get_pending_approval(conn, organization_id: UUID, deliverable_id: UUID):
    return conn.execute(
        """
        select id
        from approvals
        where organization_id = %s and deliverable_id = %s and status = 'pending'
        """,
        (organization_id, deliverable_id),
    ).fetchone()


def create_approval(
    conn,
    organization_id: UUID,
    deliverable_id: UUID,
    requested_by: UUID,
    comment: str | None,
) -> UUID:
    return conn.execute(
        """
        insert into approvals (organization_id, deliverable_id, requested_by, status, comment)
        values (%s, %s, %s, 'pending', %s)
        returning id
        """,
        (organization_id, deliverable_id, requested_by, comment),
    ).fetchone()["id"]


def get_approval(conn, organization_id: UUID, approval_id: UUID):
    return conn.execute(
        """
        select id, deliverable_id, status
        from approvals
        where id = %s and organization_id = %s
        """,
        (approval_id, organization_id),
    ).fetchone()


def decide_approval(conn, approval_id: UUID, status: str, comment: str | None, decided_by: UUID) -> None:
    conn.execute(
        """
        update approvals
        set status = %s, comment = coalesce(%s, comment), decided_by = %s, decided_at = now()
        where id = %s
        """,
        (status, comment, decided_by, approval_id),
    )


def update_waiting_deliverable_status(conn, deliverable_id: UUID, status: str) -> None:
    conn.execute(
        """
        update deliverables
        set status = %s, updated_at = now()
        where id = %s and status = 'waiting_approval'
        """,
        (status, deliverable_id),
    )


def record_sync_run(conn, organization_id: UUID, status: str, summary: dict[str, Any]) -> None:
    conn.execute(
        """
        insert into sync_runs (source, organization_id, status, summary, finished_at)
        values ('clickup', %s, %s, %s, now())
        """,
        (organization_id, status, Jsonb(summary)),
    )


def write_audit(conn, actor_user_id: UUID, organization_id: UUID, event_type: str, metadata: dict[str, Any]) -> None:
    conn.execute(
        """
        insert into audit_logs (actor_user_id, organization_id, event_type, metadata)
        values (%s, %s, %s, %s)
        """,
        (actor_user_id, organization_id, event_type, Jsonb(metadata)),
    )


def list_leads(conn, organization_id: UUID):
    return conn.execute(
        """
        select id, name, company, role_title, email, phone, linkedin_url, source, stage,
               expected_value, notes, created_at, updated_at
        from leads
        where organization_id = %s
        order by
          case stage
            when 'new' then 0
            when 'qualifying' then 1
            when 'meeting' then 2
            when 'proposal' then 3
            when 'won' then 4
            else 5
          end,
          updated_at desc
        """,
        (organization_id,),
    ).fetchall()


def create_lead(conn, organization_id: UUID, payload: dict[str, Any]) -> UUID:
    return conn.execute(
        """
        insert into leads (
          organization_id, name, company, role_title, email, phone, linkedin_url,
          source, stage, expected_value, notes
        )
        values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        returning id
        """,
        (
            organization_id,
            payload["name"],
            payload.get("company"),
            payload.get("role_title"),
            payload.get("email"),
            payload.get("phone"),
            payload.get("linkedin_url"),
            payload.get("source"),
            payload.get("stage", "new"),
            payload.get("expected_value"),
            payload.get("notes"),
        ),
    ).fetchone()["id"]


def update_lead(conn, organization_id: UUID, lead_id: UUID, updates: dict[str, Any]) -> bool:
    return _update_scoped_row(conn, "leads", organization_id, lead_id, updates)


def delete_lead(conn, organization_id: UUID, lead_id: UUID) -> bool:
    return _delete_scoped_row(conn, "leads", organization_id, lead_id)


def list_financial_records(conn, organization_id: UUID):
    return conn.execute(
        """
        select id, kind, title, amount, currency, status, contract_start_at, contract_end_at,
               due_at, paid_at, notes, created_at, updated_at
        from financial_records
        where organization_id = %s
        order by due_at nulls last, updated_at desc
        """,
        (organization_id,),
    ).fetchall()


def create_financial_record(conn, organization_id: UUID, payload: dict[str, Any]) -> UUID:
    return conn.execute(
        """
        insert into financial_records (
          organization_id, kind, title, amount, currency, status, contract_start_at,
          contract_end_at, due_at, paid_at, notes
        )
        values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        returning id
        """,
        (
            organization_id,
            payload["kind"],
            payload["title"],
            payload.get("amount"),
            payload.get("currency", "BRL"),
            payload.get("status", "open"),
            payload.get("contract_start_at"),
            payload.get("contract_end_at"),
            payload.get("due_at"),
            payload.get("paid_at"),
            payload.get("notes"),
        ),
    ).fetchone()["id"]


def update_financial_record(conn, organization_id: UUID, record_id: UUID, updates: dict[str, Any]) -> bool:
    return _update_scoped_row(conn, "financial_records", organization_id, record_id, updates)


def delete_financial_record(conn, organization_id: UUID, record_id: UUID) -> bool:
    return _delete_scoped_row(conn, "financial_records", organization_id, record_id)


def list_performance_metrics(conn, organization_id: UUID):
    return conn.execute(
        """
        select id, period_start, period_end, channel, metric, value, source, notes, captured_at
        from performance_metrics
        where organization_id = %s
        order by period_start desc, channel asc, metric asc
        """,
        (organization_id,),
    ).fetchall()


def create_performance_metric(conn, organization_id: UUID, payload: dict[str, Any]) -> UUID:
    return conn.execute(
        """
        insert into performance_metrics (
          organization_id, period_start, period_end, channel, metric, value, source, notes
        )
        values (%s, %s, %s, %s, %s, %s, %s, %s)
        returning id
        """,
        (
            organization_id,
            payload["period_start"],
            payload["period_end"],
            payload["channel"],
            payload["metric"],
            payload["value"],
            payload.get("source", "manual"),
            payload.get("notes"),
        ),
    ).fetchone()["id"]


def update_performance_metric(conn, organization_id: UUID, metric_id: UUID, updates: dict[str, Any]) -> bool:
    return _update_scoped_row(conn, "performance_metrics", organization_id, metric_id, updates, touch_updated_at=False)


def delete_performance_metric(conn, organization_id: UUID, metric_id: UUID) -> bool:
    return _delete_scoped_row(conn, "performance_metrics", organization_id, metric_id)


def unique_org_slug(conn, base_slug: str) -> str:
    slug = _slugify(base_slug)
    candidate = slug
    suffix = 2
    while conn.execute("select 1 from organizations where slug = %s", (candidate,)).fetchone():
        candidate = f"{slug}-{suffix}"
        suffix += 1
    return candidate


def _update_scoped_row(
    conn,
    table: str,
    organization_id: UUID,
    row_id: UUID,
    updates: dict[str, Any],
    touch_updated_at: bool = True,
) -> bool:
    if not updates:
        return True

    update_values = dict(updates)
    if touch_updated_at:
        update_values["updated_at"] = "now()"
        set_clause = ", ".join(
            [f"{column} = now()" if column == "updated_at" else f"{column} = %s" for column in update_values]
        )
        params = [value for column, value in update_values.items() if column != "updated_at"]
    else:
        set_clause = ", ".join([f"{column} = %s" for column in update_values])
        params = list(update_values.values())

    params.extend([row_id, organization_id])
    updated = conn.execute(
        f"update {table} set {set_clause} where id = %s and organization_id = %s returning id",
        params,
    ).fetchone()
    return updated is not None


def _delete_scoped_row(conn, table: str, organization_id: UUID, row_id: UUID) -> bool:
    deleted = conn.execute(
        f"delete from {table} where id = %s and organization_id = %s returning id",
        (row_id, organization_id),
    ).fetchone()
    return deleted is not None


def _slugify(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return normalized or "cliente"


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
          o.enabled_modules,
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
