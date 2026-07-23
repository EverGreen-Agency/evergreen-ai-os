from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class GitHubConnectionInput(BaseModel):
    repository: str = Field(min_length=3, max_length=240, examples=["evergreen-ai-os/bioma"])
    default_branch: str = Field(default="main", min_length=1, max_length=240)
    status: Literal["active", "paused"] = "active"

    @field_validator("repository")
    @classmethod
    def valid_repository(cls, value: str) -> str:
        normalized = value.strip().removeprefix("https://github.com/").removesuffix(".git").strip("/")
        parts = normalized.split("/")
        if len(parts) != 2 or not all(parts):
            raise ValueError("Informe o repositório no formato owner/repository.")
        return normalized


class GitHubConnectionSummary(BaseModel):
    id: UUID
    project_id: UUID
    repository: str
    default_branch: str
    status: Literal["active", "paused"]
    updated_at: datetime


class GitHubIssueSummary(BaseModel):
    number: int
    title: str
    state: str
    url: str
    labels: list[str]
    updated_at: datetime


class GitHubPullRequestSummary(BaseModel):
    number: int
    title: str
    state: str
    draft: bool
    url: str
    source_branch: str
    target_branch: str
    updated_at: datetime


class GitHubCommitSummary(BaseModel):
    sha: str
    message: str
    url: str
    author_name: str | None = None
    authored_at: datetime | None = None


class GitHubProjectActivity(BaseModel):
    project_id: UUID
    repository: str
    default_branch: str
    fetched_at: datetime
    issues: list[GitHubIssueSummary]
    pull_requests: list[GitHubPullRequestSummary]
    commits: list[GitHubCommitSummary]
