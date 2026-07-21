from pathlib import Path
import atexit
import os
import sys
from uuid import uuid4

import httpx

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bioma_api.config import get_settings  # noqa: E402
from bioma_api.db import connect  # noqa: E402
from bioma_api.integrations.clickup import sync_clickup_folder  # noqa: E402
from import_clickup_to_bioma import import_unit  # noqa: E402


def cleanup_import(folder_id: str) -> None:
    with connect() as conn:
        rows = conn.execute(
            "select organization_id from clients where clickup_folder_id = %s",
            (folder_id,),
        ).fetchall()
        for row in rows:
            conn.execute("delete from organizations where id = %s", (row["organization_id"],))


def main() -> None:
    os.environ["CLICKUP_API_TOKEN"] = ""
    get_settings.cache_clear()
    dry_status, dry_summary = sync_clickup_folder("folder-1")
    assert dry_status == "partial"
    assert dry_summary["mode"] == "dry_run"

    os.environ["CLICKUP_API_TOKEN"] = "test-token"
    get_settings.cache_clear()

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["Authorization"] == "test-token"
        if request.url.path == "/api/v2/folder/folder-1/list":
            return httpx.Response(
                200,
                json={
                    "lists": [
                        {"id": "list-social", "name": "Social"},
                        {"id": "list-growth", "name": "Growth"},
                    ]
                },
            )
        if request.url.path == "/api/v2/list/list-social/task":
            return httpx.Response(
                200,
                json={
                    "tasks": [
                        {
                            "id": "task-1",
                            "name": "Post LinkedIn",
                            "status": {"status": "PUBLICADO"},
                            "due_date": "1767225600000",
                            "url": "https://app.clickup.com/t/task-1",
                        }
                    ]
                },
            )
        if request.url.path == "/api/v2/list/list-growth/task":
            return httpx.Response(
                200,
                json={
                    "tasks": [
                        {
                            "id": "task-2",
                            "name": "Revisar funil",
                            "status": {"status": "VALIDAÇÃO"},
                            "due_date": None,
                            "url": "https://app.clickup.com/t/task-2",
                        }
                    ]
                },
            )
        return httpx.Response(404, json={"err": "not found"})

    transport = httpx.MockTransport(handler)
    with httpx.Client(transport=transport, base_url="https://api.clickup.com") as client:
        status, summary = sync_clickup_folder("folder-1", http_client=client)

    assert status == "ok"
    assert summary["mode"] == "live"
    assert summary["lists"] == 2
    assert summary["tasks_count"] == 2
    assert summary["tasks"][0]["id"] == "task-1"
    assert summary["tasks"][0]["operation"] == "social"
    assert summary["tasks"][0]["bioma_status"] == "done"
    assert summary["tasks"][1]["operation"] == "growth"
    assert summary["tasks"][1]["bioma_status"] == "waiting_approval"
    assert summary["writes_to_clickup"] is False

    folder_id = f"smoke-folder-{uuid4().hex[:10]}"
    atexit.register(cleanup_import, folder_id)
    unit = {
        "space": {"id": "smoke-space", "name": "Smoke"},
        "folder": {"id": folder_id, "name": "Cliente Import Smoke"},
        "lists": [
            {
                "id": f"{folder_id}-list",
                "name": "Social",
                "tasks": [
                    {
                        "id": f"{folder_id}-task",
                        "name": "Post idempotente",
                        "status": {"status": "PUBLICADO"},
                        "custom_fields": [{"name": "Canal", "value": "LinkedIn"}],
                    },
                    {
                        "id": f"{folder_id}-subtask",
                        "parent": f"{folder_id}-task",
                        "name": "Revisar copy",
                        "status": {"status": "done"},
                    },
                ],
            }
        ],
    }
    with connect() as conn:
        tenant_id = conn.execute(
            "select id from organizations where slug = 'eg' and type = 'eg' order by created_at limit 1"
        ).fetchone()["id"]

    assert import_unit(tenant_id, unit) == 2
    assert import_unit(tenant_id, unit) == 2
    with connect() as conn:
        imported = conn.execute(
            """
            select c.organization_id, w.tenant_organization_id, count(distinct l.id) as lists,
              count(distinct t.id) as tasks, count(distinct s.id) as subtasks
            from clients c
            join workspaces w on w.subject_organization_id = c.organization_id
            join eg_task_lists l on l.workspace_id = w.id and l.external_source = 'clickup'
            join eg_tasks t on t.list_id = l.id and t.external_source = 'clickup'
            left join eg_task_subtasks s on s.task_id = t.id and s.external_source = 'clickup'
            where c.clickup_folder_id = %s
            group by c.organization_id, w.tenant_organization_id
            """,
            (folder_id,),
        ).fetchone()
    assert imported is not None
    assert imported["tenant_organization_id"] == tenant_id
    assert imported["lists"] == 1
    assert imported["tasks"] == 1
    assert imported["subtasks"] == 1
    cleanup_import(folder_id)
    atexit.unregister(cleanup_import)

    os.environ["CLICKUP_API_TOKEN"] = ""
    get_settings.cache_clear()
    print("clickup smoke ok")


if __name__ == "__main__":
    main()
