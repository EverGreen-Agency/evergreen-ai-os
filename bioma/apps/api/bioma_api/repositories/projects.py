from typing import Any
from uuid import UUID

from psycopg.types.json import Jsonb


def find_workspace_context(conn, workspace_id: UUID, is_admin: bool, user_id: UUID):
    return conn.execute(
        """
        select w.id as workspace_id, w.tenant_organization_id, w.subject_organization_id,
          case when %s then 'platform_admin' else workspace_access_role(w.id, %s) end as access_role
        from workspaces w
        where w.id = %s and w.status = 'active'
          and (%s or workspace_access_role(w.id, %s) is not null)
        """,
        (is_admin, user_id, workspace_id, is_admin, user_id),
    ).fetchone()


def find_project_context(conn, project_id: UUID, is_admin: bool, user_id: UUID):
    return conn.execute(
        """
        select project.*, w.subject_organization_id,
          case when %s then 'platform_admin' else workspace_access_role(w.id, %s) end as access_role
        from projects project
        join workspaces w on w.id = project.workspace_id and w.status = 'active'
        where project.id = %s
          and (%s or workspace_access_role(w.id, %s) is not null)
        """,
        (is_admin, user_id, project_id, is_admin, user_id),
    ).fetchone()


def list_projects(conn, workspace_id: UUID, include_internal: bool):
    return conn.execute(
        """
        select project.id, project.workspace_id, project.name, project.code, project.project_type,
          project.status, project.owner_user_id, owner.display_name as owner_name,
          project.start_at, project.due_at, project.cadence_days, project.client_visible,
          project.objective, project.updated_at,
          count(deliverable.id)::int as deliverables_total,
          count(deliverable.id) filter (where deliverable.status = 'done')::int as deliverables_done,
          count(deliverable.id) filter (
            where deliverable.due_at < now() and deliverable.status not in ('done')
          )::int as deliverables_overdue,
          count(deliverable.id) filter (where deliverable.status = 'blocked')::int as deliverables_blocked
        from projects project
        left join users owner on owner.id = project.owner_user_id
        left join deliverables deliverable on deliverable.project_id = project.id
        where project.workspace_id = %s and (%s or project.client_visible)
        group by project.id, owner.display_name
        order by case project.status when 'active' then 0 when 'planned' then 1 else 2 end,
          project.updated_at desc
        """,
        (workspace_id, include_internal),
    ).fetchall()


def create_project(conn, context, user_id: UUID, payload: dict[str, Any]):
    return conn.execute(
        """
        insert into projects (
          tenant_organization_id, workspace_id, organization_id, name, code, project_type,
          status, owner_user_id, start_at, due_at, cadence_days, client_visible, objective, created_by
        ) values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        returning *
        """,
        (
            context["tenant_organization_id"], context["workspace_id"], context["subject_organization_id"],
            payload["name"], payload.get("code"), payload["project_type"], payload["status"],
            payload.get("owner_user_id"), payload.get("start_at"), payload.get("due_at"),
            payload.get("cadence_days"), payload["client_visible"], payload.get("objective"), user_id,
        ),
    ).fetchone()


def update_project(conn, project_id: UUID, updates: dict[str, Any]):
    return _dynamic_update(conn, "projects", project_id, updates)


def create_contract(conn, project_id: UUID, user_id: UUID, payload: dict[str, Any]):
    return conn.execute(
        """
        insert into project_contracts (
          project_id, version, title, status, starts_at, ends_at, total_value, currency,
          source_provider, external_id, signed_at, client_visible, created_by
        ) values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        returning *
        """,
        (
            project_id, payload["version"], payload["title"], payload["status"],
            payload.get("starts_at"), payload.get("ends_at"), payload.get("total_value"),
            payload["currency"], payload.get("source_provider"), payload.get("external_id"),
            payload.get("signed_at"), payload["client_visible"], user_id,
        ),
    ).fetchone()


def find_contract_context(conn, contract_id: UUID, is_admin: bool, user_id: UUID):
    return conn.execute(
        """
        select contract.*, project.workspace_id, project.organization_id, project.tenant_organization_id,
          case when %s then 'platform_admin' else workspace_access_role(project.workspace_id, %s) end as access_role
        from project_contracts contract
        join projects project on project.id = contract.project_id
        where contract.id = %s
          and (%s or workspace_access_role(project.workspace_id, %s) is not null)
        """,
        (is_admin, user_id, contract_id, is_admin, user_id),
    ).fetchone()


