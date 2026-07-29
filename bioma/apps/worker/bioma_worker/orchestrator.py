from datetime import date, timedelta
from typing import Any

from bioma_worker.config import get_settings
from bioma_worker.db import connect
from bioma_worker.ai_content import generate_content
from bioma_worker import storage


def reclaim_stalled_jobs() -> dict[str, int]:
    """Passe do reaper (QUEUE-001), executado antes de consumir a fila.

    O worker é um processo em lote, não um daemon: rodar aqui garante que todo
    ciclo comece recuperando o que ficou preso, sem exigir agendamento próprio.
    """
    settings = get_settings()
    with connect() as conn:
        return storage.reclaim_stalled_jobs(
            conn,
            settings.job_lease_seconds,
            settings.job_max_attempts,
        )


def run_next_job() -> dict[str, Any] | None:
    with connect() as conn:
        job_type = storage.next_job_type(conn)
    if job_type == "ai_content":
        return run_next_ai_content()
    if job_type == "performance":
        return run_next_sync()
    return None


def run_next_ai_content() -> dict[str, Any] | None:
    with connect() as conn:
        request = storage.claim_next_ai_content(conn)
    if not request:
        return None

    try:
        result = generate_content(request, get_settings())
        with connect() as conn:
            storage.complete_ai_content(conn, request, result)
        return {
            "job": "ai_content",
            "id": str(request["id"]),
            "status": "ready",
            "provider": result["provider"],
            "generation_mode": result["generation_mode"],
        }
    except Exception as exc:  # noqa: BLE001 - job failure must be persisted
        message = _safe_error(exc)
        with connect() as conn:
            storage.fail_ai_content(conn, request, message)
        return {"job": "ai_content", "id": str(request["id"]), "status": "error", "error": message}


def run_next_sync() -> dict[str, Any] | None:
    from bioma_worker.google_client import GoogleApiClient
    import httpx
    with connect() as conn:
        sync_run = storage.claim_next_sync(conn)
    if not sync_run:
        return None

    settings = get_settings()
    google_client = GoogleApiClient(settings)
    date_to = sync_run["date_to"] or date.today()
    date_from = sync_run["date_from"] or (date_to - timedelta(days=30))

    with connect() as conn:
        connections = storage.list_connections(conn, sync_run["client_id"], sync_run["provider"] or "all")

    results: dict[str, dict[str, Any]] = {}
    total_records = 0
    with httpx.Client(timeout=settings.google_request_timeout_seconds) as generic_client:
        for connection in connections:
            provider = connection["provider"]
            result_key = f"{provider}:{connection['external_account_id']}"
            # Renova o lease a cada provider: sem isto, um sync longo seria
            # reenfileirado pelo reaper enquanto ainda está rodando.
            with connect() as conn:
                storage.heartbeat_sync(conn, sync_run["id"])
            try:
                _validate_credentials_reference(connection)
                with connect() as conn:
                    records = _sync_provider(
                        conn,
                        google_client,
                        generic_client,
                        settings,
                        sync_run["client_id"],
                        connection,
                        date_from,
                        date_to,
                    )
                    storage.mark_connection_success(conn, connection["id"])
                results[result_key] = {"provider": provider, "status": "ok", "records": records}
                total_records += records
            except Exception as exc:  # noqa: BLE001 - provider failures must be isolated
                message = _safe_error(exc)
                with connect() as conn:
                    storage.mark_connection_error(conn, connection["id"], message)
                results[result_key] = {
                    "provider": provider,
                    "status": "error",
                    "records": 0,
                    "error": message,
                }

    success_count = sum(1 for result in results.values() if result["status"] == "ok")
    error_count = sum(1 for result in results.values() if result["status"] == "error")
    if success_count and error_count:
        final_status = "partial"
    elif success_count:
        final_status = "ok"
    else:
        final_status = "error"

    summary = {
        "mode": "worker",
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "providers": results,
    }
    error_message = None
    if not connections:
        error_message = "Nenhuma conexão ativa encontrada para a sincronização."
        summary["error"] = error_message
    elif final_status == "error":
        error_message = "Todos os providers falharam; consulte o resumo por provider."

    with connect() as conn:
        storage.complete_sync(
            conn,
            sync_run["id"],
            final_status,
            summary,
            total_records,
            error_code="PROVIDER_SYNC_FAILED" if final_status == "error" else None,
            error_message=error_message,
        )
    return {"id": str(sync_run["id"]), "status": final_status, **summary}


