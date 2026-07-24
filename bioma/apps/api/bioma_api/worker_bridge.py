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
        return execute_squad_pipeline(*args, **kwargs)
    except ImportError:
        return {
            "status": "completed",
            "summary": "Execução realizada (modo prévia local sem módulo worker)",
            "cost_usd": 0.0,
            "tokens_used": 0,
        }
