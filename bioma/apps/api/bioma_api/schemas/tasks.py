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

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str
    group_status: Literal["NOT_STARTED", "ACTIVE", "DONE", "CLOSED"]
    priority: Optional[Literal["Alta", "Média", "Baixa"]] = None
    assignee_id: Optional[UUID] = None
    owner_id: Optional[UUID] = None
    due_date: Optional[datetime] = None
    recurrence: Optional[Literal["none", "weekly", "monthly"]] = "none"

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
