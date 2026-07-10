import argparse
from datetime import date, timedelta
import json

from bioma_worker.db import connect
from bioma_worker.orchestrator import run_next_sync
from bioma_worker.storage import enqueue_scheduled_syncs


def main() -> None:
    parser = argparse.ArgumentParser(description="Worker de performance do Bioma")
    parser.add_argument("--drain", action="store_true", help="Processa a fila até ficar vazia")
    parser.add_argument("--enqueue-all", action="store_true", help="Enfileira clientes ativos antes de processar")
    parser.add_argument("--days", type=int, default=3, help="Janela incremental para --enqueue-all")
    args = parser.parse_args()

    if args.enqueue_all:
        date_to = date.today()
        date_from = date_to - timedelta(days=max(args.days, 1))
        with connect() as conn:
            queued = enqueue_scheduled_syncs(conn, date_from, date_to)
        print(json.dumps({"queued": queued, "date_from": str(date_from), "date_to": str(date_to)}))

    processed = 0
    while True:
        result = run_next_sync()
        if result is None:
            if processed == 0:
                print(json.dumps({"status": "idle"}))
            break
        print(json.dumps(result, ensure_ascii=False))
        processed += 1
        if not args.drain:
            break


if __name__ == "__main__":
    main()
