from pathlib import Path
import os
import sys

import uvicorn

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts import migrate  # noqa: E402


def main() -> None:
    migrate.main()
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("bioma_api.main:app", host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
