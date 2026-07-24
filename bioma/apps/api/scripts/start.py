from pathlib import Path
import os
import sys

import uvicorn

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts import cleanup, migrate  # noqa: E402


def main() -> None:
    migrate.main()
    # Retenção LGPD: limpar sessões/convites/resets vencidos a cada boot.
    # Nunca pode impedir a API de subir.
    try:
        cleanup.main()
    except Exception as error:  # noqa: BLE001
        print(f"cleanup falhou (seguindo com o boot): {error}")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("bioma_api.main:app", host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
