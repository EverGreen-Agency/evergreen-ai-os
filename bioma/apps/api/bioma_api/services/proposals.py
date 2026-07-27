from typing import Any
from uuid import UUID
from fastapi import HTTPException, status

from bioma_api.access import require_platform_admin
from bioma_api.db import connect
from bioma_api.repositories import proposals as proposals_repo
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.proposals import (
    OpportunityCreatePayload,
    OpportunityIngestPayload,
    OpportunityPlatformSummary,
    OpportunityPlatformUpdate,
    OpportunitySummary,
    ProposalCreatePayload,
    ProposalSummary,
    ProposalUpdatePayload,
    PublicProposalResponse,
)
from bioma_api.worker_bridge import execute_squad_pipeline_safe


def _require_admin(user: CurrentUserResponse) -> None:
    require_platform_admin(user)


def list_opportunities(user: CurrentUserResponse, status_filter: str | None = None) -> list[OpportunitySummary]:
    _require_admin(user)
    with connect() as conn:
        rows = proposals_repo.list_opportunities(conn, status_filter=status_filter)
    return [OpportunitySummary(**r) for r in rows]


def list_platform_configs(user: CurrentUserResponse) -> list[OpportunityPlatformSummary]:
    _require_admin(user)
    with connect() as conn:
        rows = proposals_repo.list_platform_configs(conn)
    return [OpportunityPlatformSummary(**row) for row in rows]


def update_platform_config(
    platform_key: str,
    payload: OpportunityPlatformUpdate,
    user: CurrentUserResponse,
) -> OpportunityPlatformSummary:
    _require_admin(user)
    with connect() as conn:
        row = proposals_repo.upsert_platform_config(conn, platform_key, payload.model_dump(mode="json"))
    return OpportunityPlatformSummary(**row)


def list_freelancer_profiles(user: CurrentUserResponse) -> list[dict[str, Any]]:
    _require_admin(user)
    with connect() as conn:
        return proposals_repo.list_freelancer_profiles(conn)


def sync_and_audit_freelancer_profile(
    profile_url: str,
    platform_key: str | None,
    user: CurrentUserResponse,
) -> dict[str, Any]:
    _require_admin(user)
    from bioma_api.worker_bridge import _ensure_worker_in_path
    _ensure_worker_in_path()

    try:
        from bioma_worker.scrapers.profile_auditor import fetch_and_audit_profile_url
        audit_data = fetch_and_audit_profile_url(profile_url, platform_key)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Não foi possível auditar o perfil informado.",
        ) from exc

    with connect() as conn:
        return proposals_repo.upsert_freelancer_profile(conn, audit_data)


def delete_freelancer_profile(profile_id: UUID, user: CurrentUserResponse) -> dict[str, str]:
    _require_admin(user)
    with connect() as conn:
        if not proposals_repo.delete_freelancer_profile(conn, profile_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil não encontrado.")
    return {"status": "deleted"}




def ingest_opportunity(payload: OpportunityIngestPayload, user: CurrentUserResponse) -> OpportunitySummary:
    _require_admin(user)
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

        return OpportunitySummary(**created)


def sync_opportunities_from_scrapers(user: CurrentUserResponse) -> dict[str, Any]:
    _require_admin(user)
    from bioma_api.worker_bridge import _ensure_worker_in_path
    _ensure_worker_in_path()

    custom_sources = []
    with connect() as conn:
        configs = proposals_repo.list_platform_configs(conn)
        for cfg in configs:
            rss_url = cfg.get("rss_url")
            if rss_url and rss_url.strip():
                custom_sources.append({
                    "platform": cfg["platform_key"],
                    "name": cfg["platform_name"],
                    "url": rss_url.strip(),
                })

    try:
        from bioma_worker.scrapers.opportunities import fetch_rss_opportunities
        items = fetch_rss_opportunities(custom_sources=custom_sources)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="O radar não conseguiu carregar as fontes configuradas.",
        ) from exc
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
        "status": "completed",
        "scanned": len(items),
        "new": new_count,
        "skipped": skipped_count,
    }



def generate_proposal_for_opportunity(opp_id: UUID, user: CurrentUserResponse) -> ProposalSummary:
    _require_admin(user)
    with connect() as conn:
        opp = proposals_repo.get_opportunity(conn, opp_id)
        if not opp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oportunidade não encontrada.")

    input_context = {
        "objective": opp["title"],
        "project_title": opp["title"],
        "project_description": opp.get("description", ""),
        "budget_text": opp.get("budget_text", ""),
        "source": opp["source_platform"],
    }
    pillar_results = {
        pillar: execute_squad_pipeline_safe(
            pilar=pillar,
            squad_key="growth_proposals",
            input_context=input_context,
            requested_by_user_id=str(user.id),
        )
        for pillar in ("oferta", "conversao", "demanda")
    }
    modes = {result["generation_mode"] for result in pillar_results.values()}
    generation_mode = "live" if modes == {"live"} else "preview"
    oferta = pillar_results["oferta"]["output_data"]
    conversao = pillar_results["conversao"]["output_data"]
    demanda = pillar_results["demanda"]["output_data"]
    title = opp["title"]

    proposal_payload = {
            "opportunity_id": str(opp_id),
            "client_name": f"Projeto: {title[:40]}",
            "target_niche": opp["source_platform"].capitalize(),
            "executive_summary": oferta["headline"],
            "scope_offer": oferta["mecanismo_unico"],
            "scope_conversion": conversao["script_fechamento"],
            "scope_demand": demanda["estrutura_campanha"],
            "scope_items": [
                {"item": oferta["headline"], "pilar": "Oferta", "details": oferta},
                {"item": conversao["script_fechamento"], "pilar": "Conversão", "details": conversao},
                {"item": demanda["estrutura_campanha"], "pilar": "Demanda", "details": demanda},
            ],
            "attached_cases": [],
            "pricing_cents": 0,
            "delivery_days": 0,
            "status": "draft",
            "generation_mode": generation_mode,
        }

    with connect() as conn:
        proposal = proposals_repo.create_proposal(conn, proposal_payload, user_id=user.id)
        proposals_repo.update_opportunity_status(conn, opp_id, status_val="proposal_generated")

    return ProposalSummary(**proposal)


def list_proposals(user: CurrentUserResponse) -> list[ProposalSummary]:
    _require_admin(user)
    with connect() as conn:
        rows = proposals_repo.list_proposals(conn)
    return [ProposalSummary(**r) for r in rows]


def create_proposal(payload: ProposalCreatePayload, user: CurrentUserResponse) -> ProposalSummary:
    _require_admin(user)
    with connect() as conn:
        row = proposals_repo.create_proposal(conn, payload.model_dump(), user_id=user.id)
    return ProposalSummary(**row)


def update_proposal(proposal_id: UUID, payload: ProposalUpdatePayload, user: CurrentUserResponse) -> ProposalSummary:
    _require_admin(user)
    with connect() as conn:
        row = proposals_repo.update_proposal(conn, proposal_id, payload.model_dump(exclude_unset=True))
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposta não encontrada.")
    return ProposalSummary(**row)


def get_public_proposal(public_token: str) -> PublicProposalResponse:
    with connect() as conn:
        row = proposals_repo.get_proposal_by_public_token(conn, public_token)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposta comercial não encontrada ou expirada.")
    return PublicProposalResponse(**row)


def list_tech_skills(user: CurrentUserResponse) -> list[dict[str, Any]]:
    _require_admin(user)
    with connect() as conn:
        return proposals_repo.list_tech_skills(conn)


def list_skill_gaps(user: CurrentUserResponse) -> list[dict[str, Any]]:
    _require_admin(user)
    with connect() as conn:
        return proposals_repo.list_skill_gaps(conn)


def resolve_skill_gap(gap_id: UUID, user: CurrentUserResponse) -> dict[str, Any]:
    _require_admin(user)
    with connect() as conn:
        row = proposals_repo.resolve_skill_gap(conn, gap_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gap não encontrado.")
        return row


def get_proposal_analytics(user: CurrentUserResponse) -> dict[str, Any]:
    _require_admin(user)
    with connect() as conn:
        return proposals_repo.get_proposal_analytics_metrics(conn)
