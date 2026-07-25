from uuid import uuid4
from bioma_api.schemas.proposals import OpportunityIngestPayload
from bioma_api.services import proposals as proposals_service

def test_proposals_flow(eg_admin):
    # 1. Ingest opportunity
    payload = OpportunityIngestPayload(
        source_platform="workana",
        title="Desenvolvimento de MVP React e FastAPI",
        description="Buscamos especialista para construir plataforma B2B com automação e dashboards.",
        budget_text="R$ 5.000,00",
    )
    opp = proposals_service.ingest_opportunity(payload, eg_admin)
    assert opp.id is not None
    assert opp.fit_score >= 50

    # 2. List opportunities
    opps = proposals_service.list_opportunities(eg_admin)
    assert len(opps) > 0

    # 3. Generate proposal for opportunity
    prop = proposals_service.generate_proposal_for_opportunity(opp.id, eg_admin)
    assert prop.id is not None
    assert "React" in prop.client_name or "MVP" in prop.client_name

    # 4. List platform configs
    platforms = proposals_service.list_platform_configs(eg_admin)
    assert len(platforms) >= 5
