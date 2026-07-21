"""Importação ClickUp -> Bioma, explícita por tenant e idempotente por ID externo.

Cada pasta é uma unidade transacional independente. O script nunca escreve no
ClickUp e exige token, Workspace ClickUp e tenant Bioma via argumento/env.
"""

import argparse
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

import httpx

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bioma_api.config import get_settings  # noqa: E402
from bioma_api.db import connect  # noqa: E402


def require_value(value: str | None, name: str) -> str:
    if not value:
        raise SystemExit(f"{name} is required for the live ClickUp import.")
    return value


def slugify(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return normalized or "workspace"


def operation_from_name(value: str) -> str:
    name = value.lower()
    if any(token in name for token in ("social", "conteúdo", "conteudo", "editorial")):
        return "social"
    if any(token in name for token in ("growth", "tráfego", "trafego", "mídia", "midia")):
        return "growth"
    if any(token in name for token in ("tech", "engenharia", "dev", "site")):
        return "tech"
    return "general"


def group_status(value: str) -> str:
    status_name = value.strip().lower()
    if status_name in {"done", "completed", "finalizado", "publicado", "ready for release"}:
        return "DONE"
    if status_name in {"closed", "descartado"}:
        return "CLOSED"
    if status_name in {
        "in progress", "em produção", "roteirização", "em ajuste", "revisão interna", "aprovação cliente"
    }:
        return "ACTIVE"
    return "NOT_STARTED"


def due_date(value) -> datetime | None:
    if value in (None, ""):
        return None
    try:
        return datetime.fromtimestamp(int(value) / 1000, tz=timezone.utc)
    except (TypeError, ValueError):
        return None


def priority(value) -> str | None:
    if not value:
        return None
    return {"1": "Alta", "2": "Alta", "3": "Média", "4": "Baixa"}.get(str(value.get("id")))


def custom_field_value(field) -> str | None:
    value = field.get("value")
    if value is None:
        return None
    options = field.get("type_config", {}).get("options", [])
    if field.get("type") == "drop_down" and isinstance(value, int):
        option = next((item for item in options if item.get("orderindex") == value), None)
        return (option or {}).get("name") or (option or {}).get("label")
    if isinstance(value, list):
        labels = [
            option.get("name") or option.get("label")
            for item in value
            for option in options
            if option.get("id") == item or str(option.get("orderindex")) == str(item)
        ]
        return ", ".join(label for label in labels if label) or None
    return str(value)


def fetch_json(client: httpx.Client, path: str, token: str) -> dict:
    response = client.get(path, headers={"Authorization": token})
    response.raise_for_status()
    return response.json()


def collect_folder_units(client: httpx.Client, base_url: str, team_id: str, token: str) -> list[dict]:
    units: list[dict] = []
    spaces = fetch_json(client, f"{base_url}/team/{team_id}/space", token).get("spaces", [])
    for space in spaces:
        folders = fetch_json(client, f"{base_url}/space/{space['id']}/folder", token).get("folders", [])
        for folder in folders:
            lists = fetch_json(client, f"{base_url}/folder/{folder['id']}/list", token).get("lists", [])
            hydrated_lists = []
            for task_list in lists:
                tasks = fetch_json(
                    client,
                    f"{base_url}/list/{task_list['id']}/task?include_subtasks=true&include_closed=true",
                    token,
                ).get("tasks", [])
                hydrated_lists.append({**task_list, "tasks": tasks})
            units.append({"space": space, "folder": folder, "lists": hydrated_lists})
    return units


def ensure_tenant(conn, tenant_id: UUID) -> None:
    row = conn.execute(
        "select id from organizations where id = %s and type in ('eg', 'agency')",
        (tenant_id,),
    ).fetchone()
    if not row:
        raise RuntimeError("Tenant Bioma não encontrado ou não é uma agência.")


def unique_slug(conn, tenant_id: UUID, name: str) -> str:
    base = f"{str(tenant_id)[:8]}-{slugify(name)}"[:55]
    candidate = base
    counter = 2
    while conn.execute("select 1 from organizations where slug = %s", (candidate,)).fetchone():
        candidate = f"{base[:50]}-{counter}"
        counter += 1
    return candidate


def ensure_workspace(conn, tenant_id: UUID, folder: dict) -> dict:
    folder_id = str(folder["id"])
    row = conn.execute(
        """
        select c.id as client_id, c.organization_id, w.id as workspace_id
        from clients c
        join organizations o on o.id = c.organization_id and o.parent_organization_id = %s
        join workspaces w on w.subject_organization_id = o.id and w.tenant_organization_id = %s
        where c.clickup_folder_id = %s
        """,
        (tenant_id, tenant_id, folder_id),
    ).fetchone()
    if row:
        conn.execute(
            "update clients set name = %s, updated_at = now() where id = %s",
            (folder["name"].strip(), row["client_id"]),
        )
        conn.execute(
            "update workspaces set name = %s, status = 'active', updated_at = now() where id = %s",
            (folder["name"].strip(), row["workspace_id"]),
        )
        return dict(row)

    name = folder["name"].strip()
    workspace_slug = f"{slugify(name)[:48]}-{folder_id}"[:80]
    organization_id = conn.execute(
        """
        insert into organizations (name, slug, type, parent_organization_id)
        values (%s, %s, 'client', %s) returning id
        """,
        (name, unique_slug(conn, tenant_id, name), tenant_id),
    ).fetchone()["id"]
    client_id = conn.execute(
        """
        insert into clients (organization_id, name, status, responsible_name, clickup_folder_id)
        values (%s, %s, 'active', 'EverGreen', %s) returning id
        """,
        (organization_id, name, folder_id),
    ).fetchone()["id"]
    workspace_id = conn.execute(
        """
        insert into workspaces (tenant_organization_id, subject_organization_id, kind, name, slug, status)
        values (%s, %s, 'client', %s, %s, 'active') returning id
        """,
        (tenant_id, organization_id, name, workspace_slug),
    ).fetchone()["id"]
    return {"client_id": client_id, "organization_id": organization_id, "workspace_id": workspace_id}


def upsert_list(conn, workspace_id: UUID, task_list: dict) -> UUID:
    return conn.execute(
        """
        insert into eg_task_lists (workspace_id, name, type, external_source, external_id)
        values (%s, %s, %s, 'clickup', %s)
        on conflict (workspace_id, external_source, external_id)
          where external_source is not null and external_id is not null
        do update set name = excluded.name, type = excluded.type, updated_at = now()
        returning id
        """,
        (workspace_id, task_list["name"], operation_from_name(task_list["name"]), str(task_list["id"])),
    ).fetchone()["id"]


def upsert_task(conn, list_id: UUID, task: dict) -> UUID:
    status_name = str((task.get("status") or {}).get("status") or "pending")
    return conn.execute(
        """
        insert into eg_tasks (
          list_id, title, description, status, group_status, priority, due_date, recurrence,
          external_source, external_id
        ) values (%s, %s, %s, %s, %s, %s, %s, 'none', 'clickup', %s)
        on conflict (list_id, external_source, external_id)
          where external_source is not null and external_id is not null
        do update set title = excluded.title, description = excluded.description,
          status = excluded.status, group_status = excluded.group_status,
          priority = excluded.priority, due_date = excluded.due_date, updated_at = now()
        returning id
        """,
        (
            list_id,
            task.get("name") or "Tarefa sem título",
            task.get("text_content") or task.get("description") or "",
            status_name,
            group_status(status_name),
            priority(task.get("priority")),
            due_date(task.get("due_date")),
            str(task["id"]),
        ),
    ).fetchone()["id"]


def replace_custom_fields(conn, task_id: UUID, fields: list[dict]) -> None:
    conn.execute("delete from eg_task_custom_fields where task_id = %s", (task_id,))
    for field in fields:
        value = custom_field_value(field)
        if value:
            conn.execute(
                "insert into eg_task_custom_fields (task_id, field_name, field_value) values (%s, %s, %s)",
                (task_id, field.get("name") or "Campo ClickUp", value),
            )


def upsert_subtask(conn, parent_task_id: UUID, task: dict) -> None:
    conn.execute(
        """
        insert into eg_task_subtasks (
          task_id, title, is_completed, external_source, external_id
        ) values (%s, %s, %s, 'clickup', %s)
        on conflict (task_id, external_source, external_id)
          where external_source is not null and external_id is not null
        do update set title = excluded.title, is_completed = excluded.is_completed, updated_at = now()
        """,
        (
            parent_task_id,
            task.get("name") or "Subtarefa sem título",
            group_status(str((task.get("status") or {}).get("status") or "")) in {"DONE", "CLOSED"},
            str(task["id"]),
        ),
    )


def import_unit(tenant_id: UUID, unit: dict) -> int:
    with connect() as conn:
        ensure_tenant(conn, tenant_id)
        workspace = ensure_workspace(conn, tenant_id, unit["folder"])
        imported = 0
        external_to_local: dict[str, UUID] = {}
        deferred_subtasks: list[dict] = []
        for task_list in unit["lists"]:
            list_id = upsert_list(conn, workspace["workspace_id"], task_list)
            for task in task_list["tasks"]:
                if task.get("parent"):
                    deferred_subtasks.append(task)
                    continue
                task_id = upsert_task(conn, list_id, task)
                external_to_local[str(task["id"])] = task_id
                replace_custom_fields(conn, task_id, task.get("custom_fields") or [])
                imported += 1
        for subtask in deferred_subtasks:
            parent_id = external_to_local.get(str(subtask.get("parent")))
            if parent_id:
                upsert_subtask(conn, parent_id, subtask)
                imported += 1
        conn.execute(
            """
            insert into audit_logs (organization_id, event_type, metadata)
            values (%s, 'clickup.imported', jsonb_build_object(
              'folder_id', %s::text, 'lists', %s::int, 'tasks', %s::int, 'writes_to_clickup', false
            ))
            """,
            (workspace["organization_id"], str(unit["folder"]["id"]), len(unit["lists"]), imported),
        )
        return imported


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tenant-id", default=os.environ.get("BIOMA_TENANT_ORGANIZATION_ID"))
    parser.add_argument("--team-id", default=os.environ.get("CLICKUP_TEAM_ID"))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    tenant_id = UUID(require_value(args.tenant_id, "BIOMA_TENANT_ORGANIZATION_ID/--tenant-id"))
    team_id = require_value(args.team_id, "CLICKUP_TEAM_ID/--team-id")
    settings = get_settings()
    token = require_value(settings.clickup_api_token, "CLICKUP_API_TOKEN")
    with httpx.Client(timeout=30) as client:
        units = collect_folder_units(client, settings.clickup_api_base_url, team_id, token)
    failures = []
    imported = 0
    for unit in units:
        try:
            imported += import_unit(tenant_id, unit)
            print(f"OK folder={unit['folder']['id']} lists={len(unit['lists'])}")
        except Exception as exc:  # unidade isolada: as demais continuam, mas o processo falha ao final
            failures.append((unit["folder"]["id"], type(exc).__name__))
            print(f"ERROR folder={unit['folder']['id']} type={type(exc).__name__}", file=sys.stderr)
    if failures:
        raise SystemExit(f"ClickUp import failed for {len(failures)} folder unit(s).")
    print(f"ClickUp projection complete: folders={len(units)} items={imported} writes_to_clickup=false")


if __name__ == "__main__":
    main()
