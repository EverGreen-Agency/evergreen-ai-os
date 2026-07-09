from datetime import datetime, timezone

from fastapi import APIRouter


router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def healthcheck() -> dict[str, str]:
    return {
        "status": "ok",
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }
