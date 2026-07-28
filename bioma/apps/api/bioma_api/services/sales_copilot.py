from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status

from bioma_api.access import require_platform_admin
from bioma_api.db import connect
from bioma_api.repositories import sales_copilot as copilot_repo
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.sales_copilot import (
    RealtimeAdapterStatus,
    SalesCopilotCompleteRequest,
    SalesCopilotEvent,
    SalesCopilotEventCreate,
    SalesCopilotMetrics,
    SalesCopilotSession,
    SalesCopilotSessionCreate,
)
from bioma_api.worker_bridge import execute_squad_pipeline_safe


def list_sessions(user: CurrentUserResponse) -> list[SalesCopilotSession]:
    require_platform_admin(user)
    with connect() as conn:
        rows = copilot_repo.list_sessions(conn)
        return [_session(conn, row) for row in rows]


def get_session(session_id: UUID, user: CurrentUserResponse) -> SalesCopilotSession:
    require_platform_admin(user)
    with connect() as conn:
        row = _find(conn, session_id)
        return _session(conn, row)


def create_session(
    payload: SalesCopilotSessionCreate,
    user: CurrentUserResponse,
) -> SalesCopilotSession:
    require_platform_admin(user)
    with connect() as conn:
        context = copilot_repo.get_knowledge_context(conn, payload.workspace_id, payload.proposal_id)
        _validate_context(payload.workspace_id, payload.proposal_id, context)
        row = copilot_repo.create_session(conn, user.id, payload.model_dump())
        return _session(conn, row)


def prepare_session(session_id: UUID, user: CurrentUserResponse) -> SalesCopilotSession:
    require_platform_admin(user)
    with connect() as conn:
        row = _find(conn, session_id, for_update=True)
        context = copilot_repo.get_knowledge_context(conn, row["workspace_id"], row["proposal_id"])
    ai_result = execute_squad_pipeline_safe(
        pilar="conversao",
        squad_key="sales_copilot",
        input_context={
            "objective": row["objective"] or row["title"],
            "project_title": row["title"],
            "project_description": row["participant_context"] or "",
            "knowledge_context": context,
            "source": "sales_copilot_preparation",
        },
        requested_by_user_id=str(user.id),
    )
    output = ai_result["output_data"]
    brief = {
        "generation_mode": ai_result["generation_mode"],
        "meeting_objective": row["objective"] or row["title"],
        "opening": output.get("script_fechamento") or "Validar contexto, dor, impacto e próximo passo.",
        "objection_map": output.get("objecoes") or output.get("objection_map") or [],
        "recommended_questions": output.get("perguntas") or [
            "Qual impacto do problema hoje?",
            "Quem participa da decisão?",
            "Qual prazo real para resolver?",
        ],
        "knowledge_used": sorted(context),
    }
    with connect() as conn:
        _find(conn, session_id, for_update=True)
        prepared = copilot_repo.prepare_session(conn, session_id, context, brief)
        return _session(conn, prepared)


def add_event(
    session_id: UUID,
    payload: SalesCopilotEventCreate,
    user: CurrentUserResponse,
) -> SalesCopilotSession:
    require_platform_admin(user)
    with connect() as conn:
        session = _find(conn, session_id, for_update=True)
        if session["status"] in {"completed", "cancelled"}:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A sessão já foi encerrada.")
        copilot_repo.add_event(conn, session_id, user.id, payload.model_dump(mode="json"))
        refreshed = _find(conn, session_id)
        return _session(conn, refreshed)


def complete_session(
    session_id: UUID,
    payload: SalesCopilotCompleteRequest,
    user: CurrentUserResponse,
) -> SalesCopilotSession:
    require_platform_admin(user)
    with connect() as conn:
        row = _find(conn, session_id, for_update=True)
        if row["status"] == "completed":
            return _session(conn, row)
        transcript = row["transcript"].strip()
    if not transcript:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Inclua a transcrição ou notas antes de concluir.",
        )
    ai_result = execute_squad_pipeline_safe(
        pilar="conversao",
        squad_key="sales_copilot",
        input_context={
            "objective": f"Resumir reunião comercial: {row['title']}",
            "project_title": row["title"],
            "project_description": transcript[-20_000:],
            "source": "sales_copilot_post_call",
        },
        requested_by_user_id=str(user.id),
    )
    output = ai_result["output_data"]
    summary = (
        output.get("script_fechamento")
        or output.get("summary")
        or f"Reunião concluída com {len(transcript.split())} palavras registradas."
    )
    with connect() as conn:
        _find(conn, session_id, for_update=True)
        completed = copilot_repo.complete_session(
            conn,
            session_id,
            payload.duration_seconds,
            summary,
        )
        copilot_repo.add_event(
            conn,
            session_id,
            user.id,
            {
                "event_type": "insight",
                "content": summary,
                "recommendation": "Revisar o resumo e registrar o próximo passo no CRM.",
                "source_refs": [{"kind": "transcript", "generation_mode": ai_result["generation_mode"]}],
            },
        )
        return _session(conn, completed)


def metrics(user: CurrentUserResponse) -> SalesCopilotMetrics:
    require_platform_admin(user)
    with connect() as conn:
        return SalesCopilotMetrics(**copilot_repo.metrics(conn))


def realtime_adapter_status(user: CurrentUserResponse) -> RealtimeAdapterStatus:
    require_platform_admin(user)
    return RealtimeAdapterStatus(
        available=False,
        status="not_configured",
        message=(
            "Transcrição e recomendações em tempo real exigem provedor, orçamento, "
            "consentimento e política de retenção. O modo atual aceita transcrição manual/assíncrona."
        ),
        supported_input=["manual_transcript", "meeting_notes", "post_call_analysis"],
    )


def _find(conn, session_id: UUID, *, for_update: bool = False):
    row = copilot_repo.get_session(conn, session_id, for_update=for_update)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessão não encontrada.")
    return row


def _session(conn, row) -> SalesCopilotSession:
    return SalesCopilotSession(
        **dict(row),
        events=[SalesCopilotEvent(**event) for event in copilot_repo.list_events(conn, row["id"])],
    )


def _validate_context(workspace_id: UUID | None, proposal_id: UUID | None, context: dict) -> None:
    if workspace_id and "client" not in context:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente ativo não encontrado.")
    if proposal_id and "proposal" not in context:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposta não encontrada.")
    if workspace_id and proposal_id:
        proposal_workspace_id = context["proposal"].get("workspace_id")
        if proposal_workspace_id != workspace_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A proposta não pertence ao cliente selecionado.",
            )
