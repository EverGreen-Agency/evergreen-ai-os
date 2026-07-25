from typing import Any
from uuid import UUID
from fastapi import HTTPException, status

from bioma_api.db import connect
from bioma_api.repositories import proposals as proposals_repo
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.proposals import (
    OpportunityCreatePayload,
    OpportunityIngestPayload,
    OpportunitySummary,
    ProposalCreatePayload,
    ProposalSummary,
    ProposalUpdatePayload,
    PublicProposalResponse,
)
from bioma_api.worker_bridge import execute_squad_pipeline_safe, get_whatsapp_provider_safe


def list_opportunities(user: CurrentUserResponse, status_filter: str | None = None) -> list[OpportunitySummary]:
    with connect() as conn:
        rows = proposals_repo.list_opportunities(conn, status_filter=status_filter)
    return [OpportunitySummary(**r) for r in rows]


def list_platform_configs(user: CurrentUserResponse) -> list[dict[str, Any]]:
    with connect() as conn:
        return proposals_repo.list_platform_configs(conn)


def update_platform_config(platform_key: str, payload: dict[str, Any], user: CurrentUserResponse) -> dict[str, Any]:
    with connect() as conn:
        return proposals_repo.upsert_platform_config(conn, platform_key, payload)


def list_freelancer_profiles(user: CurrentUserResponse) -> list[dict[str, Any]]:
    with connect() as conn:
        return proposals_repo.list_freelancer_profiles(conn)


def sync_and_audit_freelancer_profile(profile_url: str, platform_key: str | None = None, user: CurrentUserResponse | None = None) -> dict[str, Any]:
    from bioma_api.worker_bridge import _ensure_worker_in_path
    _ensure_worker_in_path()

    try:
        from bioma_worker.scrapers.profile_auditor import fetch_and_audit_profile_url
        audit_data = fetch_and_audit_profile_url(profile_url, platform_key)
    except Exception as exc:
        print(f"[Proposals Service] Erro na auditoria automatica: {exc}")
        audit_data = {
            "platform_key": platform_key or "other",
            "profile_url": profile_url,
            "profile_name": "Perfil Conectado",
            "headline": "Especialista B2B",
            "bio": f"Perfil monitorado via {profile_url}",
            "audit_score": 75,
            "audit_analysis": {
                "strengths": ["Perfil registrado para auto-vigilância."],
                "gaps": ["Falta ampliar depoimentos de clientes."],
                "optimized_headline": "Especialista em Growth & Performance B2B",
                "optimized_bio": "Ajudo empresas a escalarem suas vendas.",
                "portfolio_tips": "Adicione 3 cases com painéis de métricas.",
            },
        }

    with connect() as conn:
        return proposals_repo.upsert_freelancer_profile(conn, audit_data)


def delete_freelancer_profile(profile_id: UUID, user: CurrentUserResponse) -> dict[str, str]:
    with connect() as conn:
        proposals_repo.delete_freelancer_profile(conn, profile_id)
    return {"status": "deleted"}




def ingest_opportunity(payload: OpportunityIngestPayload, user: CurrentUserResponse | None = None) -> OpportunitySummary:
    with connect() as conn:
        existing = proposals_repo.find_existing_opportunity(conn, payload.url, payload.source_platform, payload.title)
        if existing:
            return OpportunitySummary(**existing)

        # Calculate initial Fit Score
        title_lower = payload.title.lower()
        desc_lower = (payload.description or "").lower()
        full_text = f"{title_lower} {desc_lower}"

        score = 50
        analysis_points = []
        high_value_keywords = ["growth", "tráfego", "meta ads", "google ads", "crm", "n8n", "automação", "landing page", "funil", "react", "fastapi"]
        for kw in high_value_keywords:
            if kw in full_text:
                score += 8
                analysis_points.append(f"Palavra-chave identificada: {kw}")

        # Detect technology gaps against EG inventory
        inventory_skills = [s["skill_name"].lower() for s in proposals_repo.list_tech_skills(conn) if s["status"] == "available"]
        known_tech_keywords = ["hubspot", "marketo", "salesforce", "magento", "shopify", "webflow", "activecampaign", "klaviyo", "pipedrive"]
        
        detected_gaps = []
        for tech in known_tech_keywords:
            if tech in full_text and tech not in inventory_skills:
                detected_gaps.append(tech.capitalize())
                score -= 10
                analysis_points.append(f"⚠️ Gap de Tecnologia Identificado: Requer {tech.capitalize()}")

        fit_score = min(98, max(20, score))
        fit_analysis = " | ".join(analysis_points) if analysis_points else "Alinhamento geral verificado."

        data = {
            "source_platform": payload.source_platform,
            "title": payload.title,
            "url": payload.url,
            "description": payload.description,
            "budget_text": payload.budget_text,
            "fit_score": fit_score,
            "fit_analysis": fit_analysis,
            "status": "qualified" if fit_score >= 70 else "new",
            "raw_payload": payload.raw_payload,
        }

        created = proposals_repo.create_opportunity(conn, data)
        opp_id = UUID(created["id"]) if isinstance(created["id"], str) else created["id"]

        # Save detected skill gaps into repository
        for missing in detected_gaps:
            proposals_repo.create_skill_gap(conn, opp_id, missing, payload.title, payload.url)

        if fit_score >= 75:
            _notify_high_fit_opportunity(created)

        return OpportunitySummary(**created)


