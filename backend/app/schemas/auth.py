from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from ..models.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str | None = None
    role: UserRole = UserRole.user


class UserOut(BaseModel):
    id: UUID
    email: str
    username: str
    full_name: str | None
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
