from pathlib import Path
import os
import sys

import httpx

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bioma_api.config import get_settings  # noqa: E402
from bioma_api.integrations.clickup import sync_clickup_folder  # noqa: E402


def main() -> None:
    os.environ.pop("CLICKUP_API_TOKEN", None)
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
                            "status": {"status": "in progress"},
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
                            "status": {"status": "done"},
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
    assert summary["writes_to_clickup"] is False

    os.environ.pop("CLICKUP_API_TOKEN", None)
    get_settings.cache_clear()
    print("clickup smoke ok")


if __name__ == "__main__":
    main()
