from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

CopilotSurface = Literal["task", "workspace"]
ActionStatus = Literal["executed", "proposed", "pending_confirmation", "failed"]


class CopilotRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    surface: CopilotSurface = "workspace"
    task_id: UUID | None = None
    workspace_id: UUID | None = None
    # Busca na web é permitida por decisão do Eduardo, mas sempre com fonte.
    allow_web_search: bool = True
    # dry_run devolve o plano sem executar nada — usado na pré-visualização.
    dry_run: bool = False


class CopilotAction(BaseModel):
    name: str
    label: str
    params: dict[str, Any] = Field(default_factory=dict)
    why: str = ""
    status: ActionStatus
    detail: str | None = None
    # Como desfazer o que foi executado. Ação reversível sem dica de desfazer é
    # bug de implementação, não desenho.
    undo_hint: str | None = None


class CopilotSource(BaseModel):
    """`bioma` = origem interna (tela/tabela); `web` = URL realmente visitada."""
    kind: Literal["bioma", "web"]
    reference: str


class CopilotResponse(BaseModel):
    answer: str
    generation_mode: Literal["live", "preview"]
    confidence: Literal["alta", "media", "baixa"]
    actions: list[CopilotAction] = Field(default_factory=list)
    sources: list[CopilotSource] = Field(default_factory=list)


class CopilotCommand(BaseModel):
    """Item do menu de `/` na interface."""
    name: str
    label: str
    description: str
    requires_confirmation: bool
