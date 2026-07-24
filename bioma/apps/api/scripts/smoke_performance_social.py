import sys
from pathlib import Path

# Add apps/api and apps/worker to sys.path
api_path = Path(__file__).resolve().parent.parent
worker_path = api_path.parent / "worker"
if str(api_path) not in sys.path:
    sys.path.insert(0, str(api_path))
if str(worker_path) not in sys.path:
    sys.path.insert(0, str(worker_path))

from bioma_api.db import connect
from bioma_api.repositories import performance_social as perf_social_repo
from bioma_worker.providers.meta_ads import sync_meta_ads
from bioma_worker.providers.linkedin_ads import sync_linkedin_ads


def main():
    print("Testing Multichannel Performance Connectors (Meta Ads, LinkedIn Ads & AI Summary)...")

    with connect() as conn:
        ws = conn.execute("select id from workspaces limit 1").fetchone()
        if not ws:
            print("No workspace found, skipping DB seed.")
            return

        workspace_id = ws["id"]
        client_id = None

        # 1. Upsert Meta Ads metrics
        meta_data = sync_meta_ads(None, None)
        perf_social_repo.upsert_meta_ads_daily(conn, workspace_id, client_id, meta_data)
        conn.commit()

        meta_rows = perf_social_repo.list_meta_ads_daily(conn, workspace_id)
        assert len(meta_rows) > 0
        print(f"[OK] Meta Ads daily metrics seeded & queried ({len(meta_rows)} rows)")

        # 2. Upsert LinkedIn Ads metrics
        li_data = sync_linkedin_ads(None, None)
        perf_social_repo.upsert_linkedin_ads_daily(conn, workspace_id, client_id, li_data)
        conn.commit()

        li_rows = perf_social_repo.list_linkedin_ads_daily(conn, workspace_id)
        assert len(li_rows) > 0
        print(f"[OK] LinkedIn Ads daily metrics seeded & queried ({len(li_rows)} rows)")

        # 3. Test totals for AI summary
        totals = perf_social_repo.get_multichannel_totals(conn, workspace_id)
        assert totals["meta"]["spend_cents"] > 0
        assert totals["linkedin"]["spend_cents"] > 0
        print("[OK] Multichannel totals aggregated for AI Summary Generator")

    print("\nMULTICHANNEL PERFORMANCE CONNECTORS SMOKE TEST OK!")


if __name__ == "__main__":
    main()
