"""Versioned, server-owned planning-intake schemas and validation."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from fastapi import HTTPException, status


RETAIL_SCHEMA_KEY = "retail_v1"
RETAIL_SCHEMA_VERSION = 1

MARKETING_GOALS = {
    "none": ("positioning_basics", "first_channels", "first_campaign", "other"),
    "ad_hoc": ("content_consistency", "campaign_calendar", "first_metrics", "other"),
    "recurring_unmeasured": ("measurement_foundation", "funnel_optimization", "content_performance", "other"),
    "measured_strategy": ("automation", "segmentation", "attribution", "other"),
    "advanced_automation": ("personalization_at_scale", "implement_ai_ml", "predictive_marketing", "advanced_omnichannel", "attribution_modeling", "other"),
}

COMMERCIAL_GOALS = {
    "unstructured": ("define_sales_process", "ideal_customer_profile", "basic_scripts", "other"),
    "relationship_led": ("pipeline_visibility", "sales_routine", "lead_qualification", "other"),
    "clear_pipeline": ("crm_implementation", "conversion_metrics", "sales_enablement", "other"),
    "measured_crm": ("sales_automation", "revenue_operations", "forecasting", "other"),
    "advanced_automation": ("sales_intelligence", "predictive_personalization", "nurturing_automation", "advanced_revops", "ai_sales_coaching", "other"),
}

RETAIL_MULTI_FIELDS = {"product_categories", "operating_channels"}
RETAIL_BOOLEAN_FIELDS = {"has_loyalty_program", "has_customer_system"}
RETAIL_REQUIRED_FIELDS = {
    "product_categories", "upsell_cross_sell", "operating_channels", "average_ticket_cents",
    "has_loyalty_program", "campaign_types", "has_customer_system",
    "marketing_maturity", "marketing_goal", "commercial_maturity", "commercial_goal",
}


def allowed_goals(kind: str, maturity: str) -> tuple[str, ...]:
    groups = MARKETING_GOALS if kind == "marketing" else COMMERCIAL_GOALS
    return groups.get(maturity, ())


def form_definition(schema_key: str) -> dict[str, Any]:
    if schema_key != RETAIL_SCHEMA_KEY:
        raise _unprocessable("Variante de planejamento não suportada.")
    return {
        "schema_key": RETAIL_SCHEMA_KEY,
        "schema_version": RETAIL_SCHEMA_VERSION,
        "required_fields": sorted(RETAIL_REQUIRED_FIELDS),
        "marketing_maturities": list(MARKETING_GOALS),
        "commercial_maturities": list(COMMERCIAL_GOALS),
        "marketing_goals_by_maturity": {key: list(value) for key, value in MARKETING_GOALS.items()},
        "commercial_goals_by_maturity": {key: list(value) for key, value in COMMERCIAL_GOALS.items()},
    }


def normalize_answers(schema_key: str, answers: dict[str, Any], *, require_complete: bool) -> tuple[dict[str, Any], dict[str, Any]]:
    if schema_key != RETAIL_SCHEMA_KEY:
        raise _unprocessable("Variante de planejamento não suportada.")
    if not isinstance(answers, dict):
        raise _unprocessable("As respostas da intake precisam ser um objeto.")

    normalized = deepcopy(answers)
    for field in RETAIL_MULTI_FIELDS:
        if field in normalized and normalized[field] is not None:
            if not isinstance(normalized[field], list) or not all(isinstance(value, str) and value.strip() for value in normalized[field]):
                raise _unprocessable(f"{field} precisa ser uma lista de opções válidas.")
            normalized[field] = sorted(set(value.strip() for value in normalized[field]))
    for field in RETAIL_BOOLEAN_FIELDS:
        if field in normalized and not isinstance(normalized[field], bool):
            raise _unprocessable(f"{field} precisa ser verdadeiro ou falso.")
    if normalized.get("average_ticket_cents") is not None and (
        not isinstance(normalized["average_ticket_cents"], int) or normalized["average_ticket_cents"] < 0
    ):
        raise _unprocessable("average_ticket_cents precisa ser um inteiro não negativo.")
    for field in ("upsell_cross_sell", "campaign_types"):
        if field in normalized and (not isinstance(normalized[field], str) or not normalized[field].strip()):
            raise _unprocessable(f"{field} precisa ser preenchido.")

    for kind, maturity_field, goal_field in (
        ("marketing", "marketing_maturity", "marketing_goal"),
        ("commercial", "commercial_maturity", "commercial_goal"),
    ):
        maturity = normalized.get(maturity_field)
        goal = normalized.get(goal_field)
        if maturity is not None and maturity not in (MARKETING_GOALS if kind == "marketing" else COMMERCIAL_GOALS):
            raise _unprocessable(f"{maturity_field} não é uma opção válida.")
        if goal is not None and goal not in allowed_goals(kind, maturity):
            raise _unprocessable(f"{goal_field} não é compatível com a maturidade selecionada.")

    if require_complete:
        missing = sorted(field for field in RETAIL_REQUIRED_FIELDS if normalized.get(field) in (None, "", []))
        if missing:
            raise _unprocessable("Finalize os campos obrigatórios: " + ", ".join(missing) + ".")

    derived = {
        "schema_key": RETAIL_SCHEMA_KEY,
        "schema_version": RETAIL_SCHEMA_VERSION,
        "marketing_goal_options": list(allowed_goals("marketing", normalized.get("marketing_maturity", ""))),
        "commercial_goal_options": list(allowed_goals("commercial", normalized.get("commercial_maturity", ""))),
    }
    return normalized, derived


def _unprocessable(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)
