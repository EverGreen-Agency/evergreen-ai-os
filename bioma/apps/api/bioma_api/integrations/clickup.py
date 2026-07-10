from typing import Any
from collections.abc import Sequence
from datetime import datetime, timezone

import httpx

from bioma_api.config import get_settings


def sync_clickup_folder(
    folder_id: str | None,
    mapped_list_ids: Sequence[str] | None = None,
    http_client: httpx.Client | None = None,
) -> tuple[str, dict[str, Any]]:
    settings = get_settings()
    list_ids = [list_id for list_id in (mapped_list_ids or []) if list_id]

    if not folder_id and not list_ids:
        return "partial", {
            "mode": "not_configured",
            "reason": "missing_clickup_folder_or_list_mapping",
        }

    if not settings.clickup_api_token:
        return "partial", {
            "mode": "dry_run",
            "reason": "missing_clickup_api_token",
            "folder_id": folder_id,
            "mapped_list_ids": list_ids,
            "writes_to_clickup": False,
        }

    owns_client = http_client is None
    client = http_client or httpx.Client(timeout=20)
    try:
        lists = _resolve_lists(client, settings.clickup_api_base_url, settings.clickup_api_token, folder_id, list_ids)
        tasks = _fetch_tasks(client, settings.clickup_api_base_url, settings.clickup_api_token, lists, settings.clickup_task_page_limit)
    except httpx.HTTPError as exc:
        return "error", {
            "mode": "live",
            "folder_id": folder_id,
            "mapped_list_ids": list_ids,
            "error": str(exc),
            "writes_to_clickup": False,
        }
    finally:
        if owns_client:
            client.close()

    return "ok", {
        "mode": "live",
        "folder_id": folder_id,
        "mapped_list_ids": list_ids,
        "lists": len(lists),
        "list_names": [item.get("name") for item in lists[:10]],
        "tasks_count": len(tasks),
        "tasks": tasks,
        "writes_to_clickup": False,
    }


def _resolve_lists(
    client: httpx.Client,
    base_url: str,
    token: str,
    folder_id: str | None,
    mapped_list_ids: list[str],
) -> list[dict[str, Any]]:
    if mapped_list_ids:
        return [{"id": list_id, "name": None, "source": "mapping"} for list_id in mapped_list_ids]

    response = client.get(
        f"{base_url}/folder/{folder_id}/list",
        headers={"Authorization": token},
    )
    response.raise_for_status()
    payload = response.json()
    return [
        {"id": item.get("id"), "name": item.get("name"), "source": "folder"}
        for item in payload.get("lists", [])
        if item.get("id")
    ]


def _fetch_tasks(
    client: httpx.Client,
    base_url: str,
    token: str,
    lists: list[dict[str, Any]],
    page_limit: int,
) -> list[dict[str, Any]]:
    tasks: list[dict[str, Any]] = []
    for list_item in lists:
        list_id = list_item["id"]
        for page in range(max(page_limit, 1)):
            response = client.get(
                f"{base_url}/list/{list_id}/task",
                headers={"Authorization": token},
                params={"archived": "false", "include_closed": "true", "page": page},
            )
            response.raise_for_status()
            payload = response.json()
            page_tasks = payload.get("tasks", [])
            tasks.extend(_normalize_task(task, list_item) for task in page_tasks)
            if len(page_tasks) < 100:
                break
    return tasks


def _normalize_task(task: dict[str, Any], list_item: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": task.get("id"),
        "name": task.get("name"),
        "status": _status_name(task.get("status")),
        "url": task.get("url"),
        "due_at": _clickup_ms_to_iso(task.get("due_date")),
        "list_id": list_item.get("id"),
        "list_name": list_item.get("name"),
    }


def _status_name(status: Any) -> str | None:
    if isinstance(status, dict):
        value = status.get("status") or status.get("type")
        return str(value) if value else None
    if status:
        return str(status)
    return None


def _clickup_ms_to_iso(value: Any) -> str | None:
    if value in (None, ""):
        return None
    try:
        return datetime.fromtimestamp(int(value) / 1000, tz=timezone.utc).isoformat()
    except (TypeError, ValueError):
        return None
