from typing import Any

import httpx

from bioma_api.config import get_settings


def sync_clickup_folder(folder_id: str | None) -> tuple[str, dict[str, Any]]:
    settings = get_settings()
    if not folder_id:
        return "partial", {
            "mode": "not_configured",
            "reason": "missing_clickup_folder_id",
        }

    if not settings.clickup_api_token:
        return "partial", {
            "mode": "dry_run",
            "reason": "missing_clickup_api_token",
            "folder_id": folder_id,
        }

    try:
        with httpx.Client(timeout=15) as client:
            response = client.get(
                f"{settings.clickup_api_base_url}/folder/{folder_id}/list",
                headers={"Authorization": settings.clickup_api_token},
            )
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPError as exc:
        return "error", {
            "mode": "live",
            "folder_id": folder_id,
            "error": str(exc),
        }

    lists = payload.get("lists", [])
    return "ok", {
        "mode": "live",
        "folder_id": folder_id,
        "lists": len(lists),
        "list_names": [item.get("name") for item in lists[:10]],
    }
