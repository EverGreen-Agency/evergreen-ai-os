from datetime import datetime
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
    # Continua uma conversa existente. Ausente = abre uma nova.
    thread_id: UUID | None = None
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
    thread_id: UUID
    # Chave da trilha desta resposta: com ela a interface abre a auditoria do
    # que aconteceu sem precisar caçar por data e hora.
    run_id: UUID
    answer: str
    generation_mode: Literal["live", "preview"]
    confidence: Literal["alta", "media", "baixa"]
    actions: list[CopilotAction] = Field(default_factory=list)
    sources: list[CopilotSource] = Field(default_factory=list)


class CopilotThreadSummary(BaseModel):
    id: UUID
    title: str | None
    surface: CopilotSurface
    workspace_id: UUID | None
    task_id: UUID | None
    status: Literal["active", "archived"]
    run_count: int
    last_message: str | None
    last_message_at: datetime
    created_at: datetime


class CopilotRunStep(BaseModel):
    position: int
    kind: Literal["dossier", "plan", "action", "persist"]
    label: str
    status: Literal["ok", "skipped", "blocked", "failed"]
    detail: str | None
    payload: dict[str, Any] = Field(default_factory=dict)
    duration_ms: int | None


class CopilotRunTrace(BaseModel):
    """O que aconteceu numa execução. Não é o que o copiloto disse que fez."""
    id: UUID
    thread_id: UUID
    message: str
    answer: str | None
    status: Literal["running", "completed", "failed"]
    error_message: str | None
    # `preview` = prévia local, nenhum token gasto e nenhum modelo consultado.
    generation_mode: Literal["live", "preview"] | None
    provider: str | None
    model: str | None
    confidence: str | None
    dossier_summary: dict[str, Any] = Field(default_factory=dict)
    memories_used: list[dict[str, Any]] = Field(default_factory=list)
    skills_used: list[str] = Field(default_factory=list)
    sources: list[dict[str, Any]] = Field(default_factory=list)
    actions: list[dict[str, Any]] = Field(default_factory=list)
    input_tokens: int | None
    output_tokens: int | None
    # Nulo = modelo sem preço conhecido em `model_pricing.py`. Nunca estimado.
    cost_cents: int | None
    duration_ms: int | None
    created_at: datetime
    steps: list[CopilotRunStep] = Field(default_factory=list)


class CopilotUsageSummary(BaseModel):
    runs: int
    failed_runs: int
    preview_runs: int
    # Execuções ao vivo cujo modelo não tem preço na tabela — ficam de fora do
    # total em vez de entrarem como zero.
    runs_without_cost: int
    input_tokens: int
    output_tokens: int
    cost_cents: int
    avg_duration_ms: int


class CopilotCommand(BaseModel):
    """Item do menu de `/` na interface."""
    name: str
    label: str
    description: str
    requires_confirmation: bool


PlanStatus = Literal[
    "pending_approval", "approved", "running", "completed", "failed", "rejected", "cancelled"
]
PlanStepStatus = Literal["pending", "running", "executed", "failed", "skipped", "blocked"]


class CopilotPlanRequest(BaseModel):
    """Objetivo em linguagem natural — o copiloto monta a sequência."""
    goal: str = Field(min_length=2, max_length=2000)
    workspace_id: UUID | None = None


class CopilotPlanStep(BaseModel):
    id: UUID
    position: int
    action_name: str
    label: str
    params: dict[str, Any] = Field(default_factory=dict)
    why: str = ""
    status: PlanStepStatus
    detail: str | None = None
    undo_hint: str | None = None


class CopilotPlan(BaseModel):
    id: UUID
    workspace_id: UUID | None
    goal: str
    summary: str
    status: PlanStatus
    generation_mode: Literal["live", "preview"]
    # Etapas que continuam pedindo confirmação individual mesmo com o plano
    # aprovado (ação visível ao cliente).
    requires_confirmation_count: int
    error_message: str | None = None
    steps: list[CopilotPlanStep] = Field(default_factory=list)
    # Perguntas que o plano não conseguiu responder sozinho — substituem o
    # formulário que o usuário teria que preencher antes.
    open_questions: list[str] = Field(default_factory=list)
