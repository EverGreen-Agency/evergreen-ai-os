import sys
from pathlib import Path
from uuid import UUID

from fastapi import HTTPException, status

# Add worker to sys.path
worker_path = Path(__file__).resolve().parent.parent.parent.parent / "worker"
if str(worker_path) not in sys.path:
    sys.path.insert(0, str(worker_path))

from bioma_api.access import is_platform_admin, require_client_module, require_workspace_capability
from bioma_api.db import connect
from bioma_api.repositories import client_hub as client_hub_repo
from bioma_api.repositories import squads as squads_repo
from bioma_api.repositories import workspaces as workspaces_repo
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.squads import (
    FinOpsSummaryResponse,
    RunSquadPayload,
    SquadDefinitionPayload,
    SquadDefinitionSummary,
    SquadExecutionSummary,
)
from bioma_worker.config import get_settings as get_worker_settings
from bioma_worker.squad_runner import execute_squad_pipeline


def list_squads(workspace_id: UUID, user: CurrentUserResponse) -> list[SquadDefinitionSummary]:
    with connect() as conn:
        client = _accessible_workspace(conn, workspace_id, user)
        rows = squads_repo.list_squad_definitions(conn, client["workspace_id"])
    return [SquadDefinitionSummary(**row) for row in rows]


def upsert_squad(
    workspace_id: UUID,
    payload: SquadDefinitionPayload,
    user: CurrentUserResponse,
) -> SquadDefinitionSummary:
    with connect() as conn:
        client = _accessible_workspace(conn, workspace_id, user, "manage_config")
        row = squads_repo.upsert_squad_definition(conn, client["workspace_id"], payload.model_dump())
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "squad.definition_saved",
            {
                "workspace_id": str(client["workspace_id"]),
                "squad_slug": payload.squad_slug,
                "pilar": payload.pilar,
            },
        )
    return SquadDefinitionSummary(**row)


def run_squad(
    workspace_id: UUID,
    payload: RunSquadPayload,
    user: CurrentUserResponse,
) -> SquadExecutionSummary:
    with connect() as conn:
        client = _accessible_workspace(conn, workspace_id, user, "generate_content")
        squad_def = squads_repo.get_squad_definition(conn, client["workspace_id"], payload.squad_slug)
        squad_id = squad_def["id"] if squad_def else None

        # Execute Autonomous Squad Pipeline via Worker Engine
        result = execute_squad_pipeline(payload.pilar, payload.squad_name, payload.input_data, get_worker_settings())

        execution_row = squads_repo.create_execution(
            conn,
            client["workspace_id"],
            {
                "squad_id": squad_id,
                "pilar": payload.pilar,
                "squad_name": payload.squad_name,
                "triggered_by": user.email,
                "status": "completed",
                "input_data": payload.input_data,
                "output_data": result["output_data"],
                "token_usage": result["token_usage"],
                "estimated_cost_cents": result["estimated_cost_cents"],
                "execution_logs": result["execution_logs"],
                "completed_at": result["completed_at"],
            },
        )

        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "squad.pipeline_executed",
            {
                "workspace_id": str(client["workspace_id"]),
                "pilar": payload.pilar,
                "squad_slug": payload.squad_slug,
                "estimated_cost_cents": result["estimated_cost_cents"],
            },
        )

    return SquadExecutionSummary(**execution_row)


def list_executions(workspace_id: UUID, user: CurrentUserResponse, limit: int = 50) -> list[SquadExecutionSummary]:
    with connect() as conn:
        client = _accessible_workspace(conn, workspace_id, user)
        rows = squads_repo.list_executions(conn, client["workspace_id"], limit)
    return [SquadExecutionSummary(**row) for row in rows]


def get_finops(workspace_id: UUID, user: CurrentUserResponse) -> FinOpsSummaryResponse:
    with connect() as conn:
        client = _accessible_workspace(conn, workspace_id, user)
        totals = squads_repo.get_finops_summary(conn, client["workspace_id"])
    return FinOpsSummaryResponse(workspace_id=client["workspace_id"], **totals)


def _accessible_workspace(conn, workspace_id: UUID, user: CurrentUserResponse, capability: str | None = None):
    client = workspaces_repo.find_accessible_client(conn, workspace_id, is_platform_admin(user), user.id)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace não encontrado.")
    require_client_module(client, user, "commercial")
    if capability:
        require_workspace_capability(client, user, capability)
    return client
