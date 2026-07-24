import sys
from pathlib import Path

# Add bioma_api to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from bioma_api.db import connect
from bioma_api.repositories import proposals as proposals_repo

def main():
    print("Testing Proposals & Opportunity Radar Engine...")
    with connect() as conn:
        opp = proposals_repo.create_opportunity(
            conn,
            {
                "source_platform": "99freelas",
                "title": "Projeto Teste: Implementação de Funil & Meta Ads",
                "url": "https://www.99freelas.com.br/projeto-teste",
                "description": "Buscamos especialista em tráfego pago, n8n e CRM.",
                "budget_text": "R$ 6.000,00",
                "fit_score": 88,
                "fit_analysis": "Palavra-chave identificada: tráfego | n8n | crm",
                "status": "qualified",
            },
        )
        print(f"[OK] Oportunidade criada (ID: {opp['id']}) - Fit Score: {opp['fit_score']}/100")

        proposal = proposals_repo.create_proposal(
            conn,
            {
                "opportunity_id": str(opp["id"]),
                "client_name": "Projeto: Implementação de Funil",
                "target_niche": "99freelas",
                "executive_summary": "Proposta Comercial EverGreen para acelerar aquisição de leads.",
                "scope_offer": "Definição de proposta de valor e precificação.",
                "scope_conversion": "Construção da página de alta conversão.",
                "scope_demand": "Escala de tráfego pago e automação.",
                "scope_items": [{"item": "Auditoria de Tração", "pilar": "Oferta", "prazo_dias": 3}],
                "pricing_cents": 600000,
                "delivery_days": 15,
                "status": "draft",
            },
        )
        print(f"[OK] Proposta gerada com sucesso! Public Token: {proposal['public_token']}")

        public_prop = proposals_repo.get_proposal_by_public_token(conn, proposal["public_token"])
        assert public_prop is not None
        print("[OK] Consulta de proposta por token público funcionando perfeitamente!")

    print("\nPROPOSALS & OPPORTUNITIES SMOKE TEST PASSED!")

if __name__ == "__main__":
    main()
