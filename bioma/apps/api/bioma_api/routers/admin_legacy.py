import json
import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any

router = APIRouter(prefix="/api", tags=["Admin Legacy"])

PROJECT_ROOT = Path(os.getcwd())
STACK_FILE = PROJECT_ROOT / "_opensquad" / "_memory" / "banco_stack" / "stack.json"
IDEAS_FILE = PROJECT_ROOT / "_opensquad" / "_memory" / "banco_ideias" / "ideias.json"

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