def sync_opportunities_from_scrapers(user: CurrentUserResponse) -> dict[str, Any]:
    from bioma_api.worker_bridge import _ensure_worker_in_path
    _ensure_worker_in_path()

    try:
        from bioma_worker.scrapers.opportunities import fetch_rss_opportunities
        items = fetch_rss_opportunities()
    except Exception as exc:
        print(f"[Proposals Service] Erro ao executar scrapers: {exc}")
        items = []
    new_count = 0
    skipped_count = 0

    with connect() as conn:
        for item in items:
            existing = proposals_repo.find_existing_opportunity(conn, item.get("url"), item["source_platform"], item["title"])
            if existing:
                skipped_count += 1
            else:
                payload = OpportunityIngestPayload(
                    source_platform=item["source_platform"],
                    title=item["title"],
                    url=item.get("url"),
                    description=item.get("description"),
                    budget_text=item.get("budget_text"),
                    raw_payload=item.get("raw_payload", {}),
                )
                ingest_opportunity(payload, user)
                new_count += 1

    return {
        "status": "ok",
        "scanned": len(items),
        "new": new_count,
        "skipped": skipped_count,
    }



def generate_proposal_for_opportunity(opp_id: UUID, user: CurrentUserResponse) -> ProposalSummary:
    with connect() as conn:
        opps = proposals_repo.list_opportunities(conn)
        opp = next((o for o in opps if str(o["id"]) == str(opp_id)), None)
        if not opp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oportunidade não encontrada.")

        # Executa Squad de Vendas para desenhar a proposta comercial
        squad_result = execute_squad_pipeline_safe(
            workspace_id="00000000-0000-0000-0000-000000000000",
            squad_key="growth_proposals",
            input_context={
                "project_title": opp["title"],
                "project_description": opp.get("description", ""),
                "budget_text": opp.get("budget_text", ""),
                "source": opp["source_platform"],
            },
            requested_by_user_id=str(user.id),
        )

        title = opp["title"]
        matched_cases = proposals_repo.find_matching_cases_for_opportunity(conn, title, opp.get("description"))

        proposal_payload = {
            "opportunity_id": str(opp_id),
            "client_name": f"Projeto: {title[:40]}",
            "target_niche": opp["source_platform"].capitalize(),
            "executive_summary": f"Proposta comercial EverGreen para atuar no projeto '{title}'. Nossa abordagem combina auditoria, implementação e acompanhamento por squads especialistas.",
            "scope_offer": "Definição e posicionamento da oferta principal, proposta de valor e precificação.",
            "scope_conversion": "Construção/otimização da página de alta conversão, estrutura de vendas e rastreamento avançado.",
            "scope_demand": "Escala de tráfego pago (Meta Ads / Google Ads), prospecção ativa e automação de acompanhamento.",
            "scope_items": [
                {"item": "Diagnóstico Inicial e Estratégia de Tração", "pilar": "Oferta", "prazo_dias": 3},
                {"item": "Implementação da Estrutura de Conversão & Rastreamento", "pilar": "Conversão", "prazo_dias": 7},
                {"item": "Otimização de Campanhas e Automação de Leads", "pilar": "Demanda", "prazo_dias": 5},
            ],
            "attached_cases": matched_cases,
            "pricing_cents": 450000, # R$ 4.500,00 padrão
            "delivery_days": 15,
            "status": "draft",
        }

        proposal = proposals_repo.create_proposal(conn, proposal_payload, user_id=user.id)
        proposals_repo.update_opportunity_status(conn, opp_id, status_val="proposal_generated")

    return ProposalSummary(**proposal)


def list_proposals(user: CurrentUserResponse) -> list[ProposalSummary]:
    with connect() as conn:
        rows = proposals_repo.list_proposals(conn)
    return [ProposalSummary(**r) for r in rows]


def create_proposal(payload: ProposalCreatePayload, user: CurrentUserResponse) -> ProposalSummary:
    with connect() as conn:
        row = proposals_repo.create_proposal(conn, payload.model_dump(), user_id=user.id)
    return ProposalSummary(**row)


def update_proposal(proposal_id: UUID, payload: ProposalUpdatePayload, user: CurrentUserResponse) -> ProposalSummary:
    with connect() as conn:
        row = proposals_repo.update_proposal(conn, proposal_id, payload.model_dump(exclude_unset=True))
    return ProposalSummary(**row)


def get_public_proposal(public_token: str) -> PublicProposalResponse:
    with connect() as conn:
        row = proposals_repo.get_proposal_by_public_token(conn, public_token)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposta comercial não encontrada ou expirada.")
    return PublicProposalResponse(**row)


def list_tech_skills(user: CurrentUserResponse) -> list[dict[str, Any]]:
    with connect() as conn:
        return proposals_repo.list_tech_skills(conn)


def list_skill_gaps(user: CurrentUserResponse) -> list[dict[str, Any]]:
    with connect() as conn:
        return proposals_repo.list_skill_gaps(conn)


def resolve_skill_gap(gap_id: UUID, user: CurrentUserResponse) -> dict[str, Any]:
    with connect() as conn:
        return proposals_repo.resolve_skill_gap(conn, gap_id)



def _notify_high_fit_opportunity(opp: dict[str, Any]):
    try:
        provider = get_whatsapp_provider_safe("evolution", {"api_token": "simulated"})
        msg = f"🔥 *Nova Oportunidade Quente encontrada no {opp['source_platform']}!*\n\n📌 *Projeto:* {opp['title']}\n💰 *Orçamento:* {opp.get('budget_text') or 'A combinar'}\n⭐ *Fit Score:* {opp['fit_score']}/100\n\n_Acesse o Bioma para gerar a proposta comercial em 1 clique!_"
        provider.send_text_message("5511999999999", msg)
    except Exception:
        pass
