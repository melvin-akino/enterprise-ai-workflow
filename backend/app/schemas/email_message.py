from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from ..models.email_message import EmailStatus


class EmailCreate(BaseModel):
    subject: str
    body: str
    from_email: EmailStr
    to_email: EmailStr
    cc_emails: Optional[List[str]] = None
    scheduled_at: Optional[datetime] = None
    confirmed: bool = False


class EmailUpdate(BaseModel):
    subject: Optional[str] = None
    body: Optional[str] = None
    to_email: Optional[EmailStr] = None
    cc_emails: Optional[List[str]] = None
    scheduled_at: Optional[datetime] = None
    confirmed: bool = False


class EmailOut(BaseModel):
    id: UUID
    subject: str
    body: str
    from_email: str
    to_email: str
    cc_emails: Optional[List[str]]
    status: EmailStatus
    user_id: UUID
    ai_reasoning: Optional[str]
    confirmed: bool
    scheduled_at: Optional[datetime]
    sent_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmailAIAnalysis(BaseModel):
    reasoning: str
    recommendation: str
    risks: list[str]
    conflicts: list[str]
    confidence: float
    confirmation_required: bool
    confirmation_message: str
    email: Optional[EmailOut] = None
