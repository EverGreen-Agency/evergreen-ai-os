import sys
from pathlib import Path
from typing import Any

def _ensure_worker_in_path() -> bool:
    base = Path(__file__).resolve()
    for ancestor in [base] + list(base.parents):
        candidates = [
            ancestor / "bioma" / "apps" / "worker",
            ancestor / "apps" / "worker",
            ancestor / "worker",
        ]
        for candidate in candidates:
            if candidate.exists() and (candidate / "bioma_worker").exists():
                if str(candidate) not in sys.path:
                    sys.path.insert(0, str(candidate))
                return True
    return False

def get_whatsapp_provider_safe(provider_type: str, config_dict: dict[str, Any]) -> Any:
    _ensure_worker_in_path()
    try:
        from bioma_worker.providers.whatsapp import get_whatsapp_provider
        return get_whatsapp_provider(provider_type, config_dict)
    except ImportError as exc:
        raise RuntimeError("Provider WhatsApp indisponível no runtime.") from exc

def execute_squad_pipeline_safe(*args: Any, **kwargs: Any) -> dict[str, Any]:
    if not _ensure_worker_in_path():
        raise RuntimeError("Worker do Bioma não encontrado no runtime da API.")
    try:
        from bioma_worker.squad_runner import execute_squad_pipeline
        from bioma_worker.config import get_settings
        pilar = kwargs.get("pilar")
        squad_name = kwargs.get("squad_key") or kwargs.get("squad_name")
        input_data = kwargs.get("input_context") or kwargs.get("input_data") or {}
        if not pilar or not squad_name:
            raise ValueError("pilar e squad_key/squad_name são obrigatórios.")
        return execute_squad_pipeline(pilar, squad_name, input_data, get_settings())
    except Exception as exc:
        raise RuntimeError("Falha ao executar o pipeline do squad.") from exc


def refine_market_sector_safe(request: dict[str, Any]) -> dict[str, Any]:
    if not _ensure_worker_in_path():
        raise RuntimeError("Worker do Bioma não encontrado no runtime da API.")
    try:
        from bioma_worker.config import get_settings
        from bioma_worker.market_research import refine_market_sector

        return refine_market_sector(request, get_settings())
    except Exception as exc:
        raise RuntimeError("Falha ao refinar o setor para pesquisa.") from exc


def search_local_businesses_safe(request: dict[str, Any]) -> dict[str, Any]:
    if not _ensure_worker_in_path():
        raise RuntimeError("Worker do Bioma não encontrado no runtime da API.")
    from bioma_worker.config import get_settings
    from bioma_worker.local_radar import search_local_businesses

    # Sem try/except genérico: o RuntimeError de chave ausente precisa chegar
    # intacto ao serviço para virar um 422 com a mensagem real.
    return search_local_businesses(request, get_settings())


def audit_local_prospect_safe(prospect: dict[str, Any], playbook: dict[str, Any] | None = None) -> dict[str, Any]:
    if not _ensure_worker_in_path():
        raise RuntimeError("Worker do Bioma não encontrado no runtime da API.")
    from bioma_worker.config import get_settings
    from bioma_worker.local_radar import audit_local_prospect

    return audit_local_prospect(prospect, get_settings(), playbook=playbook)


def analyze_sales_live_window_safe(request: dict[str, Any]) -> dict[str, Any]:
    if not _ensure_worker_in_path():
        raise RuntimeError("Worker do Bioma nao encontrado no runtime da API.")
    from bioma_worker.config import get_settings
    from bioma_worker.sales_live import analyze_live_window

    return analyze_live_window(request, get_settings())


def sales_live_suggestion_type(moment: str) -> str:
    if not _ensure_worker_in_path():
        return "question"
    from bioma_worker.sales_live import suggestion_type_for

    return suggestion_type_for(moment)


def list_fathom_meetings_safe(created_after: str | None = None, limit: int = 20) -> list[dict[str, Any]]:
    if not _ensure_worker_in_path():
        raise RuntimeError("Worker do Bioma nao encontrado no runtime da API.")
    from bioma_worker.config import get_settings
    from bioma_worker.providers.fathom import list_meetings

    # Sem try/except generico: o RuntimeError de chave ausente precisa chegar
    # intacto ao servico para virar 422 com a mensagem real.
    return list_meetings(get_settings(), created_after=created_after, limit=limit)


def get_fathom_transcript_safe(recording_id: int | str) -> list[dict[str, Any]]:
    if not _ensure_worker_in_path():
        raise RuntimeError("Worker do Bioma nao encontrado no runtime da API.")
    from bioma_worker.config import get_settings
    from bioma_worker.providers.fathom import get_meeting_transcript

    return get_meeting_transcript(get_settings(), recording_id)


def generate_briefing_draft_safe(dossier: dict[str, Any]) -> dict[str, Any]:
    if not _ensure_worker_in_path():
        raise RuntimeError("Worker do Bioma nao encontrado no runtime da API.")
    from bioma_worker.briefing import generate_briefing_draft
    from bioma_worker.config import get_settings

    return generate_briefing_draft(dossier, get_settings())


def normalize_imported_prospects_safe(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not _ensure_worker_in_path():
        raise RuntimeError("Worker do Bioma não encontrado no runtime da API.")
    from bioma_worker.local_radar import normalize_imported_prospects

    return normalize_imported_prospects(rows)


def generate_market_research_safe(request: dict[str, Any]) -> dict[str, Any]:
    if not _ensure_worker_in_path():
        raise RuntimeError("Worker do Bioma não encontrado no runtime da API.")
    try:
        from bioma_worker.config import get_settings
        from bioma_worker.market_research import generate_market_research

        return generate_market_research(request, get_settings())
    except Exception as exc:
        raise RuntimeError("Falha ao executar a pesquisa de mercado.") from exc
