from typing import Any
from uuid import UUID
from datetime import date

from psycopg import sql
from psycopg.types.json import Jsonb


def next_job_type(conn) -> str | None:
    row = conn.execute(
        """
        select job_type
        from (
          select 'ai_content' as job_type, created_at as queued_at
          from ai_content_requests where status = 'queued'
          union all
          select 'performance' as job_type, started_at as queued_at
          from sync_runs where source = 'performance' and status = 'queued'
        ) jobs
        order by queued_at
        limit 1
        """
    ).fetchone()
    return row["job_type"] if row else None


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
        set status = 'running', error_code = null, error_message = null,
            heartbeat_at = now(), attempts = run.attempts + 1
        from candidate
        where run.id = candidate.id
        returning run.id, run.client_id, run.organization_id, run.provider,
                  run.date_from, run.date_to, run.started_at, run.attempts
        """
    ).fetchone()


def claim_next_ai_content(conn):
    return conn.execute(
        """
        with next_request as (
          select id
          from ai_content_requests
          where status = 'queued'
          order by created_at
          for update skip locked
          limit 1
        )
        update ai_content_requests request
        set status = 'running', started_at = now(), updated_at = now(),
            heartbeat_at = now(), attempts = request.attempts + 1
        from next_request
        where request.id = next_request.id
        returning request.id, request.workspace_id, request.organization_id,
          request.requested_by, request.brief, request.channels, request.quantity,
          request.tone, request.objective, request.methodology_refs, request.attempts
        """
    ).fetchone()


def heartbeat_sync(conn, sync_id: UUID) -> None:
    """Renova o lease de um sync em andamento.

    Chamado entre providers: uma janela de 30 dias em quatro providers passa
    do lease default, e sem isso o reaper reenfileiraria um job que está vivo.
    """
    conn.execute(
        "update sync_runs set heartbeat_at = now() where id = %s and status = 'running'",
        (sync_id,),
    )


def reclaim_stalled_jobs(conn, lease_seconds: int, max_attempts: int) -> dict[str, int]:
    """Devolve à fila (ou encerra como erro) jobs cujo lease expirou.

    Um job perde o lease quando o worker morre sem completá-lo. Enquanto tiver
    tentativa disponível ele volta para `queued`; ao estourar `max_attempts`
    vira `error` com código próprio, para não reprocessar em loop um job que
    derruba o worker toda vez.
    """
    requeued_syncs = conn.execute(
        """
        update sync_runs
        set status = 'queued', heartbeat_at = null,
            error_code = null, error_message = null
        where status = 'running'
          and heartbeat_at < now() - make_interval(secs => %s)
          and attempts < %s
        returning id
        """,
        (lease_seconds, max_attempts),
    ).fetchall()

    failed_syncs = conn.execute(
        """
        update sync_runs
        set status = 'error', heartbeat_at = null, finished_at = now(),
            error_code = 'JOB_STALLED',
            error_message = 'Job excedeu o lease sem concluir e esgotou as tentativas.'
        where status = 'running'
          and heartbeat_at < now() - make_interval(secs => %s)
          and attempts >= %s
        returning id
        """,
        (lease_seconds, max_attempts),
    ).fetchall()

    requeued_ai = conn.execute(
        """
        update ai_content_requests
        set status = 'queued', heartbeat_at = null, error_message = null,
            updated_at = now()
        where status = 'running'
          and heartbeat_at < now() - make_interval(secs => %s)
          and attempts < %s
        returning id
        """,
        (lease_seconds, max_attempts),
    ).fetchall()

    failed_ai = conn.execute(
        """
        update ai_content_requests
        set status = 'error', heartbeat_at = null, finished_at = now(),
            updated_at = now(),
            error_message = 'Job excedeu o lease sem concluir e esgotou as tentativas.'
        where status = 'running'
          and heartbeat_at < now() - make_interval(secs => %s)
          and attempts >= %s
        returning id
        """,
        (lease_seconds, max_attempts),
    ).fetchall()

    return {
        "requeued_syncs": len(requeued_syncs),
        "failed_syncs": len(failed_syncs),
        "requeued_ai_content": len(requeued_ai),
        "failed_ai_content": len(failed_ai),
    }


def complete_ai_content(conn, request: dict, result: dict) -> None:
    conn.execute(
        """
        update ai_content_requests
        set status = 'ready', provider = %s, model = %s, generation_mode = %s,
          output = %s, error_message = null, finished_at = now(), updated_at = now()
        where id = %s
        """,
        (
            result["provider"],
            result["model"],
            result["generation_mode"],
            Jsonb(result["output"]),
            request["id"],
        ),
    )
    if result.get("generation_mode") == "live":
        usage = result.get("usage") or {}
        input_details = usage.get("input_tokens_details") or {}
        conn.execute(
            """
            insert into ai_usage_events (
              organization_id, workspace_id, user_id, provider, model, source,
              external_event_id, input_units, output_units, cached_units, unit,
              cost_cents, currency, metadata
            )
            values (%s, %s, %s, %s, %s, 'ai_content', %s, %s, %s, %s,
              'tokens', null, 'USD', %s)
            on conflict (organization_id, provider, external_event_id)
              where external_event_id is not null
            do update set metadata = ai_usage_events.metadata || excluded.metadata
            """,
            (
                request["organization_id"],
                request["workspace_id"],
                request["requested_by"],
                result["provider"],
                result["model"],
                result.get("response_id"),
                usage.get("input_tokens"),
                usage.get("output_tokens"),
                input_details.get("cached_tokens"),
                Jsonb(
                    {
                        "content_request_id": str(request["id"]),
                        "usage": usage,
                        "cost_status": "unknown_until_pricing_is_configured",
                    }
                ),
            ),
        )
    conn.execute(
        """
        insert into ai_runs (
          organization_id, workspace_id, user_id, content_request_id,
          provider, model, prompt_version, input_schema, output_schema, status, metadata
        )
        values (%s, %s, %s, %s, %s, %s, 'ai-content-v1',
          'AiContentRequestCreate', 'AiContentOutput', 'ok', %s)
        """,
        (
            request["organization_id"],
            request["workspace_id"],
            request["requested_by"],
            request["id"],
            result["provider"],
            result["model"],
            Jsonb({"generation_mode": result["generation_mode"], "usage": result.get("usage", {})}),
        ),
    )


def fail_ai_content(conn, request: dict, message: str) -> None:
    conn.execute(
        """
        update ai_content_requests
        set status = 'error', error_message = %s, finished_at = now(), updated_at = now()
        where id = %s
        """,
        (message[:2000], request["id"]),
    )
    conn.execute(
        """
        insert into ai_runs (
          organization_id, workspace_id, user_id, content_request_id,
          provider, model, prompt_version, input_schema, output_schema, status, metadata
        )
        values (%s, %s, %s, %s, 'openai', 'unknown', 'ai-content-v1',
          'AiContentRequestCreate', 'AiContentOutput', 'error', %s)
        """,
        (
            request["organization_id"], request["workspace_id"], request["requested_by"], request["id"],
            Jsonb({"error": message[:500]}),
        ),
    )


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
