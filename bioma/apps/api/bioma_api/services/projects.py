from uuid import UUID

from fastapi import HTTPException, status

from bioma_api.access import is_platform_admin, require_workspace_capability
from bioma_api.db import connect
from bioma_api.repositories import projects as project_repo
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.projects import (
    ContractCreate, ContractSummary, ContractUpdate, ProjectCreate, ProjectDeliverableCreate,
    ProjectDeliverableSummary, ProjectDetail, ProjectSummary, ProjectUpdate,
    ScopeItemCreate, ScopeItemSummary, ScopeItemUpdate,
)


def list_projects(workspace_id: UUID, user: CurrentUserResponse) -> list[ProjectSummary]:
    with connect() as conn:
        context = _workspace(conn, workspace_id, user, "view")
        rows = project_repo.list_projects(conn, workspace_id, context["access_role"] != "client_user")
    return [_project_summary(row) for row in rows]


def get_project(project_id: UUID, user: CurrentUserResponse) -> ProjectDetail:
    with connect() as conn:
        project = _project(conn, project_id, user, "view")
        if project["access_role"] == "client_user" and not project["client_visible"]:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado.")
        include_internal = project["access_role"] != "client_user"
        summaries = project_repo.list_projects(conn, project["workspace_id"], include_internal)
        summary_row = next(row for row in summaries if row["id"] == project_id)
        contracts = project_repo.list_contracts(conn, project_id, include_internal)
        scope_items = project_repo.list_scope_items(conn, project_id, include_internal)
        scope_by_contract: dict[UUID, list[ScopeItemSummary]] = {}
        for row in scope_items:
            scope_by_contract.setdefault(row["contract_id"], []).append(ScopeItemSummary(**row))
        contract_models = [ContractSummary(**row, scope_items=scope_by_contract.get(row["id"], [])) for row in contracts]
        deliverables = [ProjectDeliverableSummary(**row) for row in project_repo.list_deliverables(conn, project_id)]
    return ProjectDetail(**_project_summary(summary_row).model_dump(), contracts=contract_models, deliverables=deliverables)


def create_project(workspace_id: UUID, payload: ProjectCreate, user: CurrentUserResponse) -> ProjectDetail:
    with connect() as conn:
        context = _workspace(conn, workspace_id, user, "manage_work")
        _validate_user(conn, workspace_id, payload.owner_user_id)
        row = project_repo.create_project(conn, context, user.id, payload.model_dump())
        project_repo.write_audit(conn, user.id, context["subject_organization_id"], "project.created", {
            "workspace_id": str(workspace_id), "project_id": str(row["id"]), "project_type": row["project_type"],
        })
    return get_project(row["id"], user)


def update_project(project_id: UUID, payload: ProjectUpdate, user: CurrentUserResponse) -> ProjectDetail:
    with connect() as conn:
        project = _project(conn, project_id, user, "manage_work")
        updates = payload.model_dump(exclude_unset=True)
        _validate_user(conn, project["workspace_id"], updates.get("owner_user_id"))
        _validate_date_range(
            updates.get("start_at", project["start_at"]),
            updates.get("due_at", project["due_at"]),
            "A data final não pode ser anterior à inicial.",
        )
        project_repo.update_project(conn, project_id, updates)
        project_repo.write_audit(conn, user.id, project["organization_id"], "project.updated", {
            "workspace_id": str(project["workspace_id"]), "project_id": str(project_id), "fields": sorted(updates),
        })
    return get_project(project_id, user)


def create_contract(project_id: UUID, payload: ContractCreate, user: CurrentUserResponse) -> ProjectDetail:
    with connect() as conn:
        project = _project(conn, project_id, user, "manage_work")
        row = project_repo.create_contract(conn, project_id, user.id, payload.model_dump())
        project_repo.write_audit(conn, user.id, project["organization_id"], "project.contract_created", {
            "project_id": str(project_id), "contract_id": str(row["id"]), "version": row["version"],
        })
    return get_project(project_id, user)


def update_contract(contract_id: UUID, payload: ContractUpdate, user: CurrentUserResponse) -> ProjectDetail:
    with connect() as conn:
        contract = _contract(conn, contract_id, user, "manage_work")
        updates = payload.model_dump(exclude_unset=True)
        _validate_date_range(
            updates.get("starts_at", contract["starts_at"]),
            updates.get("ends_at", contract["ends_at"]),
            "A vigência final não pode ser anterior à inicial.",
        )
        project_repo.update_contract(conn, contract_id, updates)
        project_repo.write_audit(conn, user.id, contract["organization_id"], "project.contract_updated", {
            "project_id": str(contract["project_id"]), "contract_id": str(contract_id), "fields": sorted(updates),
        })
        project_id = contract["project_id"]
    return get_project(project_id, user)


