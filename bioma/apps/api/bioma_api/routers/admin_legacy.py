"""Endpoints do backoffice EG (Tech Radar, Banco de Ideias, Arquitetura, Escritório).

Servem os arquivos de conhecimento do monorepo (`_opensquad/_memory/*`) para as
views administrativas. Regras:

- Somente EG admin autenticado (dados internos estratégicos da EG).
- Escrita preserva os metadados do arquivo (schema_version/note/rings/stages):
  apenas a chave da lista é substituída e `updated_at` é tocado.
- Fora do monorepo (produção Railway, onde `_opensquad/` não existe) as
  leituras respondem vazio e as escritas retornam 503 — é um recurso do
  ambiente de desenvolvimento EG.
"""

import json
import re
from datetime import date
from pathlib import Path
from typing import Any

import yaml
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

from bioma_api.access import require_platform_admin
from bioma_api.auth import current_user_from_request
from bioma_api.schemas.auth import CurrentUserResponse

router = APIRouter(prefix="/api", tags=["admin-legacy"])

_DOC_ID_PATTERN = re.compile(r"^[A-Za-z0-9._-]+$")


def _repo_root() -> Path | None:
    """Sobe a partir deste arquivo até achar o diretório com `_opensquad/`.

    Não depende do CWD (o uvicorn roda de `apps/api`); em produção, onde o
    monorepo não existe, retorna None.
    """
    for parent in Path(__file__).resolve().parents:
        if (parent / "_opensquad").is_dir():
            return parent
    return None


def _paths() -> dict[str, Path] | None:
    root = _repo_root()
    if root is None:
        return None
    memory = root / "_opensquad" / "_memory"
    return {
        "stack": memory / "banco_stack" / "stack.json",
        "ideas": memory / "banco_ideias" / "ideas.json",
        "ideas_docs": memory / "banco_ideias" / "docs",
        "architecture": memory / "banco_arquitetura" / "arquitetura.md",
        "squads": root / "squads",
    }


def _require_eg_admin(user: CurrentUserResponse = Depends(current_user_from_request)) -> CurrentUserResponse:
    require_platform_admin(user)
    return user


def _read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def _merge_save(path: Path, list_key: str, items: list[dict]) -> None:
    """Substitui apenas a lista, preservando metadados do arquivo versionado."""
    if not path.parent.is_dir():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Backoffice de arquivos disponível apenas no ambiente de desenvolvimento EG.",
        )
    content = _read_json(path)
    content[list_key] = items
    content["updated_at"] = date.today().isoformat()
    path.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


class StackData(BaseModel):
    techs: list[dict]


class IdeasData(BaseModel):
    ideas: list[dict]


@router.get("/stack")
def get_stack(_user: CurrentUserResponse = Depends(_require_eg_admin)):
    paths = _paths()
    if not paths:
        return {"techs": []}
    return _read_json(paths["stack"]) or {"techs": []}


@router.post("/stack")
def save_stack(data: StackData, _user: CurrentUserResponse = Depends(_require_eg_admin)):
    paths = _paths()
    if not paths:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Indisponível neste ambiente.")
    _merge_save(paths["stack"], "techs", data.techs)
    return {"status": "ok"}


@router.get("/ideas")
def get_ideas(_user: CurrentUserResponse = Depends(_require_eg_admin)):
    paths = _paths()
    if not paths:
        return {"ideas": []}
    return _read_json(paths["ideas"]) or {"ideas": []}


@router.post("/ideas")
def save_ideas(data: IdeasData, _user: CurrentUserResponse = Depends(_require_eg_admin)):
    paths = _paths()
    if not paths:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Indisponível neste ambiente.")
    _merge_save(paths["ideas"], "ideas", data.ideas)
    return {"status": "ok"}


@router.get("/ideas/doc")
def get_idea_doc(id: str, _user: CurrentUserResponse = Depends(_require_eg_admin)):
    # O id vira nome de arquivo: sem validação daria path traversal
    # (id=../../qualquer-coisa leria .md arbitrário do disco).
    if not _DOC_ID_PATTERN.match(id) or ".." in id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Identificador inválido.")
    paths = _paths()
    if not paths:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doc não encontrado.")
    doc_path = (paths["ideas_docs"] / f"{id}.md").resolve()
    if not doc_path.is_relative_to(paths["ideas_docs"].resolve()) or not doc_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doc não encontrado.")
    return PlainTextResponse(doc_path.read_text(encoding="utf-8"))


def _load_squads(squads_dir: Path) -> list[dict]:
    squads = []
    if not squads_dir.is_dir():
        return squads
    for sq_dir in sorted(squads_dir.iterdir()):
        squad_yaml = sq_dir / "squad.yaml"
        if not sq_dir.is_dir() or not squad_yaml.exists():
            continue
        try:
            data = yaml.safe_load(squad_yaml.read_text(encoding="utf-8")) or {}
        except (OSError, yaml.YAMLError):
            continue
        squads.append(
            {
                "code": sq_dir.name,
                "name": data.get("name", sq_dir.name),
                "description": data.get("description", ""),
                "icon": data.get("icon", "🤖"),
                "agents": data.get("agents", []),
            }
        )
    return squads


@router.get("/architecture")
def get_architecture(_user: CurrentUserResponse = Depends(_require_eg_admin)):
    paths = _paths()
    if not paths:
        return {"md": "", "squads": []}
    md_content = paths["architecture"].read_text(encoding="utf-8") if paths["architecture"].exists() else ""
    return {"md": md_content, "squads": _load_squads(paths["squads"])}


@router.get("/squads")
def get_squads(_user: CurrentUserResponse = Depends(_require_eg_admin)):
    paths = _paths()
    if not paths:
        return {"squads": [], "activeStates": {}}
    return {"squads": _load_squads(paths["squads"]), "activeStates": {}}
