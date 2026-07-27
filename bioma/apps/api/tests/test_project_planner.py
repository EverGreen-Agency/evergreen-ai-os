from contextlib import contextmanager
from datetime import datetime, timezone
from uuid import uuid4

import pytest
from fastapi import HTTPException

from bioma_api.schemas.projects import (
    ProjectPlanApproveRequest,
    ProjectPlanGenerateRequest,
    ProjectPlanMaterializeRequest,
)
from bioma_api.services import projects as project_service


def test_social_plan_never_creates_github_candidate_or_invented_deadline(eg_admin, monkeypatch):
    project_id = uuid4()
    organization_id = uuid4()
    scope_id = uuid4()
    plan_id = uuid4()
    open_connections = 0
    saved_items = []

    @contextmanager
    def fake_connect():
        nonlocal open_connections
        open_connections += 1
        try:
            yield object()
        finally:
            open_connections -= 1

    project = {
        "id": project_id,
        "name": "Social Cliente",
        "project_type": "social",
        "objective": "Planejar conteúdo",
        "start_at": None,
        "due_at": None,
        "organization_id": organization_id,
        "workspace_id": uuid4(),
        "access_role": "platform_admin",
    }
    scope = {
        "id": scope_id,
        "contract_id": uuid4(),
        "title": "Conteúdo mensal",
        "description": "Pacote editorial",
        "quantity": 8,
        "unit": "posts",
        "cadence": "monthly",
        "cadence_days": None,
        "acceptance_required": True,
        "acceptance_criteria": "Aprovação do cliente",
        "client_visible": True,
        "status": "active",
    }

    def fake_execute(**_kwargs):
        assert open_connections == 0
        return {
            "output_data": {
                "plan_title": "Plano editorial",
                "objective": "Planejar conteúdo",
                "assumptions": [],
                "items": [{
                    "source_scope_item_id": str(scope_id),
                    "phase_name": "Produção",
                    "title": "Produzir pacote editorial",
                    "description": None,
                    "item_kind": "content",
                    "due_offset_days": 15,
                    "client_visible": False,
                    "approval_required": False,
                    "github_eligible": True,
                }],
            },
            "generation_mode": "live",
        }

    def fake_create_items(_conn, saved_plan_id, items):
        assert saved_plan_id == plan_id
        saved_items.extend(items)

    monkeypatch.setattr(project_service, "connect", fake_connect)
    monkeypatch.setattr(project_service, "_project", lambda *_args, **_kwargs: project)
    monkeypatch.setattr(project_service.project_repo, "list_contracts", lambda *_args: [])
    monkeypatch.setattr(project_service.project_repo, "list_scope_items", lambda *_args: [scope])
    monkeypatch.setattr(project_service.project_repo, "list_documents", lambda *_args: [])
    monkeypatch.setattr(project_service, "execute_squad_pipeline_safe", fake_execute)
    monkeypatch.setattr(project_service.project_repo, "lock_project", lambda *_args: None)
    monkeypatch.setattr(project_service.project_repo, "next_plan_version", lambda *_args: 1)
    monkeypatch.setattr(
        project_service.project_repo,
        "create_project_plan",
        lambda *_args, **_kwargs: {"id": plan_id},
    )
    monkeypatch.setattr(project_service.project_repo, "create_project_plan_items", fake_create_items)
    monkeypatch.setattr(project_service.project_repo, "write_audit", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(project_service, "get_project_plan", lambda saved_plan_id, _user: saved_plan_id)

    result = project_service.generate_project_plan(
        project_id,
        ProjectPlanGenerateRequest(source_kind="onboarding", social_approval_flow="after_production"),
        eg_admin,
    )

    assert result == plan_id
    assert saved_items[0]["github_eligible"] is False
    assert saved_items[0]["due_offset_days"] is None
    assert saved_items[0]["client_visible"] is True
    assert saved_items[0]["approval_required"] is True
    assert saved_items[0]["metadata"]["contract_cadence"] == "monthly"


def test_materialization_replay_does_not_duplicate_deliverables(eg_admin, monkeypatch):
    plan_id = uuid4()
    project_id = uuid4()
    phase_id = uuid4()
    deliverable_id = uuid4()
    audit_metadata = {}

    plan = {
        "id": plan_id,
        "project_id": project_id,
        "version": 2,
        "status": "materialized",
        "organization_id": uuid4(),
        "access_role": "platform_admin",
    }
    project = {
        "id": project_id,
        "organization_id": plan["organization_id"],
        "start_at": None,
    }
    item = {
        "id": uuid4(),
        "phase_name": "Execução",
        "client_visible": True,
        "materialized_phase_id": phase_id,
        "materialized_deliverable_id": deliverable_id,
        "due_offset_days": None,
    }

    @contextmanager
    def fake_connect():
        yield object()

    def should_not_create(*_args, **_kwargs):
        raise AssertionError("replay idempotente não pode criar novas linhas")

    def fake_audit(_conn, _user_id, _org_id, _event, metadata):
        audit_metadata.update(metadata)

    monkeypatch.setattr(project_service, "connect", fake_connect)
    monkeypatch.setattr(project_service, "_plan", lambda *_args, **_kwargs: plan)
    monkeypatch.setattr(project_service, "_project", lambda *_args, **_kwargs: project)
    monkeypatch.setattr(project_service.project_repo, "lock_project_plan", lambda *_args: None)
    monkeypatch.setattr(project_service.project_repo, "list_project_plan_items", lambda *_args: [item])
    monkeypatch.setattr(project_service.project_repo, "next_phase_sequence", lambda *_args: 1)
    monkeypatch.setattr(project_service.project_repo, "create_phase", should_not_create)
    monkeypatch.setattr(project_service.project_repo, "create_deliverable", should_not_create)
    monkeypatch.setattr(project_service.project_repo, "mark_plan_materialized", lambda *_args: None)
    monkeypatch.setattr(project_service.project_repo, "write_audit", fake_audit)
    monkeypatch.setattr(project_service, "get_project", lambda saved_project_id, _user: saved_project_id)

    result = project_service.materialize_project_plan(
        plan_id,
        ProjectPlanMaterializeRequest(confirm=True),
        eg_admin,
    )

    assert result == project_id
    assert audit_metadata["created_deliverables"] == 0
    assert audit_metadata["idempotent_replay"] is True


def test_client_user_cannot_approve_internal_plan(client_user_factory, monkeypatch):
    @contextmanager
    def fake_connect():
        yield object()

    monkeypatch.setattr(project_service, "connect", fake_connect)
    monkeypatch.setattr(
        project_service,
        "_plan",
        lambda *_args, **_kwargs: {
            "id": uuid4(),
            "project_id": uuid4(),
            "organization_id": uuid4(),
            "access_role": "client_user",
            "status": "draft",
            "version": 1,
        },
    )

    with pytest.raises(HTTPException) as exc:
        project_service.approve_project_plan(
            uuid4(),
            ProjectPlanApproveRequest(confirm=True),
            client_user_factory(),
        )

    assert exc.value.status_code == 403
