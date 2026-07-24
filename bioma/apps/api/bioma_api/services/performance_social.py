from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status

from bioma_api.access import is_platform_admin, require_client_module, require_workspace_capability
from bioma_api.db import connect
from bioma_api.repositories import performance_social as perf_social_repo
from bioma_api.repositories import workspaces as workspaces_repo
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.performance_social import (
    PerformanceAiSummaryInsight,
    PerformanceAiSummaryResponse,
    SocialDailyMetric,
)


def list_meta_ads(workspace_id: UUID, user: CurrentUserResponse) -> list[SocialDailyMetric]:
    with connect() as conn:
        client = _accessible_workspace(conn, workspace_id, user)
        rows = perf_social_repo.list_meta_ads_daily(conn, client["workspace_id"])
    return [_format_metric(row) for row in rows]


def list_linkedin_ads(workspace_id: UUID, user: CurrentUserResponse) -> list[SocialDailyMetric]:
    with connect() as conn:
        client = _accessible_workspace(conn, workspace_id, user)
        rows = perf_social_repo.list_linkedin_ads_daily(conn, client["workspace_id"])
    return [_format_metric(row) for row in rows]


def generate_ai_summary(workspace_id: UUID, user: CurrentUserResponse) -> PerformanceAiSummaryResponse:
    with connect() as conn:
        client = _accessible_workspace(conn, workspace_id, user)
        totals = perf_social_repo.get_multichannel_totals(conn, client["workspace_id"])

    meta_totals = totals["meta"]
    linkedin_totals = totals["linkedin"]

    meta_spend = meta_totals["spend_cents"] or 0
    meta_leads = meta_totals["leads"] or 0
    linkedin_spend = linkedin_totals["spend_cents"] or 0
    linkedin_leads = linkedin_totals["leads"] or 0

    total_spend = meta_spend + linkedin_spend
    total_leads = meta_leads + linkedin_leads
    overall_cpa = int(total_spend / total_leads) if total_leads > 0 else 0

    insights = []
    if meta_spend > 0:
        meta_cpa = int(meta_spend / meta_leads) if meta_leads > 0 else 0
        insights.append(
            PerformanceAiSummaryInsight(
                channel="meta_ads",
                title="Desempenho Meta Ads (Instagram/Facebook)",
                finding=f"Investimento total de R$ {meta_spend / 100:,.2f} com {meta_leads} leads capturados (CPA médio de R$ {meta_cpa / 100:,.2f}).",
                action_recommendation="Escalar criativos de maior retenção nos primeiros 3s e otimizar públicos semelhantes.",
                impact_level="high",
            )
        )

    if linkedin_spend > 0:
        linkedin_cpa = int(linkedin_spend / linkedin_leads) if linkedin_leads > 0 else 0
        insights.append(
            PerformanceAiSummaryInsight(
                channel="linkedin_ads",
                title="Desempenho LinkedIn Ads B2B",
                finding=f"Investimento de R$ {linkedin_spend / 100:,.2f} com {linkedin_leads} leads qualificados (CPA médio de R$ {linkedin_cpa / 100:,.2f}).",
                action_recommendation="Concentrar orçamento nos cargos de decisão (C-Level/Diretoria) com ofertas de diagnóstico Raio-X.",
                impact_level="high",
            )
        )

    if not insights:
        insights.append(
            PerformanceAiSummaryInsight(
                channel="multichannel",
                title="Início de Monitoramento Multicanal",
                finding="As campanhas de Meta e LinkedIn Ads estão prontas para sincronização inicial.",
                action_recommendation="Conectar as contas de anúncios no painel de Integrações.",
                impact_level="medium",
            )
        )

    summary_text = (
        f"Análise Multicanal EverGreen: O workspace acumula R$ {total_spend / 100:,.2f} em mídia paga, "
        f"gerando {total_leads} leads qualificados. O custo por aquisição consolidado é R$ {overall_cpa / 100:,.2f}. "
        "A recomendação prioritária é rebalancear os orçamentos atacando o pilar gargalo apontado pelo Raio-X Comercial."
    )

    return PerformanceAiSummaryResponse(
        workspace_id=workspace_id,
        generated_at=datetime.now(timezone.utc),
        summary_text=summary_text,
        total_spend_cents=total_spend,
        total_leads=total_leads,
        overall_cpa_cents=overall_cpa,
        insights=insights,
    )


def _format_metric(row: dict) -> SocialDailyMetric:
    d = dict(row)
    impressions = d.get("impressions", 0)
    clicks = d.get("clicks", 0)
    spend_cents = d.get("spend_cents", 0)
    conversions = d.get("conversions", 0)
    revenue_cents = d.get("revenue_cents", 0)

    d["ctr"] = round((clicks / impressions * 100), 2) if impressions > 0 else 0.0
    d["cpc_cents"] = int(spend_cents / clicks) if clicks > 0 else 0
    d["cpa_cents"] = int(spend_cents / conversions) if conversions > 0 else 0
    d["roas"] = round((revenue_cents / spend_cents), 2) if spend_cents > 0 else 0.0
    return SocialDailyMetric(**d)


def _accessible_workspace(conn, workspace_id: UUID, user: CurrentUserResponse, capability: str | None = None):
    client = workspaces_repo.find_accessible_client(conn, workspace_id, is_platform_admin(user), user.id)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace não encontrado.")
    require_client_module(client, user, "analytics")
    if capability:
        require_workspace_capability(client, user, capability)
    return client
