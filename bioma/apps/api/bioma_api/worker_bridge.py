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
