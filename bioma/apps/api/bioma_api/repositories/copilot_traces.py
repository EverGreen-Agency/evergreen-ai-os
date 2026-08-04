"""Persistência da conversa com o copiloto e da trilha de cada execução.

A trilha existe para responder, depois do fato: o que ele leu, o que decidiu, o
que executou de verdade, quanto custou e quanto demorou. Sem isso, "o copiloto
disse que criou as subtarefas" e "o copiloto criou as subtarefas" são a mesma
frase na tela.
"""

from typing import Any
from uuid import UUID

from psycopg.rows import dict_row
from psycopg.types.json import Jsonb


def create_thread(
    conn,
    user_id: UUID,
    surface: str,
    workspace_id: UUID | None,
    task_id: UUID | None,
    title: str | None,
) -> dict[str, Any]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            insert into copilot_threads (user_id, surface, workspace_id, task_id, title)
            values (%s, %s, %s, %s, %s)
            returning *
            """,
            (user_id, surface, workspace_id, task_id, (title or "")[:200] or None),
        )
        return dict(cur.fetchone())


def get_thread(conn, thread_id: UUID) -> dict[str, Any] | None:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("select * from copilot_threads where id = %s", (thread_id,))
        row = cur.fetchone()
        return dict(row) if row else None


def list_threads(conn, user_id: UUID, status_val: str = "active", limit: int = 50) -> list[dict[str, Any]]:
    """Threads do próprio usuário, com o resumo que a lista lateral precisa.

    Escopo por `user_id` de propósito: a conversa é do interlocutor. Ver a
    conversa de outra pessoa é auditoria, e passa pela tela de auditoria.
    """
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            select t.*,
                   coalesce(r.run_count, 0) as run_count,
                   r.last_message
            from copilot_threads t
            left join lateral (
              select count(*) as run_count,
                     (array_agg(message order by created_at desc))[1] as last_message
              from copilot_runs where thread_id = t.id
            ) r on true
            where t.user_id = %s and t.status = %s
            order by t.last_message_at desc
            limit %s
            """,
            (user_id, status_val, limit),
        )
        return list(cur.fetchall())


def archive_thread(conn, thread_id: UUID) -> dict[str, Any] | None:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            "update copilot_threads set status = 'archived' where id = %s returning *", (thread_id,)
        )
        row = cur.fetchone()
        return dict(row) if row else None


def touch_thread(conn, thread_id: UUID, title_if_empty: str | None = None) -> None:
    """Sobe a thread na lista e batiza no primeiro turno.

    O título vem da primeira mensagem porque é o que a pessoa reconhece — pedir
    para nomear a conversa antes de tê-la é atrito puro.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            update copilot_threads
            set last_message_at = now(),
                title = coalesce(title, %s)
            where id = %s
            """,
            ((title_if_empty or "")[:200] or None, thread_id),
        )


def start_run(conn, data: dict[str, Any]) -> dict[str, Any]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            insert into copilot_runs (thread_id, user_id, surface, workspace_id, task_id, message)
            values (%s, %s, %s, %s, %s, %s)
            returning *
            """,
            (
                data["thread_id"],
                data["user_id"],
                data["surface"],
                data.get("workspace_id"),
                data.get("task_id"),
                data["message"],
            ),
        )
        return dict(cur.fetchone())


def finish_run(conn, run_id: UUID, data: dict[str, Any]) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            update copilot_runs set
              answer = %s, confidence = %s, generation_mode = %s, provider = %s, model = %s,
              status = %s, error_message = %s,
              dossier_summary = %s, memories_used = %s, skills_used = %s, sources = %s, actions = %s,
              attachments = %s,
              input_tokens = %s, output_tokens = %s, cost_cents = %s, duration_ms = %s
            where id = %s
            """,
            (
                data.get("answer"),
                data.get("confidence"),
                data.get("generation_mode"),
                data.get("provider"),
                data.get("model"),
                data.get("status", "completed"),
                data.get("error_message"),
                Jsonb(data.get("dossier_summary") or {}),
                Jsonb(data.get("memories_used") or []),
                Jsonb(data.get("skills_used") or []),
                Jsonb(data.get("sources") or []),
                Jsonb(data.get("actions") or []),
                Jsonb(data.get("attachments") or []),
                data.get("input_tokens"),
                data.get("output_tokens"),
                data.get("cost_cents"),
                data.get("duration_ms"),
                run_id,
            ),
        )


def add_step(conn, run_id: UUID, position: int, step: dict[str, Any]) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            insert into copilot_run_steps (run_id, position, kind, label, status, detail, payload, duration_ms)
            values (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                run_id,
                position,
                step["kind"],
                step["label"][:300],
                step["status"],
                (step.get("detail") or "")[:2000] or None,
                Jsonb(step.get("payload") or {}),
                step.get("duration_ms"),
            ),
        )


def list_runs(conn, thread_id: UUID) -> list[dict[str, Any]]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("select * from copilot_runs where thread_id = %s order by created_at", (thread_id,))
        return list(cur.fetchall())


def get_run(conn, run_id: UUID) -> dict[str, Any] | None:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("select * from copilot_runs where id = %s", (run_id,))
        row = cur.fetchone()
        return dict(row) if row else None


def list_steps(conn, run_id: UUID) -> list[dict[str, Any]]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("select * from copilot_run_steps where run_id = %s order by position", (run_id,))
        return list(cur.fetchall())


def usage_summary(conn, user_id: UUID | None = None, days: int = 30) -> dict[str, Any]:
    """Quanto o copiloto consumiu na janela — token, custo e tempo.

    `cost_cents` soma só o que tem preço conhecido; execuções sem preço entram em
    `runs_without_cost` em vez de virarem zero e sumirem da conta.
    """
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            select
              count(*) as runs,
              count(*) filter (where status = 'failed') as failed_runs,
              count(*) filter (where generation_mode = 'preview') as preview_runs,
              count(*) filter (where cost_cents is null and generation_mode = 'live') as runs_without_cost,
              coalesce(sum(input_tokens), 0) as input_tokens,
              coalesce(sum(output_tokens), 0) as output_tokens,
              coalesce(sum(cost_cents), 0) as cost_cents,
              coalesce(round(avg(duration_ms)), 0) as avg_duration_ms
            from copilot_runs
            where created_at >= now() - make_interval(days => %s)
              and (%s::uuid is null or user_id = %s::uuid)
            """,
            (days, user_id, user_id),
        )
        return dict(cur.fetchone())
