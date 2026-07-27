from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from pydantic import ValidationError

from bioma_api.access import is_platform_admin, require_workspace_capability
from bioma_api.db import connect
from bioma_api.repositories import projects as project_repo
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.projects import (
    ContractCreate, ContractSummary, ContractUpdate, ProjectCreate, ProjectDeliverableCreate,
    ProjectDeliverableSummary, ProjectDetail, ProjectDocumentCreate, ProjectDocumentSummary,
    ProjectPhaseCreate, ProjectPhaseSummary, ProjectPhaseUpdate, ProjectSummary, ProjectUpdate,
    ProjectPlanAIOutput, ProjectPlanApproveRequest, ProjectPlanGenerateRequest,
    ProjectPlanItemSummary, ProjectPlanMaterializeRequest, ProjectPlanSummary,
    ProjectUpdateCreate, ProjectUpdateSummary, ScopeItemCreate, ScopeItemSummary, ScopeItemUpdate,
)
from bioma_api.worker_bridge import execute_squad_pipeline_safe


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
        deliverables = [ProjectDeliverableSummary(**row) for row in project_repo.list_deliverables(conn, project_id, include_internal)]
        phases = [ProjectPhaseSummary(**row) for row in project_repo.list_phases(conn, project_id, include_internal)]
        documents = [ProjectDocumentSummary(**row) for row in project_repo.list_documents(conn, project_id, include_internal)]
        updates = [ProjectUpdateSummary(**row) for row in project_repo.list_updates(conn, project_id, include_internal)]
        plans = _list_plan_models(conn, project_id, include_internal)
    return ProjectDetail(
        **_project_summary(summary_row).model_dump(),
        contracts=contract_models,
        deliverables=deliverables,
        phases=phases,
        documents=documents,
        updates=updates,
        plans=plans,
    )


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
        if payload.phase_id:
            phase = _phase(conn, payload.phase_id, user, "manage_work")
            if phase["project_id"] != project_id:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Fase pertence a outro projeto.")
        row = project_repo.create_deliverable(conn, project, payload.model_dump())
        project_repo.write_audit(conn, user.id, project["organization_id"], "project.deliverable_created", {
            "project_id": str(project_id), "deliverable_id": str(row["id"]),
            "scope_item_id": str(payload.scope_item_id) if payload.scope_item_id else None,
        })
    return get_project(project_id, user)


def create_phase(project_id: UUID, payload: ProjectPhaseCreate, user: CurrentUserResponse) -> ProjectDetail:
    with connect() as conn:
        project = _project(conn, project_id, user, "manage_work")
        row = project_repo.create_phase(conn, project_id, payload.model_dump())
        project_repo.write_audit(conn, user.id, project["organization_id"], "project.phase_created", {
            "project_id": str(project_id), "phase_id": str(row["id"]), "sequence": row["sequence"],
        })
    return get_project(project_id, user)


def update_phase(phase_id: UUID, payload: ProjectPhaseUpdate, user: CurrentUserResponse) -> ProjectDetail:
    with connect() as conn:
        phase = _phase(conn, phase_id, user, "manage_work")
        updates = payload.model_dump(exclude_unset=True)
        _validate_date_range(
            updates.get("starts_at", phase["starts_at"]),
            updates.get("due_at", phase["due_at"]),
            "A data final da fase não pode ser anterior à inicial.",
        )
        project_repo.update_phase(conn, phase_id, updates)
        project_repo.write_audit(conn, user.id, phase["organization_id"], "project.phase_updated", {
            "project_id": str(phase["project_id"]), "phase_id": str(phase_id), "fields": sorted(updates),
        })
        project_id = phase["project_id"]
    return get_project(project_id, user)


def create_document(project_id: UUID, payload: ProjectDocumentCreate, user: CurrentUserResponse) -> ProjectDetail:
    with connect() as conn:
        project = _project(conn, project_id, user, "manage_work")
        row = project_repo.create_document(conn, project_id, user.id, payload.model_dump())
        project_repo.write_audit(conn, user.id, project["organization_id"], "project.document_linked", {
            "project_id": str(project_id), "document_id": str(row["id"]), "kind": row["kind"],
        })
    return get_project(project_id, user)


