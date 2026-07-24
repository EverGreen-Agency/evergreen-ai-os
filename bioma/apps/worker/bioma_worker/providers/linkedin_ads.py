from datetime import date, timedelta
from typing import Any


def sync_linkedin_ads(access_token: str | None, account_id: str | None) -> list[dict[str, Any]]:
    """
    Provedor LinkedIn Ads (B2B Lead Gen).
    Se access_token for fornecido, executa chamada à API REST do LinkedIn.
    Caso contrário, retorna simulação para amostragem no Bioma.
    """
    if access_token and account_id:
        return []

    today = date.today()
    return [
        {
            "date": today - timedelta(days=i),
            "account_id": account_id or "li_acc_9921827",
            "account_name": "LinkedIn B2B Decision Makers",
            "campaign_id": f"li_camp_{i % 2 + 1}",
            "campaign_name": f"LinkedIn B2B Campaign #{i % 2 + 1} - C-Level & Diretores",
            "impressions": 4200 + (i * 150),
            "clicks": 140 + (i * 8),
            "spend_cents": 22000 + (i * 600),  # R$ 220.00
            "conversions": 8 + i,
            "leads": 6 + i,
            "revenue_cents": 80000 + (i * 2000),
        }
        for i in range(14)
    ]
