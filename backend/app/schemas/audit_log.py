from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Any, Dict


class AuditLogOut(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    action: str
    resource_type: str
    resource_id: Optional[UUID]
    details: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
