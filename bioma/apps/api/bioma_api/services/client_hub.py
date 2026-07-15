from uuid import UUID

from fastapi import HTTPException, status

from bioma_api.access import CLIENT_MODULES, require_client_module
from bioma_api.db import connect
from bioma_api.domain.models import Role
from bioma_api.integrations.clickup import sync_clickup_folder
from bioma_api.repositories import client_hub as client_hub_repo
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.client_hub import (
    ApprovalCreateRequest,
    ApprovalDecisionRequest,
    ArtifactCreateRequest,
    ArtifactUpdateRequest,
    ClientCreateRequest,
    ClientPortalResponse,
    ClientSummary,
    ClientUpdateRequest,
    DeliverableCreateRequest,
    DeliverableUpdateRequest,
    FinancialRecordCreateRequest,
    FinancialRecordSummary,
    FinancialRecordUpdateRequest,
    LeadCreateRequest,
    LeadSummary,
    LeadUpdateRequest,
    PerformanceMetricCreateRequest,
    PerformanceMetricSummary,
    PerformanceMetricUpdateRequest,
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
        if updates.get("enabled_modules") is not None:
            requested = set(updates["enabled_modules"])
            invalid = requested - set(CLIENT_MODULES)
            if invalid:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Módulos desconhecidos: {', '.join(sorted(invalid))}.",
                )
            # Hub é o núcleo do portal do cliente; não pode ser desabilitado.
            modules = [module for module in CLIENT_MODULES if module in requested | {"hub"}]
            client_hub_repo.update_organization_modules(conn, client["organization_id"], modules)
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


def create_approval(
    client_id: UUID,
    payload: ApprovalCreateRequest,
    user: CurrentUserResponse,
) -> ClientPortalResponse:
    _require_platform_admin(user)
    with connect() as conn:
        client = _accessible_client(conn, client_id, user)
        deliverable = client_hub_repo.get_deliverable(
            conn,
            client["organization_id"],
            payload.deliverable_id,
        )
        if not deliverable:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega não encontrada.")

        if client_hub_repo.get_pending_approval(conn, client["organization_id"], payload.deliverable_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Esta entrega já possui uma aprovação pendente.",
            )

        approval_id = client_hub_repo.create_approval(
            conn,
            client["organization_id"],
            payload.deliverable_id,
            user.id,
            payload.comment,
        )
        client_hub_repo.update_deliverable(
            conn,
            client["organization_id"],
            payload.deliverable_id,
            {"status": "waiting_approval"},
        )
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "approval.requested",
            {
                "approval_id": str(approval_id),
                "deliverable_id": str(payload.deliverable_id),
            },
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


def list_leads(client_id: UUID, user: CurrentUserResponse) -> list[LeadSummary]:
    with connect() as conn:
        client = _accessible_client(conn, client_id, user, "commercial")
        rows = client_hub_repo.list_leads(conn, client["organization_id"])
    return [LeadSummary(**row) for row in rows]


def create_lead(client_id: UUID, payload: LeadCreateRequest, user: CurrentUserResponse) -> list[LeadSummary]:
    lead_data = payload.model_dump()
    _require_non_empty(lead_data.get("name"), "Nome do lead é obrigatório.")
    with connect() as conn:
        client = _accessible_client(conn, client_id, user, "commercial")
        lead_id = client_hub_repo.create_lead(conn, client["organization_id"], lead_data)
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "lead.created",
            {"client_id": str(client_id), "lead_id": str(lead_id), "name": lead_data["name"]},
        )
    return list_leads(client_id, user)


def update_lead(
    client_id: UUID,
    lead_id: UUID,
    payload: LeadUpdateRequest,
    user: CurrentUserResponse,
) -> list[LeadSummary]:
    updates = payload.model_dump(exclude_unset=True)
    with connect() as conn:
        client = _accessible_client(conn, client_id, user, "commercial")
        if not client_hub_repo.update_lead(conn, client["organization_id"], lead_id, updates):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead não encontrado.")
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "lead.updated",
            {"client_id": str(client_id), "lead_id": str(lead_id), "fields": sorted(updates.keys())},
        )
    return list_leads(client_id, user)


def delete_lead(client_id: UUID, lead_id: UUID, user: CurrentUserResponse) -> list[LeadSummary]:
    with connect() as conn:
        client = _accessible_client(conn, client_id, user, "commercial")
        if not client_hub_repo.delete_lead(conn, client["organization_id"], lead_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead não encontrado.")
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "lead.deleted",
            {"client_id": str(client_id), "lead_id": str(lead_id)},
        )
    return list_leads(client_id, user)


def list_financial_records(client_id: UUID, user: CurrentUserResponse) -> list[FinancialRecordSummary]:
    with connect() as conn:
        client = _accessible_client(conn, client_id, user, "commercial")
        rows = client_hub_repo.list_financial_records(conn, client["organization_id"])
    return [FinancialRecordSummary(**row) for row in rows]


