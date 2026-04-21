from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict, Any
from ..models.schedule import ScheduleStatus


class ScheduleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    attendees: Optional[List[str]] = None
    recurrence: Optional[Dict[str, Any]] = None
    confirmed: bool = False


class ScheduleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    attendees: Optional[List[str]] = None
    status: Optional[ScheduleStatus] = None
    recurrence: Optional[Dict[str, Any]] = None
    confirmed: bool = False


class ScheduleOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    start_time: datetime
    end_time: datetime
    location: Optional[str]
    attendees: Optional[List[str]]
    user_id: UUID
    status: ScheduleStatus
    ai_reasoning: Optional[str]
    confirmed: bool
    recurrence: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ScheduleAIAnalysis(BaseModel):
    reasoning: str
    recommendation: str
    risks: list[str]
    conflicts: list[str]
    confidence: float
    confirmation_required: bool
    confirmation_message: str
    schedule: Optional[ScheduleOut] = None
