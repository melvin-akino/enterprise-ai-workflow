from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.task import Task
from ..models.email_message import EmailMessage
from ..models.schedule import Schedule
from ..models.summary import Summary, SummaryType
from ..models.user import User
from ..middleware.auth import get_current_active_user
from ..schemas.summary import KnowledgeQuery, KnowledgeResponse
from ..services import claude_service
from ..services.audit_service import log_action

router = APIRouter()


@router.post("/query", response_model=KnowledgeResponse)
def query_knowledge(
    payload: KnowledgeQuery,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    context: dict = {"user": {"id": str(current_user.id), "role": current_user.role}}

    if payload.include_tasks:
        tasks = db.query(Task).filter(Task.user_id == current_user.id).limit(30).all()
        context["tasks"] = [
            {"id": str(t.id), "title": t.title, "status": t.status, "priority": t.priority,
             "description": t.description, "due_date": str(t.due_date) if t.due_date else None}
            for t in tasks
        ]

    if payload.include_emails:
        emails = db.query(EmailMessage).filter(EmailMessage.user_id == current_user.id).limit(20).all()
        context["emails"] = [
            {"id": str(e.id), "subject": e.subject, "to": e.to_email, "status": e.status}
            for e in emails
        ]

    if payload.include_schedules:
        schedules = db.query(Schedule).filter(Schedule.user_id == current_user.id).limit(20).all()
        context["schedules"] = [
            {"id": str(s.id), "title": s.title, "start": str(s.start_time), "end": str(s.end_time), "status": s.status}
            for s in schedules
        ]

    analysis = claude_service.answer_knowledge_query(payload.query, context)

    # Persist the summary
    summary = Summary(
        user_id=current_user.id,
        content=analysis.get("recommendation", ""),
        summary_type=SummaryType.knowledge,
        metadata_={"query": payload.query, "confidence": analysis.get("confidence")},
    )
    db.add(summary)
    db.commit()

    log_action(
        db, "knowledge_query", "knowledge",
        user_id=current_user.id,
        details={"query": payload.query},
        ip_address=request.client.host if request.client else None,
    )

    return KnowledgeResponse(
        answer=analysis.get("recommendation", ""),
        reasoning=analysis.get("reasoning", ""),
        sources=analysis.get("risks", []),
        confidence=analysis.get("confidence", 0.5),
        follow_up_queries=analysis.get("conflicts", []),
    )