def create_project_update(project_id: UUID, payload: ProjectUpdateCreate, user: CurrentUserResponse) -> ProjectDetail:
    with connect() as conn:
        project = _project(conn, project_id, user, "manage_work")
        if payload.phase_id:
            phase = _phase(conn, payload.phase_id, user, "manage_work")
            if phase["project_id"] != project_id:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Fase pertence a outro projeto.")
        row = project_repo.create_project_update(conn, project_id, user.id, payload.model_dump())
        project_repo.write_audit(conn, user.id, project["organization_id"], "project.update_created", {
            "project_id": str(project_id), "update_id": str(row["id"]), "kind": row["kind"],
            "phase_id": str(payload.phase_id) if payload.phase_id else None,
        })
    return get_project(project_id, user)


def get_project_plan(plan_id: UUID, user: CurrentUserResponse) -> ProjectPlanSummary:
    with connect() as conn:
        plan = _plan(conn, plan_id, user, "view")
        include_internal = plan["access_role"] != "client_user"
        if not include_internal and plan["status"] not in ("approved", "materialized"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plano não encontrado.")
        items = [
            ProjectPlanItemSummary(**row)
            for row in project_repo.list_project_plan_items(conn, plan_id, include_internal)
        ]
    return ProjectPlanSummary(**plan, items=items)


def generate_project_plan(
    project_id: UUID,
    payload: ProjectPlanGenerateRequest,
    user: CurrentUserResponse,
) -> ProjectPlanSummary:
    with connect() as conn:
        project = _project(conn, project_id, user, "manage_work")
        contracts = project_repo.list_contracts(conn, project_id, True)
        contract = None
        if payload.contract_id:
            contract = _contract(conn, payload.contract_id, user, "manage_work")
            if contract["project_id"] != project_id:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Contrato pertence a outro projeto.",
                )
        elif payload.source_kind == "contract":
            contract = contracts[0] if contracts else None
        if payload.source_kind == "contract" and not contract:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Crie ou selecione um contrato antes de gerar o plano.",
            )
        if payload.source_kind == "briefing" and not (payload.briefing or "").strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="O briefing é obrigatório para esta origem.",
            )

        all_scope_items = project_repo.list_scope_items(conn, project_id, True)
        scope_items = [
            row for row in all_scope_items
            if row["status"] == "active" and (not contract or row["contract_id"] == contract["id"])
        ]
        documents = project_repo.list_documents(conn, project_id, True)
        snapshot = {
            "project_name": project["name"],
            "discipline": project["project_type"],
            "project_objective": payload.objective or project.get("objective"),
            "source_kind": payload.source_kind,
            "briefing": payload.briefing,
            "social_approval_flow": payload.social_approval_flow,
            "contract": (
                {
                    "id": str(contract["id"]),
                    "title": contract["title"],
                    "version": contract["version"],
                    "starts_at": str(contract["starts_at"]) if contract["starts_at"] else None,
                    "ends_at": str(contract["ends_at"]) if contract["ends_at"] else None,
                }
                if contract else None
            ),
            "scope_items": [
                {
                    "id": str(item["id"]),
                    "title": item["title"],
                    "description": item["description"],
                    "quantity": str(item["quantity"]),
                    "unit": item["unit"],
                    "cadence": item["cadence"],
                    "cadence_days": item["cadence_days"],
                    "acceptance_required": item["acceptance_required"],
                    "acceptance_criteria": item["acceptance_criteria"],
                    "client_visible": item["client_visible"],
                }
                for item in scope_items
            ],
            "documents": [
                {"kind": item["kind"], "title": item["title"], "url": item["url"]}
                for item in documents
            ],
        }

    result = execute_squad_pipeline_safe(
        pilar="planning",
        squad_key=f"{project['project_type']}_project_planner",
        input_context=snapshot,
        requested_by_user_id=str(user.id),
    )
    try:
        output = ProjectPlanAIOutput.model_validate(result["output_data"])
    except (KeyError, ValidationError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="O planejador retornou uma estrutura inválida.",
        ) from exc

    scope_by_id = {item["id"]: item for item in scope_items}
    allowed_scope_ids = set(scope_by_id)
    planning_start = (contract["starts_at"] if contract else None) or project["start_at"] or date.today()
    planning_deadline = (contract["ends_at"] if contract else None) or project["due_at"]
    max_due_offset = (
        max(0, (planning_deadline - planning_start).days)
        if planning_deadline else None
    )
    normalized_items = []
    for item in output.items:
        item_data = item.model_dump()
        if item.source_scope_item_id not in allowed_scope_ids:
            item_data["source_scope_item_id"] = None
        else:
            source_scope = scope_by_id[item.source_scope_item_id]
            item_data["client_visible"] = source_scope["client_visible"]
            item_data["approval_required"] = source_scope["acceptance_required"]
            item_data["metadata"] = {
                "contract_quantity": str(source_scope["quantity"]),
                "contract_unit": source_scope["unit"],
                "contract_cadence": source_scope["cadence"],
                "acceptance_criteria": source_scope["acceptance_criteria"],
            }
        if max_due_offset is None:
            item_data["due_offset_days"] = None
        elif item.due_offset_days is not None:
            item_data["due_offset_days"] = min(item.due_offset_days, max_due_offset)
        if project["project_type"] != "tech":
            item_data["github_eligible"] = False
        elif item.item_kind == "technical_task":
            item_data["github_eligible"] = True
        normalized_items.append(item_data)

    with connect() as conn:
        current_project = _project(conn, project_id, user, "manage_work")
        project_repo.lock_project(conn, project_id)
        if contract:
            current_contract = _contract(conn, contract["id"], user, "manage_work")
            if current_contract["project_id"] != project_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="O contrato mudou durante a geração do plano.",
                )
        version = project_repo.next_plan_version(conn, project_id)
        plan = project_repo.create_project_plan(
            conn,
            project_id,
            user.id,
            {
                "source_contract_id": contract["id"] if contract else None,
                "version": version,
                "discipline": current_project["project_type"],
                "source_kind": payload.source_kind,
                "generation_mode": result["generation_mode"],
                "title": output.plan_title,
                "objective": output.objective,
                "assumptions": output.assumptions,
            },
        )
        project_repo.create_project_plan_items(conn, plan["id"], normalized_items)
        project_repo.write_audit(
            conn,
            user.id,
            current_project["organization_id"],
            "project.plan_generated",
            {
                "project_id": str(project_id),
                "plan_id": str(plan["id"]),
                "version": version,
                "discipline": current_project["project_type"],
                "source_kind": payload.source_kind,
                "generation_mode": result["generation_mode"],
            },
        )
    return get_project_plan(plan["id"], user)


