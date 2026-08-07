"""Artefatos versionados com procedência (decisão 8).

O Estúdio deixa de ser um formulário e vira a vista destes objetos. O que a
conversa produz não morre mais no histórico: vira peça com nome, versão e um
elo de volta para a execução que a gerou.

Gate: mesmo `resolve_accessible_client` do resto — artefato pertence a um
workspace, e quem não alcança o workspace não alcança o artefato.
"""

from uuid import UUID

from fastapi import HTTPException, status

from bioma_api.access import resolve_accessible_client
from bioma_api.db import connect
from bioma_api.repositories import artifacts as repo
from bioma_api.repositories import client_hub as client_hub_repo
from bioma_api.schemas.artifacts import (
    StudioArtifactCreate,
    StudioArtifactDetail,
    StudioArtifactKindCount,
    StudioArtifactStatusUpdate,
    StudioArtifact,
    StudioArtifactVersionCreate,
    StudioArtifactVersion,
)
from bioma_api.schemas.auth import CurrentUserResponse


def _accessible_artifact(conn, artifact_id: UUID, user: CurrentUserResponse, capability: str = "view"):
    artifact = repo.find(conn, artifact_id)
    if not artifact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artefato não encontrado.")
    if not artifact["workspace_id"]:
        # Artefato anterior à 0089, sem workspace. Só EG alcança, porque não há
        # como decidir de quem ele é — e adivinhar seria pior que recusar.
        resolve_accessible_client(conn, artifact["organization_id"], user, capability=capability)
        return artifact
    # 404 e não 403: não se confirma a existência do que não é seu.
    resolve_accessible_client(conn, artifact["workspace_id"], user, capability=capability)
    return artifact


def list_artifacts(
    workspace_id: UUID,
    user: CurrentUserResponse,
    kind: str | None = None,
    status_filter: str | None = None,
) -> list[StudioArtifact]:
    with connect() as conn:
        context = resolve_accessible_client(conn, workspace_id, user)
        rows = repo.list_for_workspace(conn, context["workspace_id"], kind, status_filter)
    return [StudioArtifact(**row) for row in rows]


def list_kinds(workspace_id: UUID, user: CurrentUserResponse) -> list[StudioArtifactKindCount]:
    with connect() as conn:
        context = resolve_accessible_client(conn, workspace_id, user)
        rows = repo.list_kinds(conn, context["workspace_id"])
    return [StudioArtifactKindCount(**row) for row in rows]


def get_artifact(artifact_id: UUID, user: CurrentUserResponse) -> StudioArtifactDetail:
    with connect() as conn:
        artifact = _accessible_artifact(conn, artifact_id, user)
        versions = repo.list_versions(conn, artifact_id)
    return StudioArtifactDetail(
        **artifact,
        versions=[StudioArtifactVersion(**row) for row in versions],
    )


def create_artifact(
    workspace_id: UUID, payload: StudioArtifactCreate, user: CurrentUserResponse
) -> StudioArtifactDetail:
    with connect() as conn:
        context = resolve_accessible_client(conn, workspace_id, user, capability="generate_content")
        data = payload.model_dump()
        data["workspace_id"] = context["workspace_id"]
        data["organization_id"] = context["organization_id"]
        artifact_id = repo.create(conn, data, user.id)
        client_hub_repo.write_audit(
            conn,
            user.id,
            context["organization_id"],
            "artifact.created",
            {
                "artifact_id": str(artifact_id),
                "kind": payload.kind,
                "thread_id": str(payload.thread_id) if payload.thread_id else None,
            },
        )
    return get_artifact(artifact_id, user)


def add_version(
    artifact_id: UUID, payload: StudioArtifactVersionCreate, user: CurrentUserResponse
) -> StudioArtifactDetail:
    """Nova versão. Nunca sobrescreve — é isso que separa iterar de regerar."""
    with connect() as conn:
        artifact = _accessible_artifact(conn, artifact_id, user, capability="generate_content")
        version = repo.add_version(conn, artifact_id, payload.model_dump(), user.id)
        client_hub_repo.write_audit(
            conn,
            user.id,
            artifact["organization_id"],
            "artifact.version_created",
            {"artifact_id": str(artifact_id), "version": version},
        )
    return get_artifact(artifact_id, user)


def set_status(
    artifact_id: UUID, payload: StudioArtifactStatusUpdate, user: CurrentUserResponse
) -> StudioArtifactDetail:
    with connect() as conn:
        artifact = _accessible_artifact(conn, artifact_id, user, capability="approve")
        repo.set_status(conn, artifact_id, payload.status)
        client_hub_repo.write_audit(
            conn,
            user.id,
            artifact["organization_id"],
            "artifact.status_changed",
            {"artifact_id": str(artifact_id), "status": payload.status},
        )
    return get_artifact(artifact_id, user)
