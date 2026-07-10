from uuid import UUID

from fastapi import HTTPException, status

from bioma_api.db import connect
from bioma_api.domain.models import Role
from bioma_api.integrations.clickup import sync_clickup_folder
from bioma_api.repositories import client_hub as client_hub_repo
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.client_hub import (
    ApprovalDecisionRequest,
    ArtifactCreateRequest,
    ArtifactUpdateRequest,
    ClientCreateRequest,
    ClientPortalResponse,
    ClientSummary,
    ClientUpdateRequest,
    DeliverableCreateRequest,
    DeliverableUpdateRequest,
)


def list_clients(user: CurrentUserResponse) -> list[ClientSummary]:
    is_admin = _is_platform_admin(user)
    with connect() as conn:
        rows = client_hub_repo.list_clients(conn, is_admin, user.id)
    return [ClientSummary(**row) for row in rows]


def create_client(payload: ClientCreateRequest, user: CurrentUserResponse) -> ClientPortalResponse:
    _require_platform_admin(user)
    client_name = payload.name.strip()
    if not client_name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Nome do cliente é obrigatório.")

    with connect() as conn:
        organization_name = (payload.organization_name or client_name).strip()
        organization_slug = client_hub_repo.unique_org_slug(conn, payload.organization_slug or organization_name)
        organization_id = client_hub_repo.create_organization(conn, organization_name, organization_slug)
        client_id = client_hub_repo.create_client(
            conn,
            organization_id,
            client_name,
            payload.status,
            payload.responsible_name,
            payload.clickup_folder_id,
        )
        client_hub_repo.write_audit(
            conn,
            user.id,
            organization_id,
            "client.created",
            {"client_id": str(client_id), "name": client_name},
        )

    return get_client_portal(client_id, user)


def get_client_portal(client_id: UUID, user: CurrentUserResponse) -> ClientPortalResponse:
    is_admin = _is_platform_admin(user)
    with connect() as conn:
        client = client_hub_repo.get_client_summary(conn, client_id, is_admin, user.id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")

        artifacts = client_hub_repo.list_artifacts(conn, client["organization_id"], is_admin)
        deliverables = client_hub_repo.list_deliverables(conn, client["organization_id"])
        approvals = client_hub_repo.list_approvals(conn, client["organization_id"])
        sync_runs = client_hub_repo.list_sync_runs(conn, client["organization_id"])
        audit_logs = client_hub_repo.list_audit_logs(conn, client["organization_id"])

    return ClientPortalResponse(
        client=ClientSummary(**client),
        artifacts=list(artifacts),
        deliverables=list(deliverables),
        approvals=list(approvals),
        sync_runs=list(sync_runs),
        audit_logs=list(audit_logs),
    )


def update_client(client_id: UUID, payload: ClientUpdateRequest, user: CurrentUserResponse) -> ClientPortalResponse:
    _require_platform_admin(user)
    updates = payload.model_dump(exclude_unset=True)

    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        client_updates = {key: updates[key] for key in ("name", "status", "responsible_name", "clickup_folder_id") if key in updates}
        client_hub_repo.update_client(conn, client_id, client_updates)
        if "organization_name" in updates:
            client_hub_repo.update_organization_name(conn, client["organization_id"], updates["organization_name"])
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "client.updated",
            {"client_id": str(client_id), "fields": sorted(updates.keys())},
        )

    return get_client_portal(client_id, user)


def create_artifact(client_id: UUID, payload: ArtifactCreateRequest, user: CurrentUserResponse) -> ClientPortalResponse:
    _require_platform_admin(user)
    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        artifact_id = client_hub_repo.create_artifact(
            conn,
            client["organization_id"],
            payload.title,
            payload.kind,
            payload.visibility,
            payload.content,
            payload.url,
            user.id,
        )
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "artifact.created",
            {"client_id": str(client_id), "artifact_id": str(artifact_id), "title": payload.title},
        )

    return get_client_portal(client_id, user)


def update_artifact(
    client_id: UUID,
    artifact_id: UUID,
    payload: ArtifactUpdateRequest,
    user: CurrentUserResponse,
) -> ClientPortalResponse:
    _require_platform_admin(user)
    updates = payload.model_dump(exclude_unset=True)

    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        if not client_hub_repo.update_artifact(conn, client["organization_id"], artifact_id, updates):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artefato não encontrado.")
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "artifact.updated",
            {"client_id": str(client_id), "artifact_id": str(artifact_id), "fields": sorted(updates.keys())},
        )

    return get_client_portal(client_id, user)


def delete_artifact(client_id: UUID, artifact_id: UUID, user: CurrentUserResponse) -> ClientPortalResponse:
    _require_platform_admin(user)
    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        if not client_hub_repo.delete_artifact(conn, client["organization_id"], artifact_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artefato não encontrado.")
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "artifact.deleted",
            {"client_id": str(client_id), "artifact_id": str(artifact_id)},
        )

    return get_client_portal(client_id, user)


