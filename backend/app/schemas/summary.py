from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Any, Dict
from ..models.summary import SummaryType


class SummaryOut(BaseModel):
    id: UUID
    user_id: UUID
    content: str
    summary_type: SummaryType
    source_id: Optional[UUID]
    source_type: Optional[str]
    metadata_: Optional[Dict[str, Any]]
    created_at: datetime

    model_config = {"from_attributes": True}


class KnowledgeQuery(BaseModel):
    query: str
    include_tasks: bool = True
    include_emails: bool = True
    include_schedules: bool = True


class KnowledgeResponse(BaseModel):
    answer: str
    reasoning: str
    sources: list[str]
    confidence: float
    follow_up_queries: list[str]
