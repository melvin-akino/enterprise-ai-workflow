from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from ..models.task import TaskStatus, TaskPriority


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.medium
    assigned_to: Optional[UUID] = None
    due_date: Optional[datetime] = None
    confirmed: bool = False


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assigned_to: Optional[UUID] = None
    due_date: Optional[datetime] = None
    confirmed: bool = False


class TaskOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    user_id: UUID
    assigned_to: Optional[UUID]
    due_date: Optional[datetime]
    ai_reasoning: Optional[str]
    ai_recommendation: Optional[str]
    confirmed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AIAnalysis(BaseModel):
    reasoning: str
    recommendation: str
    risks: list[str]
    conflicts: list[str]
    confidence: float
    confirmation_required: bool
    confirmation_message: str
    task: Optional[TaskOut] = None
