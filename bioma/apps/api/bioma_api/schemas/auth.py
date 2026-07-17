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
    # Sem senha própria (conta só-social futura), o front bloqueia o
    # desvincular do Google com aviso em vez de erro do servidor.
    has_password: bool = True
    organizations: list[OrganizationSummary]


class LoginResponse(BaseModel):
    user: CurrentUserResponse
    expires_at: datetime


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class PasswordResetCreateRequest(BaseModel):
    email: EmailStr


class PasswordResetCreatedResponse(BaseModel):
    id: UUID
    token: str
    path: str
    email: EmailStr
    expires_at: datetime


class PasswordResetPublicResponse(BaseModel):
    email_hint: str
    display_name: str
    expires_at: datetime


class PasswordResetConfirmRequest(BaseModel):
    password: str = Field(min_length=8, max_length=128)