def update_contract(conn, contract_id: UUID, updates: dict[str, Any]):
    return _dynamic_update(conn, "project_contracts", contract_id, updates)


def create_scope_item(conn, contract_id: UUID, payload: dict[str, Any]):
    return conn.execute(
        """
        insert into contract_scope_items (
          contract_id, title, description, quantity, unit, cadence, cadence_days,
          acceptance_required, acceptance_criteria, client_visible, status
        ) values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        returning *
        """,
        (
            contract_id, payload["title"], payload.get("description"), payload["quantity"],
            payload["unit"], payload["cadence"], payload.get("cadence_days"),
            payload["acceptance_required"], payload.get("acceptance_criteria"),
            payload["client_visible"], payload["status"],
        ),
    ).fetchone()


def find_scope_context(conn, scope_item_id: UUID, is_admin: bool, user_id: UUID):
    return conn.execute(
        """
        select scope.*, contract.project_id, project.workspace_id, project.organization_id,
          case when %s then 'platform_admin' else workspace_access_role(project.workspace_id, %s) end as access_role
        from contract_scope_items scope
        join project_contracts contract on contract.id = scope.contract_id
        join projects project on project.id = contract.project_id
        where scope.id = %s
          and (%s or workspace_access_role(project.workspace_id, %s) is not null)
        """,
        (is_admin, user_id, scope_item_id, is_admin, user_id),
    ).fetchone()


def update_scope_item(conn, scope_item_id: UUID, updates: dict[str, Any]):
    return _dynamic_update(conn, "contract_scope_items", scope_item_id, updates)


def create_deliverable(conn, project, payload: dict[str, Any]):
    return conn.execute(
        """
        insert into deliverables (organization_id, project_id, scope_item_id, phase_id, title, status, due_at, completed_at)
        values (%s, %s, %s, %s, %s, %s, %s, case when %s = 'done' then now() else null end)
        returning id, project_id, scope_item_id, phase_id, title, status, due_at, completed_at, updated_at
        """,
        (
            project["organization_id"], project["id"], payload.get("scope_item_id"), payload.get("phase_id"),
            payload["title"], payload["status"], payload.get("due_at"), payload["status"],
        ),
    ).fetchone()


def list_contracts(conn, project_id: UUID, include_internal: bool):
    return conn.execute(
        """
        select * from project_contracts
        where project_id = %s and (%s or client_visible)
        order by version desc
        """,
        (project_id, include_internal),
    ).fetchall()


def list_scope_items(conn, project_id: UUID, include_internal: bool):
    return conn.execute(
        """
        select scope.*,
          count(distinct deliverable.id) filter (where deliverable.status = 'done')::int as delivered_total,
          count(distinct deliverable.id) filter (
            where approval.status = 'approved'
          )::int as accepted_total
        from contract_scope_items scope
        join project_contracts contract on contract.id = scope.contract_id
        left join deliverables deliverable on deliverable.scope_item_id = scope.id
        left join approvals approval on approval.deliverable_id = deliverable.id
        where contract.project_id = %s and (%s or (contract.client_visible and scope.client_visible))
        group by scope.id
        order by scope.created_at
        """,
        (project_id, include_internal),
    ).fetchall()


def list_deliverables(conn, project_id: UUID, include_internal: bool):
    return conn.execute(
        """
        select deliverable.id, deliverable.project_id, deliverable.scope_item_id, deliverable.phase_id, deliverable.title,
          deliverable.status, deliverable.due_at, deliverable.completed_at, deliverable.updated_at,
          approval.status as approval_status
        from deliverables deliverable
        left join project_phases phase on phase.id = deliverable.phase_id
        left join lateral (
          select status from approvals
          where deliverable_id = deliverable.id
          order by created_at desc limit 1
        ) approval on true
        where deliverable.project_id = %s and (%s or phase.id is null or phase.client_visible)
        order by deliverable.due_at nulls last, deliverable.created_at
        """,
        (project_id, include_internal),
    ).fetchall()


def find_phase_context(conn, phase_id: UUID, is_admin: bool, user_id: UUID):
    return conn.execute(
        """
        select phase.*, project.workspace_id, project.organization_id,
          case when %s then 'platform_admin' else workspace_access_role(project.workspace_id, %s) end as access_role
        from project_phases phase
        join projects project on project.id = phase.project_id
        where phase.id = %s
          and (%s or workspace_access_role(project.workspace_id, %s) is not null)
        """,
        (is_admin, user_id, phase_id, is_admin, user_id),
    ).fetchone()


