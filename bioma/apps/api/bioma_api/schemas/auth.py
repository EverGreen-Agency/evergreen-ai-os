from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from bioma_api.domain.models import Role


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OrganizationSummary(BaseModel):
    id: UUID
    name: str
    slug: str
    role: Role
    enabled_modules: list[str] = Field(default_factory=list)


class CurrentUserResponse(BaseModel):
    id: UUID
    email: EmailStr
    display_name: str
    organizations: list[OrganizationSummary]


class LoginResponse(BaseModel):
    user: CurrentUserResponse
    expires_at: datetime
