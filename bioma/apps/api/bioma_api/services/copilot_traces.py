"""Leitura das conversas e da trilha de auditoria do copiloto.

Escopo (decisão do Eduardo: copiloto é EG-only): toda entrada exige
`require_platform_admin`. Dentro da EG, cada um lê a própria conversa; a
auditoria de execução é aberta a qualquer admin — o ponto dela é justamente
poder conferir o trabalho do agente sem depender de quem o acionou.
"""

from uuid import UUID

from fastapi import HTTPException, status

from bioma_api.access import require_platform_admin
from bioma_api.db import connect
from bioma_api.repositories import copilot_traces as repo
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.copilot import (
    CopilotRunStep,
    CopilotRunTrace,
    CopilotThreadSummary,
    CopilotUsageSummary,
)


def list_threads(status_val: str, user: CurrentUserResponse) -> list[CopilotThreadSummary]:
    require_platform_admin(user)
    with connect() as conn:
        rows = repo.list_threads(conn, user.id, status_val)
    return [CopilotThreadSummary(**row) for row in rows]


def get_thread_runs(thread_id: UUID, user: CurrentUserResponse) -> list[CopilotRunTrace]:
    require_platform_admin(user)
    with connect() as conn:
        thread = repo.get_thread(conn, thread_id)
        if not thread or thread["user_id"] != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversa não encontrada.")
        runs = repo.list_runs(conn, thread_id)
        return [_trace(run, repo.list_steps(conn, run["id"])) for run in runs]


def archive_thread(thread_id: UUID, user: CurrentUserResponse) -> CopilotThreadSummary:
    require_platform_admin(user)
    with connect() as conn:
        thread = repo.get_thread(conn, thread_id)
        if not thread or thread["user_id"] != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversa não encontrada.")
        repo.archive_thread(conn, thread_id)
        # Relê pela listagem para devolver com run_count/last_message preenchidos.
        row = next(
            (item for item in repo.list_threads(conn, user.id, "archived") if item["id"] == thread_id),
            None,
        )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversa não encontrada.")
    return CopilotThreadSummary(**row)


def get_run(run_id: UUID, user: CurrentUserResponse) -> CopilotRunTrace:
    require_platform_admin(user)
    with connect() as conn:
        run = repo.get_run(conn, run_id)
        if not run:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Execução não encontrada.")
        steps = repo.list_steps(conn, run_id)
    return _trace(run, steps)


def usage(days: int, mine_only: bool, user: CurrentUserResponse) -> CopilotUsageSummary:
    require_platform_admin(user)
    with connect() as conn:
        row = repo.usage_summary(conn, user.id if mine_only else None, days)
    return CopilotUsageSummary(**{key: int(value) for key, value in row.items()})


def _trace(run: dict, steps: list[dict]) -> CopilotRunTrace:
    return CopilotRunTrace(
        **{key: run[key] for key in (
            "id", "thread_id", "message", "answer", "status", "error_message",
            "generation_mode", "provider", "model", "confidence",
            "dossier_summary", "memories_used", "skills_used", "sources", "actions",
            "input_tokens", "output_tokens", "cost_cents", "duration_ms", "created_at",
        )},
        steps=[CopilotRunStep(**{key: step[key] for key in (
            "position", "kind", "label", "status", "detail", "payload", "duration_ms",
        )}) for step in steps],
    )