def create_financial_record(
    client_id: UUID,
    payload: FinancialRecordCreateRequest,
    user: CurrentUserResponse,
) -> list[FinancialRecordSummary]:
    record_data = payload.model_dump()
    _require_non_empty(record_data.get("title"), "Título financeiro é obrigatório.")
    with connect() as conn:
        client = _accessible_client(conn, client_id, user, "commercial")
        record_id = client_hub_repo.create_financial_record(conn, client["organization_id"], record_data)
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "financial_record.created",
            {"client_id": str(client_id), "record_id": str(record_id), "title": record_data["title"]},
        )
    return list_financial_records(client_id, user)


def update_financial_record(
    client_id: UUID,
    record_id: UUID,
    payload: FinancialRecordUpdateRequest,
    user: CurrentUserResponse,
) -> list[FinancialRecordSummary]:
    updates = payload.model_dump(exclude_unset=True)
    with connect() as conn:
        client = _accessible_client(conn, client_id, user, "commercial")
        if not client_hub_repo.update_financial_record(conn, client["organization_id"], record_id, updates):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro financeiro não encontrado.")
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "financial_record.updated",
            {"client_id": str(client_id), "record_id": str(record_id), "fields": sorted(updates.keys())},
        )
    return list_financial_records(client_id, user)


def delete_financial_record(client_id: UUID, record_id: UUID, user: CurrentUserResponse) -> list[FinancialRecordSummary]:
    with connect() as conn:
        client = _accessible_client(conn, client_id, user, "commercial")
        if not client_hub_repo.delete_financial_record(conn, client["organization_id"], record_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro financeiro não encontrado.")
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "financial_record.deleted",
            {"client_id": str(client_id), "record_id": str(record_id)},
        )
    return list_financial_records(client_id, user)


def list_performance_metrics(client_id: UUID, user: CurrentUserResponse) -> list[PerformanceMetricSummary]:
    with connect() as conn:
        client = _accessible_client(conn, client_id, user, "analytics")
        rows = client_hub_repo.list_performance_metrics(conn, client["organization_id"])
    return [PerformanceMetricSummary(**row) for row in rows]


def create_performance_metric(
    client_id: UUID,
    payload: PerformanceMetricCreateRequest,
    user: CurrentUserResponse,
) -> list[PerformanceMetricSummary]:
    metric_data = payload.model_dump()
    with connect() as conn:
        client = _accessible_client(conn, client_id, user, "analytics")
        metric_id = client_hub_repo.create_performance_metric(conn, client["organization_id"], metric_data)
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "performance_metric.created",
            {"client_id": str(client_id), "metric_id": str(metric_id), "metric": metric_data["metric"]},
        )
    return list_performance_metrics(client_id, user)


def update_performance_metric(
    client_id: UUID,
    metric_id: UUID,
    payload: PerformanceMetricUpdateRequest,
    user: CurrentUserResponse,
) -> list[PerformanceMetricSummary]:
    updates = payload.model_dump(exclude_unset=True)
    with connect() as conn:
        client = _accessible_client(conn, client_id, user, "analytics")
        if not client_hub_repo.update_performance_metric(conn, client["organization_id"], metric_id, updates):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Métrica não encontrada.")
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "performance_metric.updated",
            {"client_id": str(client_id), "metric_id": str(metric_id), "fields": sorted(updates.keys())},
        )
    return list_performance_metrics(client_id, user)


def delete_performance_metric(client_id: UUID, metric_id: UUID, user: CurrentUserResponse) -> list[PerformanceMetricSummary]:
    with connect() as conn:
        client = _accessible_client(conn, client_id, user, "analytics")
        if not client_hub_repo.delete_performance_metric(conn, client["organization_id"], metric_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Métrica não encontrada.")
        client_hub_repo.write_audit(
            conn,
            user.id,
            client["organization_id"],
            "performance_metric.deleted",
            {"client_id": str(client_id), "metric_id": str(metric_id)},
        )
    return list_performance_metrics(client_id, user)


def _is_platform_admin(user: CurrentUserResponse) -> bool:
    return any(org.slug == "eg" and org.role == Role.eg_admin for org in user.organizations)


def _require_platform_admin(user: CurrentUserResponse) -> None:
    if not _is_platform_admin(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas EG admin pode executar esta ação.")


def _require_non_empty(value: str | None, detail: str) -> None:
    if not value or not value.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


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


def _accessible_client(conn, client_id: UUID, user: CurrentUserResponse, module: str | None = None):
    is_admin = _is_platform_admin(user)
    client = client_hub_repo.find_accessible_client(conn, client_id, is_admin, user.id)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")
    if module:
        require_client_module(client, user, module)
    return client
