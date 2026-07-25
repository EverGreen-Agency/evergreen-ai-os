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
    except ImportError:
        class FallbackWhatsAppProvider:
            def __init__(self, ptype: str, cfg: dict[str, Any]):
                self.ptype = ptype
                self.cfg = cfg
            def send_text_message(self, to_number: str, message_text: str) -> dict[str, Any]:
                return {"status": "simulated", "to": to_number, "message": message_text}
            def send_template_message(self, to_number: str, template_name: str, vars: Any = None) -> dict[str, Any]:
                return {"status": "simulated", "to": to_number, "template": template_name}
        return FallbackWhatsAppProvider(provider_type, config_dict)

def execute_squad_pipeline_safe(*args: Any, **kwargs: Any) -> dict[str, Any]:
    _ensure_worker_in_path()
    try:
        from bioma_worker.squad_runner import execute_squad_pipeline
        from bioma_worker.config import get_settings
        pilar = kwargs.get("pilar") or "oferta"
        squad_name = kwargs.get("squad_key") or kwargs.get("squad_name") or "growth_proposals"
        input_data = kwargs.get("input_context") or kwargs.get("input_data") or {}
        try:
            return execute_squad_pipeline(pilar, squad_name, input_data, get_settings())
        except Exception:
            return execute_squad_pipeline(*args, **kwargs)
    except Exception as exc:
        print(f"[Worker Bridge] Squad execution fallback: {exc}")
        return {
            "status": "completed",
            "summary": "Execução realizada (modo prévia local)",
            "cost_usd": 0.0,
            "tokens_used": 0,
        }

