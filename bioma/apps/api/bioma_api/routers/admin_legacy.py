import json
import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any

router = APIRouter(prefix="/api", tags=["Admin Legacy"])

PROJECT_ROOT = Path(os.getcwd())
STACK_FILE = PROJECT_ROOT / "_opensquad" / "_memory" / "banco_stack" / "stack.json"
IDEAS_FILE = PROJECT_ROOT / "_opensquad" / "_memory" / "banco_ideias" / "ideas.json"
IDEAS_DOC_DIR = PROJECT_ROOT / "_opensquad" / "_memory" / "banco_ideias" / "docs"
ARCH_FILE = PROJECT_ROOT / "_opensquad" / "_memory" / "banco_arquitetura" / "arquitetura.md"
SQUADS_DIR = PROJECT_ROOT / "squads"

class StackData(BaseModel):
    techs: List[dict]

class IdeasData(BaseModel):
    ideas: List[dict]

@router.get("/stack")
def get_stack():
    if not STACK_FILE.exists():
        return {"techs": []}
    try:
        content = json.loads(STACK_FILE.read_text(encoding="utf-8"))
        return content
    except Exception as e:
        return {"techs": []}

@router.post("/stack")
def save_stack(data: StackData):
    try:
        STACK_FILE.parent.mkdir(parents=True, exist_ok=True)
        STACK_FILE.write_text(data.model_dump_json(indent=2), encoding="utf-8")
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ideas")
def get_ideas():
    if not IDEAS_FILE.exists():
        return {"ideas": []}
    try:
        content = json.loads(IDEAS_FILE.read_text(encoding="utf-8"))
        return content
    except Exception as e:
        return {"ideas": []}

@router.post("/ideas")
def save_ideas(data: IdeasData):
    try:
        IDEAS_FILE.parent.mkdir(parents=True, exist_ok=True)
        IDEAS_FILE.write_text(data.model_dump_json(indent=2), encoding="utf-8")
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import PlainTextResponse

@router.get("/ideas/doc")
def get_idea_doc(id: str):
    doc_path = IDEAS_DOC_DIR / f"{id}.md"
    if not doc_path.exists():
        raise HTTPException(status_code=404, detail="Doc not found")
    try:
        return PlainTextResponse(doc_path.read_text(encoding="utf-8"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import yaml

@router.get("/architecture")
def get_architecture():
    # Load markdown
    md_content = ""
    if ARCH_FILE.exists():
        md_content = ARCH_FILE.read_text(encoding="utf-8")
    
    # Load squads
    squads = []
    if SQUADS_DIR.exists():
        for sq_dir in SQUADS_DIR.iterdir():
            if sq_dir.is_dir():
                squad_yaml = sq_dir / "squad.yaml"
                if squad_yaml.exists():
                    try:
                        content = squad_yaml.read_text(encoding="utf-8")
                        data = yaml.safe_load(content)
                        squads.append({
                            "code": sq_dir.name,
                            "name": data.get("name", sq_dir.name),
                            "description": data.get("description", ""),
                            "icon": data.get("icon", "🤖"),
                            "agents": data.get("agents", [])
                        })
                    except Exception:
                        pass
    
    return {"md": md_content, "squads": squads}

@router.get("/squads")
def get_squads():
    # Similar to architecture but just returning squad states
    # This is a stub for the office/phaser view which wants squad states
    squads = []
    if SQUADS_DIR.exists():
        for sq_dir in SQUADS_DIR.iterdir():
            if sq_dir.is_dir():
                squad_yaml = sq_dir / "squad.yaml"
                if squad_yaml.exists():
                    try:
                        content = squad_yaml.read_text(encoding="utf-8")
                        data = yaml.safe_load(content)
                        squads.append({
                            "code": sq_dir.name,
                            "name": data.get("name", sq_dir.name),
                            "description": data.get("description", ""),
                            "icon": data.get("icon", "🤖"),
                            "agents": data.get("agents", [])
                        })
                    except Exception:
                        pass
    return {"squads": squads, "activeStates": {}}
