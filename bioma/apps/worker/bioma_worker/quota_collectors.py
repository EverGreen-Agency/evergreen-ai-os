import json
import queue
import subprocess
import threading
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any


class QuotaCollectionError(RuntimeError):
    pass


def _epoch_to_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    try:
        return datetime.fromtimestamp(int(value), tz=timezone.utc)
    except (TypeError, ValueError, OSError):
        return None


def parse_codex_rate_limits(result: dict[str, Any]) -> list[dict[str, Any]]:
    buckets: list[dict[str, Any]] = []
    snapshots: list[tuple[str, dict[str, Any]]] = []
    if isinstance(result.get("rateLimits"), dict):
        snapshots.append(("default", result["rateLimits"]))
    for limit_id, snapshot in (result.get("rateLimitsByLimitId") or {}).items():
        if isinstance(snapshot, dict):
            snapshots.append((str(limit_id), snapshot))
    measured_at = datetime.now(timezone.utc)
    seen: set[tuple[str, str, int | None]] = set()
    for limit_id, snapshot in snapshots:
        for window_name in ("primary", "secondary"):
            window = snapshot.get(window_name)
            if not isinstance(window, dict):
                continue
            duration = window.get("windowDurationMins")
            dedupe_key = (limit_id, window_name, duration)
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)
            used = Decimal(str(window["usedPercent"])) if window.get("usedPercent") is not None else None
            buckets.append(
                {
                    "bucket_key": f"codex:{limit_id}:{window_name}",
                    "scope": "model_family" if limit_id != "default" else "account",
                    "model_id": None if limit_id == "default" else limit_id,
                    "total_units": None,
                    "used_units": None,
                    "used_percent": used,
                    "remaining_percent": Decimal("100") - used if used is not None else None,
                    "unit": "percent",
                    "window_duration_minutes": duration,
                    "resets_at": _epoch_to_datetime(window.get("resetsAt")),
                    "source": "provider_api",
                    "confidence": "authoritative",
                    "measured_at": measured_at,
                    "raw_metadata": {
                        "limit_id": limit_id,
                        "window": window_name,
                        "plan_type": snapshot.get("planType"),
                        "rate_limit_reached_type": snapshot.get("rateLimitReachedType"),
                    },
                    "notes": "Coletado do contrato estável account/rateLimits/read do Codex App Server.",
                }
            )
    reset_credits = result.get("rateLimitResetCredits")
    if isinstance(reset_credits, dict) and reset_credits.get("availableCount") is not None:
        buckets.append(
            {
                "bucket_key": "codex:rate-limit-reset-credits",
                "scope": "credits",
                "model_id": None,
                "total_units": Decimal(str(reset_credits["availableCount"])),
                "used_units": Decimal("0"),
                "used_percent": None,
                "remaining_percent": None,
                "unit": "resets",
                "window_duration_minutes": None,
                "resets_at": None,
                "source": "provider_api",
                "confidence": "authoritative",
                "measured_at": measured_at,
                "raw_metadata": {"credits": reset_credits.get("credits")},
                "notes": "availableCount é o total autoritativo; a lista de créditos pode ser limitada pelo backend.",
            }
        )
    if not buckets:
        raise QuotaCollectionError("Codex App Server respondeu sem janelas de cota disponíveis.")
    return buckets


def _reader(stream, output: queue.Queue) -> None:
    try:
        for line in iter(stream.readline, ""):
            if not line:
                break
            try:
                output.put(json.loads(line))
            except json.JSONDecodeError:
                continue
    finally:
        output.put(None)


def _response_for(output: queue.Queue, request_id: int, timeout_seconds: int) -> dict[str, Any]:
    while True:
        try:
            message = output.get(timeout=timeout_seconds)
        except queue.Empty as exc:
            raise QuotaCollectionError("Timeout aguardando resposta do Codex App Server.") from exc
        if message is None:
            raise QuotaCollectionError("Codex App Server encerrou antes de responder.")
        if message.get("id") != request_id:
            continue
        if message.get("error"):
            error = message["error"]
            raise QuotaCollectionError(f"Codex App Server recusou a coleta: {error.get('message', error)}")
        return message.get("result") or {}


def collect_codex_rate_limits(binary: str, timeout_seconds: int = 30) -> list[dict[str, Any]]:
    try:
        process = subprocess.Popen(
            [binary, "app-server"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            shell=False,
        )
    except FileNotFoundError as exc:
        raise QuotaCollectionError(f"Executável Codex não encontrado: {binary}") from exc
    if process.stdin is None or process.stdout is None:
        process.kill()
        raise QuotaCollectionError("Não foi possível abrir o transporte stdio do Codex App Server.")
    messages: queue.Queue = queue.Queue()
    threading.Thread(target=_reader, args=(process.stdout, messages), daemon=True).start()

    def send(message: dict[str, Any]) -> None:
        process.stdin.write(json.dumps(message, separators=(",", ":")) + "\n")
        process.stdin.flush()

    try:
        send(
            {
                "method": "initialize",
                "id": 1,
                "params": {
                    "clientInfo": {
                        "name": "bioma_ai_control_plane",
                        "title": "Bioma AI Control Plane",
                        "version": "0.1.0",
                    }
                },
            }
        )
        _response_for(messages, 1, timeout_seconds)
        send({"method": "initialized", "params": {}})
        send({"method": "account/rateLimits/read", "id": 2})
        result = _response_for(messages, 2, timeout_seconds)
        return parse_codex_rate_limits(result)
    finally:
        try:
            process.stdin.close()
        except OSError:
            pass
        try:
            process.terminate()
            process.wait(timeout=3)
        except (OSError, subprocess.TimeoutExpired):
            process.kill()
