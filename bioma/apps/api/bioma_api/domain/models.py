from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, EmailStr


class Role(StrEnum):
    eg_admin = "eg_admin"
    client_user = "client_user"


class User(BaseModel):
    id: UUID
    email: EmailStr
    display_name: str


class Organization(BaseModel):
    id: UUID
    name: str


class Membership(BaseModel):
    user_id: UUID
    organization_id: UUID
    role: Role
