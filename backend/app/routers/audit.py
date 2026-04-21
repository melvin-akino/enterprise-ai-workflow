from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from ..database import get_db
from ..models.audit_log import AuditLog
from ..models.user import User, UserRole
from ..middleware.auth import get_current_active_user, require_admin_or_manager
from ..schemas.audit_log import AuditLogOut

router = APIRouter()


@router.get("/", response_model=List[AuditLogOut])
def list_audit_logs(
    resource_type: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    user_id: Optional[UUID] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(AuditLog)

    # Regular users can only see their own audit logs
    if current_user.role == UserRole.user:
        query = query.filter(AuditLog.user_id == current_user.id)
    elif user_id:
        query = query.filter(AuditLog.user_id == user_id)

    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    if action:
        query = query.filter(AuditLog.action == action)

    return (
        query.order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get("/me", response_model=List[AuditLogOut])
def my_audit_logs(
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return (
        db.query(AuditLog)
        .filter(AuditLog.user_id == current_user.id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
