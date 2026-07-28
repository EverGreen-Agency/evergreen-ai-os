from __future__ import annotations

from typing import Any
from uuid import UUID

from psycopg.types.json import Jsonb


def create_session(conn, actor_user_id: UUID, data: dict[str, Any]):
    return conn.execute(
        """
        insert into sales_copilot_sessions (
          workspace_id, proposal_id, title, session_type, language, objective,
          participant_context, created_by
        ) values (%s, %s, %s, %s, %s, %s, %s, %s)
        returning *
        """,
        (
            data.get("workspace_id"),
            data.get("proposal_id"),
            data["title"],
            data["session_type"],
            data["language"],
            data.get("objective"),
            data.get("participant_context"),
            actor_user_id,
        ),
    ).fetchone()


def get_session(conn, session_id: UUID, *, for_update: bool = False):
    suffix = " for update" if for_update else ""
    return conn.execute(
        f"select * from sales_copilot_sessions where id = %s{suffix}",
        (session_id,),
    ).fetchone()


def list_sessions(conn, limit: int = 50):
    return conn.execute(
        """
        select *
        from sales_copilot_sessions
        order by created_at desc
        limit %s
        """,
        (limit,),
    ).fetchall()


def list_events(conn, session_id: UUID):
    return conn.execute(
        """
        select *
        from sales_copilot_events
        where session_id = %s
        order by sequence, created_at
        """,
        (session_id,),
    ).fetchall()


def prepare_session(
    conn,
    session_id: UUID,
    knowledge_snapshot: dict[str, Any],
    preparation_brief: dict[str, Any],
):
    return conn.execute(
        """
        update sales_copilot_sessions
        set knowledge_snapshot = %s,
            preparation_brief = %s,
            status = 'prepared',
            updated_at = now()
        where id = %s
        returning *
        """,
        (Jsonb(knowledge_snapshot), Jsonb(preparation_brief), session_id),
    ).fetchone()


def add_event(conn, session_id: UUID, actor_user_id: UUID, data: dict[str, Any]):
    sequence = conn.execute(
        """
        select coalesce(max(sequence), 0) + 1 as next_sequence
        from sales_copilot_events
        where session_id = %s
        """,
        (session_id,),
    ).fetchone()["next_sequence"]
    event = conn.execute(
        """
        insert into sales_copilot_events (
          session_id, event_type, content, recommendation, source_refs, sequence, created_by
        ) values (%s, %s, %s, %s, %s, %s, %s)
        returning *
        """,
        (
            session_id,
            data["event_type"],
            data["content"],
            data.get("recommendation"),
            Jsonb(data.get("source_refs", [])),
            sequence,
            actor_user_id,
        ),
    ).fetchone()
    if data["event_type"] == "transcript_chunk":
        conn.execute(
            """
            update sales_copilot_sessions
            set transcript = concat_ws(E'\n', nullif(transcript, ''), %s),
                status = case when status in ('draft', 'prepared') then 'active' else status end,
                started_at = coalesce(started_at, now()),
                updated_at = now()
            where id = %s
            """,
            (data["content"], session_id),
        )
    return event


def complete_session(
    conn,
    session_id: UUID,
    duration_seconds: int,
    summary: str,
):
    return conn.execute(
        """
        update sales_copilot_sessions
        set status = 'completed',
            duration_seconds = %s,
            summary = %s,
            completed_at = now(),
            updated_at = now()
        where id = %s
        returning *
        """,
        (duration_seconds, summary, session_id),
    ).fetchone()


def get_knowledge_context(conn, workspace_id: UUID | None, proposal_id: UUID | None):
    context: dict[str, Any] = {}
    if workspace_id:
        workspace = conn.execute(
            """
            select w.id, org.name as organization_name, profile.sector, profile.primary_offer,
              profile.target_audience, profile.business_details, profile.marketing_objectives,
              profile.challenges_opportunities, profile.tone_of_voice, profile.preferences_restrictions
            from workspaces w
            join organizations org on org.id = w.subject_organization_id
            left join workspace_client_profiles profile on profile.workspace_id = w.id
            where w.id = %s and w.status = 'active'
            """,
            (workspace_id,),
        ).fetchone()
        if workspace:
            context["client"] = dict(workspace)
    if proposal_id:
        proposal = conn.execute(
            """
            select id, workspace_id, title, client_name, status, executive_summary,
              problem_summary, selected_services, estimated_budget, payment_terms,
              content_markdown, claims_review_status
            from commercial_proposals
            where id = %s and archived_at is null
            """,
            (proposal_id,),
        ).fetchone()
        if proposal:
            context["proposal"] = dict(proposal)
    return context


def metrics(conn):
    rows = conn.execute(
        """
        select status, count(*)::int as count
        from sales_copilot_sessions
        group by status
        """
    ).fetchall()
    aggregate = conn.execute(
        """
        select count(*)::int as total_sessions,
          coalesce(sum(duration_seconds), 0)::int as total_duration_seconds,
          count(*) filter (where status = 'completed')::int as analyses_completed
        from sales_copilot_sessions
        """
    ).fetchone()
    return {
        **dict(aggregate),
        "sessions_by_status": {row["status"]: row["count"] for row in rows},
    }
