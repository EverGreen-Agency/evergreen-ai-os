from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID

class TaskCustomFieldBase(BaseModel):
    field_name: str
    field_value: str

class TaskCustomField(TaskCustomFieldBase):
    id: UUID
    task_id: UUID

class TaskDependencyBase(BaseModel):
    depends_on_task_id: UUID
    type: str = "waiting_on"

class TaskDependency(TaskDependencyBase):
    id: UUID
    task_id: UUID

class TaskSubtaskBase(BaseModel):
    title: str
    is_completed: bool = False

class TaskSubtaskInput(TaskSubtaskBase):
    id: Optional[UUID] = None

class TaskSubtask(TaskSubtaskBase):
    id: UUID
    task_id: UUID
    created_at: datetime
    updated_at: datetime

class TaskCommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=10_000)
    # Padrão interno: o Hub do Cliente é o mesmo lugar onde ele aprova, então
    # comentário só chega ao cliente quando marcado de propósito.
    client_visible: bool = False


class TaskComment(BaseModel):
    id: UUID
    task_id: UUID
    author_id: Optional[UUID] = None
    author_name: Optional[str] = None
    body: str
    client_visible: bool
    created_at: datetime
    updated_at: datetime


class TaskBase(BaseModel):
    title: str
    # A descrição é a Definição de Pronto (Manual Operacional Bioma v2): é o
    # critério que autoriza mover a tarefa para DONE, não um campo livre.
    description: Optional[str] = None
    status: str
    group_status: Literal["NOT_STARTED", "ACTIVE", "DONE", "CLOSED"]
    priority: Optional[Literal["Alta", "Média", "Baixa"]] = None
    assignee_id: Optional[UUID] = None
    owner_id: Optional[UUID] = None
    due_date: Optional[datetime] = None
    recurrence: Optional[Literal["none", "weekly", "monthly"]] = "none"
    # Frente (lista) define os status; projeto define escopo/contrato/datas.
    project_id: Optional[UUID] = None
    # Subtarefa real: preenchido quando o trabalho trocou de responsável ou de
    # prazo. Para etapas internas sem troca de mão, use `subtasks` (checklist).
    parent_task_id: Optional[UUID] = None

class TaskCreate(TaskBase):
    custom_fields: list[TaskCustomFieldBase] = Field(default_factory=list)
    dependencies: list[TaskDependencyBase] = Field(default_factory=list)
    subtasks: list[TaskSubtaskInput] = Field(default_factory=list)

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    group_status: Optional[Literal["NOT_STARTED", "ACTIVE", "DONE", "CLOSED"]] = None
    priority: Optional[Literal["Alta", "Média", "Baixa"]] = None
    assignee_id: Optional[UUID] = None
    owner_id: Optional[UUID] = None
    due_date: Optional[datetime] = None
    recurrence: Optional[Literal["none", "weekly", "monthly"]] = None
    project_id: Optional[UUID] = None
    parent_task_id: Optional[UUID] = None
    custom_fields: Optional[list[TaskCustomFieldBase]] = None
    dependencies: Optional[list[TaskDependencyBase]] = None
    subtasks: Optional[list[TaskSubtaskInput]] = None

class Task(TaskBase):
    id: UUID
    list_id: UUID
    external_source: Optional[str] = None
    external_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    custom_fields: list[TaskCustomField] = Field(default_factory=list)
    dependencies: list[TaskDependency] = Field(default_factory=list)
    subtasks: list[TaskSubtask] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)

class TaskListBase(BaseModel):
    name: str
    type: Literal["social", "growth", "tech", "general"]

class TaskListCreate(TaskListBase):
    pass

class TaskList(TaskListBase):
    id: UUID
    workspace_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