def approve_project_plan(
    plan_id: UUID,
    payload: ProjectPlanApproveRequest,
    user: CurrentUserResponse,
) -> ProjectPlanSummary:
    with connect() as conn:
        plan = _plan(conn, plan_id, user, "approve")
        if plan["access_role"] == "client_user":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="A aprovação operacional do plano é restrita à equipe responsável.",
            )
        if plan["status"] not in ("draft", "approved", "materialized"):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Plano não pode mais ser aprovado.")
        if plan["status"] == "draft":
            updated = project_repo.approve_project_plan(conn, plan_id, plan["project_id"], user.id)
            if not updated:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Plano já foi alterado.")
            project_repo.write_audit(
                conn,
                user.id,
                plan["organization_id"],
                "project.plan_approved",
                {"project_id": str(plan["project_id"]), "plan_id": str(plan_id), "version": plan["version"]},
            )
    return get_project_plan(plan_id, user)


def materialize_project_plan(
    plan_id: UUID,
    payload: ProjectPlanMaterializeRequest,
    user: CurrentUserResponse,
) -> ProjectDetail:
    with connect() as conn:
        plan = _plan(conn, plan_id, user, "manage_work")
        project_repo.lock_project_plan(conn, plan_id)
        if plan["status"] not in ("approved", "materialized"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Aprove o plano antes de criar fases e entregas.",
            )
        project = _project(conn, plan["project_id"], user, "manage_work")
        items = project_repo.list_project_plan_items(conn, plan_id, True)
        phase_ids = {
            (item["phase_name"], item["client_visible"]): item["materialized_phase_id"]
            for item in items if item["materialized_phase_id"]
        }
        next_sequence = project_repo.next_phase_sequence(conn, project["id"])
        base_date = project["start_at"] or date.today()
        created_deliverables = 0

        for item in items:
            if item["materialized_deliverable_id"]:
                continue
            phase_key = (item["phase_name"], item["client_visible"])
            phase_id = phase_ids.get(phase_key)
            if not phase_id:
                phase_offsets = [
                    candidate["due_offset_days"]
                    for candidate in items
                    if (
                        candidate["phase_name"] == item["phase_name"]
                        and candidate["client_visible"] == item["client_visible"]
                        and candidate["due_offset_days"] is not None
                    )
                ]
                phase_due = base_date + timedelta(days=max(phase_offsets)) if phase_offsets else None
                phase_name = item["phase_name"] if item["client_visible"] else f"{item['phase_name']} (interno)"
                phase = project_repo.create_phase(
                    conn,
                    project["id"],
                    {
                        "sequence": next_sequence,
                        "name": phase_name,
                        "description": None,
                        "status": "planned",
                        "client_summary": f"Fase prevista no plano v{plan['version']}.",
                        "client_visible": item["client_visible"],
                        "starts_at": base_date,
                        "due_at": phase_due,
                    },
                )
                phase_id = phase["id"]
                phase_ids[phase_key] = phase_id
                next_sequence += 1

            due_at = None
            if item["due_offset_days"] is not None:
                due_date = base_date + timedelta(days=item["due_offset_days"])
                due_at = datetime.combine(due_date, time.min, tzinfo=timezone.utc)
            deliverable = project_repo.create_deliverable(
                conn,
                project,
                {
                    "scope_item_id": item["source_scope_item_id"],
                    "phase_id": phase_id,
                    "title": item["title"],
                    "status": "planned",
                    "due_at": due_at,
                },
            )
            project_repo.mark_plan_item_materialized(conn, item["id"], phase_id, deliverable["id"])
            created_deliverables += 1

        project_repo.mark_plan_materialized(conn, plan_id)
        project_repo.write_audit(
            conn,
            user.id,
            project["organization_id"],
            "project.plan_materialized",
            {
                "project_id": str(project["id"]),
                "plan_id": str(plan_id),
                "created_deliverables": created_deliverables,
                "idempotent_replay": created_deliverables == 0,
            },
        )
    return get_project(project["id"], user)


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


def _phase(conn, phase_id: UUID, user: CurrentUserResponse, capability: str):
    phase = project_repo.find_phase_context(conn, phase_id, is_platform_admin(user), user.id)
    if not phase:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fase não encontrada.")
    require_workspace_capability(phase, user, capability)
    return phase


def _plan(conn, plan_id: UUID, user: CurrentUserResponse, capability: str):
    plan = project_repo.find_plan_context(conn, plan_id, is_platform_admin(user), user.id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plano não encontrado.")
    require_workspace_capability(plan, user, capability)
    return plan


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


def _list_plan_models(conn, project_id: UUID, include_internal: bool) -> list[ProjectPlanSummary]:
    plans = project_repo.list_project_plans(conn, project_id, include_internal)
    return [
        ProjectPlanSummary(
            **plan,
            items=[
                ProjectPlanItemSummary(**item)
                for item in project_repo.list_project_plan_items(conn, plan["id"], include_internal)
            ],
        )
        for plan in plans
    ]