def create_deliverable(client_id: UUID, payload: DeliverableCreateRequest, user: CurrentUserResponse) -> ClientPortalResponse:
    _require_platform_admin(user)
    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        deliverable_id = client_hub_repo.create_deliverable(
            conn,
            client["organization_id"],
            payload.title,
            payload.status,
            payload.due_at,
            payload.clickup_task_id,
        )
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "deliverable.created",
            {"client_id": str(client_id), "deliverable_id": str(deliverable_id), "title": payload.title},
        )

    return get_client_portal(client_id, user)


def update_deliverable(
    client_id: UUID,
    deliverable_id: UUID,
    payload: DeliverableUpdateRequest,
    user: CurrentUserResponse,
) -> ClientPortalResponse:
    _require_platform_admin(user)
    updates = payload.model_dump(exclude_unset=True)

    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        if not client_hub_repo.update_deliverable(conn, client["organization_id"], deliverable_id, updates):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega não encontrada.")
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "deliverable.updated",
            {"client_id": str(client_id), "deliverable_id": str(deliverable_id), "fields": sorted(updates.keys())},
        )

    return get_client_portal(client_id, user)


def delete_deliverable(client_id: UUID, deliverable_id: UUID, user: CurrentUserResponse) -> ClientPortalResponse:
    _require_platform_admin(user)
    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        if not client_hub_repo.delete_deliverable(conn, client["organization_id"], deliverable_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega não encontrada.")
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "deliverable.deleted",
            {"client_id": str(client_id), "deliverable_id": str(deliverable_id)},
        )

    return get_client_portal(client_id, user)


def decide_approval(
    client_id: UUID,
    approval_id: UUID,
    payload: ApprovalDecisionRequest,
    user: CurrentUserResponse,
) -> ClientPortalResponse:
    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        approval = client_hub_repo.get_approval(conn, client["organization_id"], approval_id)
        if not approval:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aprovação não encontrada.")
        if approval["status"] != "pending":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Aprovação já decidida.")

        client_hub_repo.decide_approval(conn, approval_id, payload.status, payload.comment, user.id)
        if approval["deliverable_id"]:
            next_status = "done" if payload.status == "approved" else "blocked"
            client_hub_repo.update_waiting_deliverable_status(conn, approval["deliverable_id"], next_status)
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "approval.decided",
            {"approval_id": str(approval_id), "status": payload.status},
        )

    return get_client_portal(client_id, user)


def sync_clickup(client_id: UUID, user: CurrentUserResponse) -> ClientPortalResponse:
    _require_platform_admin(user)

    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        mapped_list_ids = client_hub_repo.list_clickup_list_ids(conn, client["organization_id"])
        sync_status, summary = sync_clickup_folder(client["clickup_folder_id"], mapped_list_ids)
        summary["deliverables"] = _upsert_clickup_tasks(conn, client["organization_id"], summary.get("tasks", []))
        summary["write_policy"] = {
            "clickup": "hitl_required",
            "bioma": "local_upsert_from_clickup_read",
        }
        client_hub_repo.record_sync_run(conn, client["organization_id"], sync_status, summary)
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "clickup.sync_requested",
            {"client_id": str(client_id), "status": sync_status},
        )

    return get_client_portal(client_id, user)


def _is_platform_admin(user: CurrentUserResponse) -> bool:
    return any(org.slug == "eg" and org.role == Role.eg_admin for org in user.organizations)


def _require_platform_admin(user: CurrentUserResponse) -> None:
    if not _is_platform_admin(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas EG admin pode executar esta ação.")


def _upsert_clickup_tasks(conn, organization_id: UUID, tasks: list[dict]) -> dict[str, int]:
    created = 0
    updated = 0
    skipped = 0

    for task in tasks:
        task_id = task.get("id")
        title = task.get("name")
        if not task_id or not title:
            skipped += 1
            continue

        result = client_hub_repo.upsert_clickup_deliverable(
            conn,
            organization_id,
            task_id,
            title,
            _clickup_status_to_deliverable_status(task.get("status")),
            task.get("due_at"),
        )
        if result == "created":
            created += 1
        elif result == "updated":
            updated += 1
        else:
            skipped += 1

    return {"created": created, "updated": updated, "skipped": skipped}


def _clickup_status_to_deliverable_status(status_name: str | None) -> str:
    value = (status_name or "").lower()
    if any(token in value for token in ("done", "complete", "conclu", "closed", "finalizado")):
        return "done"
    if any(token in value for token in ("block", "bloque", "impedido")):
        return "blocked"
    if any(token in value for token in ("approval", "aprova", "review", "valid")):
        return "waiting_approval"
    if any(token in value for token in ("progress", "andamento", "doing", "execu")):
        return "in_progress"
    return "planned"


def _accessible_client(conn, client_id: UUID, user: CurrentUserResponse):
    is_admin = _is_platform_admin(user)
    client = client_hub_repo.find_accessible_client(conn, client_id, is_admin, user.id)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")
    return client