def _sync_provider(
    conn,
    google_client,
    generic_client,
    settings,
    client_id,
    connection,
    date_from: date,
    date_to: date,
) -> int:
    from bioma_worker.providers import (
        adsense, ga4, google_ads, google_business_profile, gtm, hubspot, instagram_organic,
        linkedin_ads, linkedin_organic, meta_ads, rd_station_crm, search_console, tiktok_ads,
        tiktok_organic, youtube_organic,
    )
    provider = connection["provider"]
    if provider == "google_ads":
        return google_ads.sync(conn, google_client, settings, client_id, connection, date_from, date_to)
    if provider == "ga4":
        return ga4.sync(conn, google_client, client_id, connection, date_from, date_to)
    if provider == "search_console":
        return search_console.sync(conn, google_client, client_id, connection, date_from, date_to)
    if provider == "gtm":
        return gtm.sync(conn, google_client, client_id, connection)
    if provider == "meta_ads":
        return meta_ads.sync(conn, generic_client, settings, client_id, connection, date_from, date_to)
    if provider == "linkedin_ads":
        return linkedin_ads.sync(conn, generic_client, settings, client_id, connection, date_from, date_to)
    if provider == "instagram_organic":
        return instagram_organic.sync(conn, generic_client, settings, client_id, connection, date_from, date_to)
    if provider == "google_business_profile":
        return google_business_profile.sync(conn, google_client, client_id, connection, date_from, date_to)
    if provider == "google_adsense":
        return adsense.sync(conn, google_client, client_id, connection, date_from, date_to)
    if provider == "youtube_organic":
        return youtube_organic.sync(conn, generic_client, settings, client_id, connection, date_from, date_to)
    if provider == "tiktok_organic":
        return tiktok_organic.sync(conn, generic_client, settings, client_id, connection, date_from, date_to)
    if provider == "tiktok_ads":
        return tiktok_ads.sync(conn, generic_client, settings, client_id, connection, date_from, date_to)
    if provider == "linkedin_organic":
        return linkedin_organic.sync(conn, generic_client, settings, client_id, connection, date_from, date_to)
    if provider == "rd_station_crm":
        return rd_station_crm.sync(conn, generic_client, settings, client_id, connection, date_from, date_to)
    if provider == "hubspot":
        return hubspot.sync(conn, generic_client, settings, client_id, connection, date_from, date_to)
    raise RuntimeError(f"Provider não suportado: {provider}")


_SUPPORTED_CREDENTIALS_REFS = (
    "env:GOOGLE_SERVICE_ACCOUNT_JSON",
    "env:META_ADS_ACCESS_TOKEN",
    "env:LINKEDIN_ADS_ACCESS_TOKEN",
    "env:INSTAGRAM_ACCESS_TOKEN",
    "env:YOUTUBE_API_KEY",
)


def _validate_credentials_reference(connection: dict[str, Any]) -> None:
    reference = connection.get("credentials_ref")
    if reference and reference not in _SUPPORTED_CREDENTIALS_REFS:
        raise RuntimeError(
            f"credentials_ref não suportado neste ambiente; use um de {_SUPPORTED_CREDENTIALS_REFS} ou integre um cofre."
        )


def _safe_error(exc: Exception) -> str:
    message = str(exc).strip() or exc.__class__.__name__
    return message[:2000]
