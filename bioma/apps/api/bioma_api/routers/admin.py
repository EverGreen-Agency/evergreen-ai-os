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

router = APIRouter(prefix="/backoffice", tags=["backoffice"])

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
        "engineering": memory / "engenharia",
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


class IdeaDocData(BaseModel):
    content: str


class EngineeringDocData(BaseModel):
    doc_type: str
    filename: str | None = None
    content: str


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


@router.put("/ideas/doc/{id}")
def save_idea_doc(id: str, data: IdeaDocData, _user: CurrentUserResponse = Depends(_require_eg_admin)):
    if not _DOC_ID_PATTERN.match(id) or ".." in id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Identificador inválido.")
    paths = _paths()
    if not paths:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Indisponível neste ambiente.")
    doc_path = (paths["ideas_docs"] / f"{id}.md").resolve()
    if not doc_path.parent.is_relative_to(paths["ideas_docs"].resolve()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Caminho inválido.")
    doc_path.parent.mkdir(parents=True, exist_ok=True)
    doc_path.write_text(data.content, encoding="utf-8")
    return {"status": "ok"}


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

def parse_spec_metadata(content: str):
    import re
    title = None
    status = None
    date = None
    
    title_match = re.search(r'^# Spec:\s*(.+)$', content, re.MULTILINE)
    if title_match:
        title = title_match.group(1).strip()
    
    status_match = re.search(r'-\s*\*\*Status:\*\*\s*(.+)$', content, re.MULTILINE)
    if status_match:
        status = status_match.group(1).strip()
        
    date_match = re.search(r'-\s*\*\*Data:\*\*\s*(.+)$', content, re.MULTILINE)
    if date_match:
        date = date_match.group(1).strip()
        
    return {"title": title, "status": status, "date": date}

@router.get("/engineering")
def get_engineering_modules(_user: CurrentUserResponse = Depends(_require_eg_admin)):
    paths = _paths()
    if not paths or "engineering" not in paths:
        return {"modules": [], "matrix": {}}
    eng_dir = paths["engineering"]
    if not eng_dir.exists():
        return {"modules": [], "matrix": {}}
        
    modules = []
    for entry in eng_dir.iterdir():
        if entry.is_dir() and entry.name != "mega-plataforma":
            mod_id = entry.name
            spec_path = entry / "spec.md"
            tasks_path = entry / "tasks.md"
            adr_dir = entry / "adr"
            
            has_spec = spec_path.exists()
            spec_title, spec_status, spec_date = None, None, None
            if has_spec:
                content = spec_path.read_text(encoding='utf-8')
                meta = parse_spec_metadata(content)
                spec_title = meta.get("title")
                spec_status = meta.get("status")
                spec_date = meta.get("date")
                
            has_tasks = tasks_path.exists()
            adr_count = 0
            if adr_dir.exists():
                adr_count = len([f for f in adr_dir.iterdir() if f.is_file() and f.name.endswith(".md")])
                
            modules.append({
                "id": mod_id,
                "hasSpec": has_spec,
                "specTitle": spec_title,
                "specStatus": spec_status,
                "specDate": spec_date,
                "adrCount": adr_count,
                "hasTasks": has_tasks
            })
            
    matrix = {}
    matrix_path = eng_dir / "mega-plataforma" / "matriz-maturidade-modulos.md"
    if matrix_path.exists():
        content = matrix_path.read_text(encoding='utf-8')
        import re
        for match in re.finditer(r'^\|\s*([\w-]+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|', content, re.MULTILINE):
            mod_id = match.group(1).strip()
            matrix[mod_id] = {
                "id": mod_id,
                "phase": match.group(2).strip(),
                "maturity": match.group(3).strip(),
                "nextGate": match.group(4).strip()
            }
            
    modules.sort(key=lambda x: x["id"])
    return {"modules": modules, "matrix": matrix}

@router.get("/engineering/{mod_id}")
def get_engineering_detail(mod_id: str, _user: CurrentUserResponse = Depends(_require_eg_admin)):
    import re
    if not re.match(r'^[a-z0-9][a-z0-9_-]*$', mod_id):
        raise HTTPException(status_code=400, detail="Invalid mod_id")
        
    paths = _paths()
    if not paths or "engineering" not in paths:
        raise HTTPException(status_code=404, detail="Engineering directory not found")
    eng_dir = paths["engineering"]
    mod_dir = eng_dir / mod_id
    if not mod_dir.is_dir():
        raise HTTPException(status_code=404, detail="Module not found")
        
    spec_path = mod_dir / "spec.md"
    tasks_path = mod_dir / "tasks.md"
    
    spec_content = spec_path.read_text(encoding='utf-8') if spec_path.exists() else None
    tasks_content = tasks_path.read_text(encoding='utf-8') if tasks_path.exists() else None
    
    adrs = []
    adr_dir = mod_dir / "adr"
    if adr_dir.exists():
        for f in sorted(adr_dir.iterdir()):
            if f.is_file() and f.name.endswith(".md"):
                content = f.read_text(encoding='utf-8')
                title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
                title = title_match.group(1).strip() if title_match else f.name
                adrs.append({
                    "file": f.name,
                    "title": title,
                    "content": content
                })
                
    return {
        "id": mod_id,
        "specContent": spec_content,
        "tasksContent": tasks_content,
        "adrs": adrs
    }


@router.put("/engineering/{mod_id}/doc")
def save_engineering_doc(mod_id: str, data: EngineeringDocData, _user: CurrentUserResponse = Depends(_require_eg_admin)):
    import re
    if not re.match(r'^[a-z0-9][a-z0-9_-]*$', mod_id):
        raise HTTPException(status_code=400, detail="Invalid mod_id")
        
    paths = _paths()
    if not paths or "engineering" not in paths:
        raise HTTPException(status_code=404, detail="Engineering directory not found")
        
    eng_dir = paths["engineering"]
    mod_dir = eng_dir / mod_id
    if not mod_dir.is_dir():
        raise HTTPException(status_code=404, detail="Module not found")
        
    if data.doc_type == "spec":
        file_path = mod_dir / "spec.md"
    elif data.doc_type == "tasks":
        file_path = mod_dir / "tasks.md"
    elif data.doc_type == "adr":
        if not data.filename or not data.filename.endswith(".md"):
            raise HTTPException(status_code=400, detail="Invalid ADR filename")
        file_path = mod_dir / "adr" / data.filename
    else:
        raise HTTPException(status_code=400, detail="Invalid doc_type")
        
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(data.content, encoding="utf-8")
    
    return {"status": "ok"}
