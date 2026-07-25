import urllib.request
import xml.etree.ElementTree as ET
from typing import Any

# Feeds RSS conhecidos de plataformas remotas/freelancer
RSS_SOURCES = [
    {
        "platform": "weworkremotely",
        "name": "WeWorkRemotely - Marketing",
        "url": "https://weworkremotely.com/categories/remote-marketing-jobs.rss",
    },
    {
        "platform": "freelancer",
        "name": "Freelancer.com - Brazil",
        "url": "https://www.freelancer.com.br/rss.xml",
    },
]

def fetch_rss_opportunities() -> list[dict[str, Any]]:
    opportunities = []
    for source in RSS_SOURCES:
        try:
            req = urllib.request.Request(
                source["url"],
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                xml_data = response.read()
                root = ET.fromstring(xml_data)

                # Parse de itens RSS padrão
                for item in root.findall(".//item"):
                    title = item.findtext("title") or "Projeto Sem Título"
                    link = item.findtext("link") or ""
                    description = item.findtext("description") or ""

                    opportunities.append({
                        "source_platform": source["platform"],
                        "title": title.strip(),
                        "url": link.strip(),
                        "description": description.strip()[:1000],
                        "budget_text": "A combinar (RSS)",
                        "raw_payload": {"source_name": source["name"]},
                    })
        except Exception as exc:
            # Em caso de falha de rede/feed offline, falha de forma graciosa sem quebrar o ciclo
            print(f"[Worker Scraper] Erro ao ler RSS {source['name']}: {exc}")

    return opportunities
