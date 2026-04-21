from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from ..database import get_db
from ..models.email_message import EmailMessage, EmailStatus
from ..models.user import User
from ..middleware.auth import get_current_active_user, check_resource_access
from ..schemas.email_message import EmailCreate, EmailUpdate, EmailOut, EmailAIAnalysis
from ..services import claude_service
from ..services.audit_service import log_action

router = APIRouter()


def _build_context(db: Session, user: User) -> dict:
    recent = db.query(EmailMessage).filter(EmailMessage.user_id == user.id).limit(10).all()
    return {
        "user": {"id": str(user.id), "role": user.role, "email": user.email},
        "recent_emails": [
            {"id": str(e.id), "subject": e.subject, "to": e.to_email, "status": e.status}
            for e in recent
        ],
    }


@router.get("/", response_model=List[EmailOut])
def list_emails(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role in ("admin", "manager"):
        return db.query(EmailMessage).order_by(EmailMessage.created_at.desc()).all()
    return db.query(EmailMessage).filter(EmailMessage.user_id == current_user.id).order_by(EmailMessage.created_at.desc()).all()


@router.get("/{email_id}", response_model=EmailOut)
def get_email(email_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    email = db.query(EmailMessage).filter(EmailMessage.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    check_resource_access(email.user_id, current_user)
    return email


@router.post("/", response_model=EmailAIAnalysis, status_code=201)
def create_email(
    payload: EmailCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    context = _build_context(db, current_user)
    analysis = claude_service.analyze_email(payload.model_dump(), context)

    if not payload.confirmed:
        return EmailAIAnalysis(**analysis)

    email = EmailMessage(
        subject=payload.subject,
        body=payload.body,
        from_email=payload.from_email,
        to_email=payload.to_email,
        cc_emails=payload.cc_emails,
        scheduled_at=payload.scheduled_at,
        user_id=current_user.id,
        status=EmailStatus.pending_confirmation,
        ai_reasoning=analysis.get("reasoning"),
        confirmed=True,
    )
    db.add(email)
    db.commit()
    db.refresh(email)

    log_action(
        db, "create_email", "email",
        user_id=current_user.id, resource_id=email.id,
        details={"subject": email.subject, "to": email.to_email},
        ip_address=request.client.host if request.client else None,
    )
    return EmailAIAnalysis(**analysis, email=EmailOut.model_validate(email))


@router.put("/{email_id}", response_model=EmailAIAnalysis)
def update_email(
    email_id: UUID,
    payload: EmailUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    email = db.query(EmailMessage).filter(EmailMessage.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    check_resource_access(email.user_id, current_user)

    context = _build_context(db, current_user)
    analysis = claude_service.analyze_email(payload.model_dump(exclude_unset=True), context)

    if not payload.confirmed:
        return EmailAIAnalysis(**analysis)

    for field, value in payload.model_dump(exclude_unset=True, exclude={"confirmed"}).items():
        if value is not None:
            setattr(email, field, value)
    db.commit()
    db.refresh(email)

    log_action(
        db, "update_email", "email",
        user_id=current_user.id, resource_id=email.id,
        details=payload.model_dump(exclude={"confirmed"}),
        ip_address=request.client.host if request.client else None,
    )
    return EmailAIAnalysis(**analysis, email=EmailOut.model_validate(email))


@router.post("/{email_id}/send", response_model=EmailOut)
def send_email(
    email_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Mark an email as sent (integrate with real email provider as needed)."""
    email = db.query(EmailMessage).filter(EmailMessage.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    check_resource_access(email.user_id, current_user)
    if not email.confirmed:
        raise HTTPException(status_code=400, detail="Email must be confirmed before sending")

    from datetime import datetime, timezone
    email.status = EmailStatus.sent
    email.sent_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(email)

    log_action(
        db, "send_email", "email",
        user_id=current_user.id, resource_id=email.id,
        details={"subject": email.subject, "to": email.to_email},
        ip_address=request.client.host if request.client else None,
    )
    return email
