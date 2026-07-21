from pydantic import BaseModel, ConfigDict
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
    custom_fields: list[TaskCustomFieldBase] = []
    dependencies: list[TaskDependencyBase] = []
    subtasks: list[TaskSubtaskBase] = []

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

class Task(TaskBase):
    id: UUID
    list_id: UUID
    created_at: datetime
    updated_at: datetime
    custom_fields: list[TaskCustomField] = []
    dependencies: list[TaskDependency] = []
    subtasks: list[TaskSubtask] = []
    
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
