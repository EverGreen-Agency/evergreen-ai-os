import json
from datetime import datetime, timedelta, timezone

from bioma_worker.ai_providers import parse_claude_json, parse_codex_jsonl
from bioma_worker.ai_routing import rank_candidates
from bioma_worker.quota_collectors import parse_codex_rate_limits


def test_codex_quota_parser_preserva_janelas_e_reset_credit():
    buckets = parse_codex_rate_limits(
        {
            "rateLimits": {
                "primary": {"usedPercent": 25, "windowDurationMins": 300, "resetsAt": 1785000000},
                "secondary": {"usedPercent": 60, "windowDurationMins": 10080, "resetsAt": 1785600000},
                "planType": "pro",
            },
            "rateLimitResetCredits": {"availableCount": 2, "credits": []},
        }
    )
    assert [(bucket["window_duration_minutes"], bucket["remaining_percent"]) for bucket in buckets[:2]] == [
        (300, 75),
        (10080, 40),
    ]
    assert buckets[2]["total_units"] == 2
    assert buckets[2]["remaining_percent"] is None


def test_codex_exec_parser_le_mensagem_e_tokens():
    raw = "\n".join(
        [
            json.dumps({"type": "thread.started", "thread_id": "thr_1"}),
            json.dumps({"type": "item.completed", "item": {"type": "agent_message", "text": "Entrega"}}),
            json.dumps({"type": "turn.completed", "usage": {"input_tokens": 10, "output_tokens": 5, "cached_input_tokens": 2}}),
        ]
    )
    result = parse_codex_jsonl(raw)
    assert result["text"] == "Entrega"
    assert result["external_event_id"] == "thr_1"
    assert result["usage"] == {"input_units": 10, "output_units": 5, "cached_units": 2}


def test_claude_parser_nao_inventa_custo_e_converte_quando_fornecido():
    result = parse_claude_json(
        json.dumps(
            {
                "result": "Roteiro",
                "session_id": "claude_1",
                "usage": {"input_tokens": 20, "output_tokens": 8},
                "total_cost_usd": 0.123,
            }
        )
    )
    assert result["text"] == "Roteiro"
    assert result["cost_cents"] == 12


def _candidate(**overrides):
    row = {
        "account_id": "a",
        "provider": "openai",
        "channel": "codex_chatgpt",
        "account_name": "Codex",
        "auth_mode": "chatgpt",
        "execution_mode": "local_cli",
        "auth_ref": None,
        "account_status": "active",
        "account_capabilities": ["content"],
        "account_settings": {},
        "model_catalog_id": "m",
        "model_id": "model",
        "model_name": "Model",
        "capability_tier": "balanced",
        "model_capabilities": ["content"],
        "quality_score": 90,
        "cost_score": 80,
        "latency_score": 70,
        "priority": 10,
        "policy_id": None,
        "allowed_channels": [],
        "allowed_models": [],
        "preferred_tiers": ["balanced"],
        "quality_weight": 35,
        "quota_weight": 25,
        "cost_weight": 20,
        "reliability_weight": 10,
        "latency_weight": 10,
        "minimum_quota_headroom": 10,
        "requires_human_approval": True,
        "allow_fallback": True,
        "quota_buckets": [],
    }
    row.update(overrides)
    return row


def test_router_bloqueia_cota_baixa_e_cli_antigravity_manual():
    future = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    low_quota = _candidate(
        quota_buckets=[{"remaining_percent": 5, "resets_at": future, "confidence": "authoritative", "model_id": None}]
    )
    antigravity_cli = _candidate(
        account_id="g",
        model_catalog_id="gm",
        channel="antigravity_cli",
        execution_mode="manual_handoff",
    )
    ranked = rank_candidates({"capability": "content"}, [low_quota, antigravity_cli])
    assert all(not candidate["eligible"] for candidate in ranked)
    assert any("cota abaixo" in reason for reason in ranked[0]["reasons"] + ranked[1]["reasons"])
    assert any("headless" in reason for reason in ranked[0]["reasons"] + ranked[1]["reasons"])