def list_phases(conn, project_id: UUID, include_internal: bool):
    return conn.execute(
        """
        select phase.*, count(deliverable.id)::int as deliverables_total,
          count(deliverable.id) filter (where deliverable.status = 'done')::int as deliverables_done
        from project_phases phase
        left join deliverables deliverable on deliverable.phase_id = phase.id
        where phase.project_id = %s and (%s or phase.client_visible)
        group by phase.id
        order by phase.sequence
        """,
        (project_id, include_internal),
    ).fetchall()


def create_phase(conn, project_id: UUID, payload: dict[str, Any]):
    return conn.execute(
        """
        insert into project_phases (
          project_id, sequence, name, description, status, client_summary, client_visible, starts_at, due_at
        ) values (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        returning *
        """,
        (project_id, payload["sequence"], payload["name"], payload.get("description"), payload["status"],
         payload.get("client_summary"), payload["client_visible"], payload.get("starts_at"), payload.get("due_at")),
    ).fetchone()


def update_phase(conn, phase_id: UUID, updates: dict[str, Any]):
    if updates.get("status") == "released":
        updates = {**updates, "released_at": "now()"}
    assignments = []
    values: list[Any] = []
    for column, value in updates.items():
        if column == "released_at" and value == "now()":
            assignments.append("released_at = now()")
        else:
            assignments.append(f"{column} = %s")
            values.append(value)
    if not assignments:
        return conn.execute("select * from project_phases where id = %s", (phase_id,)).fetchone()
    return conn.execute(
        f"update project_phases set {', '.join(assignments)}, updated_at = now() where id = %s returning *",
        tuple(values) + (phase_id,),
    ).fetchone()


def list_documents(conn, project_id: UUID, include_internal: bool):
    return conn.execute(
        """
        select id, project_id, kind, title, url, client_visible, created_at
        from project_documents
        where project_id = %s and (%s or client_visible)
        order by created_at desc
        """,
        (project_id, include_internal),
    ).fetchall()


def create_document(conn, project_id: UUID, user_id: UUID, payload: dict[str, Any]):
    return conn.execute(
        """
        insert into project_documents (project_id, kind, title, url, client_visible, created_by)
        values (%s, %s, %s, %s, %s, %s) returning *
        """,
        (project_id, payload["kind"], payload["title"], payload["url"], payload["client_visible"], user_id),
    ).fetchone()


def list_updates(conn, project_id: UUID, include_internal: bool):
    return conn.execute(
        """
        select id, project_id, phase_id, kind, summary, detail, client_visible, created_at
        from project_updates
        where project_id = %s and (%s or client_visible)
        order by created_at desc
        limit 100
        """,
        (project_id, include_internal),
    ).fetchall()


def create_project_update(conn, project_id: UUID, user_id: UUID, payload: dict[str, Any]):
    return conn.execute(
        """
        insert into project_updates (project_id, phase_id, kind, summary, detail, client_visible, created_by)
        values (%s, %s, %s, %s, %s, %s, %s) returning *
        """,
        (project_id, payload.get("phase_id"), payload["kind"], payload["summary"],
         payload.get("detail"), payload["client_visible"], user_id),
    ).fetchone()


def user_belongs_to_workspace(conn, workspace_id: UUID, user_id: UUID) -> bool:
    return bool(conn.execute("select workspace_access_role(%s, %s) is not null as allowed", (workspace_id, user_id)).fetchone()["allowed"])


def write_audit(conn, actor_user_id: UUID, organization_id: UUID, event_type: str, metadata: dict[str, Any]):
    conn.execute(
        "insert into audit_logs (actor_user_id, organization_id, event_type, metadata) values (%s, %s, %s, %s)",
        (actor_user_id, organization_id, event_type, Jsonb(metadata)),
    )


def _dynamic_update(conn, table: str, entity_id: UUID, updates: dict[str, Any]):
    if not updates:
        return conn.execute(f"select * from {table} where id = %s", (entity_id,)).fetchone()
    columns = ", ".join(f"{column} = %s" for column in updates)
    return conn.execute(
        f"update {table} set {columns}, updated_at = now() where id = %s returning *",
        tuple(updates.values()) + (entity_id,),
    ).fetchone()
