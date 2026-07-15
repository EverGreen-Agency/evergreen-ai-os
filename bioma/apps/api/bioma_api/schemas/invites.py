from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from bioma_api.schemas.auth import CurrentUserResponse


class InviteCreateRequest(BaseModel):
    email: EmailStr | None = None
    expires_in_days: int = Field(default=7, ge=1, le=30)


class InviteCreatedResponse(BaseModel):
    id: UUID
    token: str
    path: str
    email: EmailStr | None = None
    expires_at: datetime


class InviteSummary(BaseModel):
    id: UUID
    email: EmailStr | None = None
    expires_at: datetime
    used_at: datetime | None = None
    created_at: datetime


class InvitePublicResponse(BaseModel):
    client_name: str
    organization_name: str
    email: EmailStr | None = None
    expires_at: datetime


class InviteAcceptRequest(BaseModel):
    display_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class InviteAcceptResponse(BaseModel):
    user: CurrentUserResponse
    expires_at: datetime
