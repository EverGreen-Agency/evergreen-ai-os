from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

ArtifactStatus = Literal["draft", "approved", "published", "archived"]
ArtifactVisibility = Literal["internal", "client"]


class StudioArtifactVersion(BaseModel):
    id: UUID
    artifact_id: UUID
    version: int
    title: str
    content: str | None = None
    url: str | None = None
    # Preenchido quando ESTA versão saiu de uma execução do copiloto; nulo
    # quando alguém editou à mão. A diferença entre as duas é o que se quer
    # saber ao revisar.
    run_id: UUID | None = None
    change_note: str | None = None
    created_by: UUID | None = None
    created_by_name: str | None = None
    created_at: datetime


class StudioArtifact(BaseModel):
    id: UUID
    organization_id: UUID
    workspace_id: UUID | None = None
    title: str
    # Aberto de propósito: roteiro, post, legenda, prompt de arte, planejamento.
    # Enum aqui obrigaria migração a cada formato novo.
    kind: str
    visibility: ArtifactVisibility
    status: ArtifactStatus
    url: str | None = None
    content: str | None = None
    current_version: int
    versions_total: int = 1
    # Procedência: de qual conversa e execução a peça saiu.
    thread_id: UUID | None = None
    run_id: UUID | None = None
    created_by: UUID | None = None
    created_by_name: str | None = None
    created_at: datetime
    updated_at: datetime


class StudioArtifactDetail(StudioArtifact):
    versions: list[StudioArtifactVersion] = Field(default_factory=list)


class StudioArtifactCreate(BaseModel):
    title: str = Field(min_length=2, max_length=240)
    kind: str = Field(min_length=2, max_length=60)
    content: str | None = None
    url: str | None = Field(default=None, max_length=2000)
    visibility: ArtifactVisibility = "internal"
    status: ArtifactStatus = "draft"
    thread_id: UUID | None = None
    run_id: UUID | None = None
    change_note: str | None = Field(default=None, max_length=500)


class StudioArtifactVersionCreate(BaseModel):
    title: str = Field(min_length=2, max_length=240)
    content: str | None = None
    url: str | None = Field(default=None, max_length=2000)
    run_id: UUID | None = None
    change_note: str | None = Field(default=None, max_length=500)


class StudioArtifactStatusUpdate(BaseModel):
    status: ArtifactStatus


class StudioArtifactKindCount(BaseModel):
    kind: str
    total: int
