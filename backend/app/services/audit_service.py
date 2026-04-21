from uuid import UUID
from typing import Any, Optional
from sqlalchemy.orm import Session
from ..models.audit_log import AuditLog


def log_action(
    db: Session,
    action: str,
    resource_type: str,
    user_id: Optional[UUID] = None,
    resource_id: Optional[UUID] = None,
    details: Optional[dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    entry = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(entry)
    db.commit()
    return entry