def create_scope_item(contract_id: UUID, payload: ScopeItemCreate, user: CurrentUserResponse) -> ProjectDetail:
    with connect() as conn:
        contract = _contract(conn, contract_id, user, "manage_work")
        row = project_repo.create_scope_item(conn, contract_id, payload.model_dump())
        project_repo.write_audit(conn, user.id, contract["organization_id"], "project.scope_item_created", {
            "project_id": str(contract["project_id"]), "contract_id": str(contract_id), "scope_item_id": str(row["id"]),
        })
        project_id = contract["project_id"]
    return get_project(project_id, user)


def update_scope_item(scope_item_id: UUID, payload: ScopeItemUpdate, user: CurrentUserResponse) -> ProjectDetail:
    with connect() as conn:
        scope = _scope(conn, scope_item_id, user, "manage_work")
        updates = payload.model_dump(exclude_unset=True)
        cadence = updates.get("cadence", scope["cadence"])
        cadence_days = updates.get("cadence_days", scope["cadence_days"])
        if cadence == "custom" and not cadence_days:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Cadência customizada exige cadence_days.",
            )
        project_repo.update_scope_item(conn, scope_item_id, updates)
        project_repo.write_audit(conn, user.id, scope["organization_id"], "project.scope_item_updated", {
            "project_id": str(scope["project_id"]), "scope_item_id": str(scope_item_id), "fields": sorted(updates),
        })
        project_id = scope["project_id"]
    return get_project(project_id, user)


def create_deliverable(project_id: UUID, payload: ProjectDeliverableCreate, user: CurrentUserResponse) -> ProjectDetail:
    with connect() as conn:
        project = _project(conn, project_id, user, "manage_work")
        if payload.scope_item_id:
            scope = _scope(conn, payload.scope_item_id, user, "manage_work")
            if scope["project_id"] != project_id:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Item de escopo pertence a outro projeto.")
        row = project_repo.create_deliverable(conn, project, payload.model_dump())
        project_repo.write_audit(conn, user.id, project["organization_id"], "project.deliverable_created", {
            "project_id": str(project_id), "deliverable_id": str(row["id"]),
            "scope_item_id": str(payload.scope_item_id) if payload.scope_item_id else None,
        })
    return get_project(project_id, user)


def _workspace(conn, workspace_id: UUID, user: CurrentUserResponse, capability: str):
    context = project_repo.find_workspace_context(conn, workspace_id, is_platform_admin(user), user.id)
    if not context:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace não encontrado.")
    require_workspace_capability(context, user, capability)
    return context


def _project(conn, project_id: UUID, user: CurrentUserResponse, capability: str):
    project = project_repo.find_project_context(conn, project_id, is_platform_admin(user), user.id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado.")
    require_workspace_capability(project, user, capability)
    return project


def _contract(conn, contract_id: UUID, user: CurrentUserResponse, capability: str):
    contract = project_repo.find_contract_context(conn, contract_id, is_platform_admin(user), user.id)
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contrato não encontrado.")
    require_workspace_capability(contract, user, capability)
    return contract


def _scope(conn, scope_item_id: UUID, user: CurrentUserResponse, capability: str):
    scope = project_repo.find_scope_context(conn, scope_item_id, is_platform_admin(user), user.id)
    if not scope:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item de escopo não encontrado.")
    require_workspace_capability(scope, user, capability)
    return scope


def _validate_user(conn, workspace_id: UUID, user_id: UUID | None):
    if user_id and not project_repo.user_belongs_to_workspace(conn, workspace_id, user_id):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Responsável precisa pertencer ao workspace.")


def _validate_date_range(start_at, end_at, detail: str):
    if start_at and end_at and end_at < start_at:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


def _project_summary(row) -> ProjectSummary:
    total = row["deliverables_total"]
    done = row["deliverables_done"]
    overdue = row["deliverables_overdue"]
    blocked = row["deliverables_blocked"]
    completion = round((done / total) * 100, 1) if total else 0
    pace = "unknown" if not total else "off_track" if overdue else "at_risk" if blocked else "on_track"
    return ProjectSummary(**row, completion_percentage=completion, pace_status=pace)
