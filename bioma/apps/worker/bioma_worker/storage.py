from typing import Any
from uuid import UUID
from datetime import date

from psycopg import sql
from psycopg.types.json import Jsonb


def claim_next_sync(conn):
    return conn.execute(
        """
        with candidate as (
          select id
          from sync_runs
          where source = 'performance' and status = 'queued'
          order by started_at asc
          for update skip locked
          limit 1
        )
        update sync_runs run
        set status = 'running', error_code = null, error_message = null
        from candidate
        where run.id = candidate.id
        returning run.id, run.client_id, run.organization_id, run.provider,
                  run.date_from, run.date_to, run.started_at
        """
    ).fetchone()


def enqueue_scheduled_syncs(conn, date_from: date, date_to: date) -> int:
    rows = conn.execute(
        """
        insert into sync_runs (
          source, organization_id, client_id, provider, status, summary, date_from, date_to
        )
        select
          'performance', c.organization_id, c.id, 'all', 'queued',
          jsonb_build_object('mode', 'scheduled', 'external_sync', 'queued'),
          %s, %s
        from clients c
        where exists (
          select 1 from performance_connections pc
          where pc.client_id = c.id and pc.status in ('active', 'error')
        )
          and not exists (
            select 1 from sync_runs sr
            where sr.client_id = c.id and sr.source = 'performance'
              and sr.status in ('queued', 'running')
          )
        returning id
        """,
        (date_from, date_to),
    ).fetchall()
    return len(rows)


def list_connections(conn, client_id: UUID, provider: str):
    if provider == "all":
        return conn.execute(
            """
            select id, provider, external_account_id, external_parent_id,
                   credentials_ref, metadata
            from performance_connections
            where client_id = %s and status in ('active', 'error')
            order by provider asc
            """,
            (client_id,),
        ).fetchall()
    return conn.execute(
        """
        select id, provider, external_account_id, external_parent_id,
               credentials_ref, metadata
        from performance_connections
        where client_id = %s and provider = %s and status in ('active', 'error')
        order by created_at asc
        """,
        (client_id, provider),
    ).fetchall()


def complete_sync(
    conn,
    sync_id: UUID,
    status: str,
    summary: dict[str, Any],
    records_processed: int,
    *,
    error_code: str | None = None,
    error_message: str | None = None,
) -> None:
    conn.execute(
        """
        update sync_runs
        set status = %s,
            summary = %s,
            records_processed = %s,
            error_code = %s,
            error_message = %s,
            finished_at = now()
        where id = %s
        """,
        (status, Jsonb(summary), records_processed, error_code, error_message, sync_id),
    )


def mark_connection_success(conn, connection_id: UUID) -> None:
    conn.execute(
        """
        update performance_connections
        set status = 'active', last_synced_at = now(), last_error_at = null,
            last_error_message = null, updated_at = now()
        where id = %s
        """,
        (connection_id,),
    )


def mark_connection_error(conn, connection_id: UUID, message: str) -> None:
    conn.execute(
        """
        update performance_connections
        set status = 'error', last_error_at = now(), last_error_message = %s,
            updated_at = now()
        where id = %s
        """,
        (message[:2000], connection_id),
    )


def upsert_rows(
    conn,
    table: str,
    columns: tuple[str, ...],
    conflict_columns: tuple[str, ...],
    rows: list[dict[str, Any]],
) -> int:
    if not rows:
        return 0

    update_columns = tuple(column for column in columns if column not in conflict_columns)
    assignments = [
        sql.SQL("{} = excluded.{}").format(sql.Identifier(column), sql.Identifier(column))
        for column in update_columns
    ]
    assignments.append(sql.SQL("updated_at = now()"))
    query = sql.SQL(
        "insert into {} ({}) values ({}) on conflict ({}) do update set {}"
    ).format(
        sql.Identifier(table),
        sql.SQL(", ").join(map(sql.Identifier, columns)),
        sql.SQL(", ").join(sql.Placeholder() for _ in columns),
        sql.SQL(", ").join(map(sql.Identifier, conflict_columns)),
        sql.SQL(", ").join(assignments),
    )
    conn.executemany(query, [tuple(row.get(column) for column in columns) for row in rows])
    return len(rows)


def save_gtm_snapshot(
    conn,
    client_id: UUID,
    account_id: str,
    container_id: str,
    live_version: dict[str, Any],
    findings: list[dict[str, Any]],
) -> int:
    tags = live_version.get("tag", [])
    triggers = live_version.get("trigger", [])
    variables = live_version.get("variable", [])
    snapshot_id = conn.execute(
        """
        insert into gtm_audit_snapshots (
          client_id, account_id, container_id, published_version,
          tags, triggers, variables, metadata
        )
        values (%s, %s, %s, %s, %s, %s, %s, %s)
        returning id
        """,
        (
            client_id,
            account_id,
            container_id,
            live_version.get("containerVersionId") or live_version.get("name") or "live",
            Jsonb(tags),
            Jsonb(triggers),
            Jsonb(variables),
            Jsonb(
                {
                    "container_path": live_version.get("path"),
                    "fingerprint": live_version.get("fingerprint"),
                }
            ),
        ),
    ).fetchone()["id"]

    conn.execute(
        """
        update tracking_findings
        set status = 'resolved', resolved_at = now()
        where client_id = %s and status = 'open'
        """,
        (client_id,),
    )
    for finding in findings:
        conn.execute(
            """
            insert into tracking_findings (
              client_id, snapshot_id, code, title, description, severity, status, metadata
            )
            values (%s, %s, %s, %s, %s, %s, 'open', %s)
            """,
            (
                client_id,
                snapshot_id,
                finding["code"],
                finding["title"],
                finding["description"],
                finding["severity"],
                Jsonb(finding.get("metadata", {})),
            ),
        )
    return len(tags) + len(triggers) + len(variables) + len(findings)
