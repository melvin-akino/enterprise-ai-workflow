from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from ..database import get_db
from ..models.schedule import Schedule, ScheduleStatus
from ..models.user import User
from ..middleware.auth import get_current_active_user, check_resource_access
from ..schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleOut, ScheduleAIAnalysis
from ..services import claude_service
from ..services.audit_service import log_action

router = APIRouter()


def _build_context(db: Session, user: User) -> dict:
    upcoming = db.query(Schedule).filter(
        Schedule.user_id == user.id,
        Schedule.status.in_([ScheduleStatus.scheduled, ScheduleStatus.draft]),
    ).order_by(Schedule.start_time).limit(20).all()
    return {
        "user": {"id": str(user.id), "role": user.role},
        "upcoming_events": [
            {
                "id": str(s.id), "title": s.title,
                "start": str(s.start_time), "end": str(s.end_time),
                "status": s.status,
            }
            for s in upcoming
        ],
    }


@router.get("/", response_model=List[ScheduleOut])
def list_schedules(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role in ("admin", "manager"):
        return db.query(Schedule).order_by(Schedule.start_time).all()
    return db.query(Schedule).filter(Schedule.user_id == current_user.id).order_by(Schedule.start_time).all()


@router.get("/{schedule_id}", response_model=ScheduleOut)
def get_schedule(schedule_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    s = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Schedule not found")
    check_resource_access(s.user_id, current_user)
    return s


@router.post("/", response_model=ScheduleAIAnalysis, status_code=201)
def create_schedule(
    payload: ScheduleCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if payload.start_time >= payload.end_time:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")

    context = _build_context(db, current_user)
    analysis = claude_service.analyze_schedule(payload.model_dump(), context)

    if not payload.confirmed:
        return ScheduleAIAnalysis(**analysis)

    sched = Schedule(
        title=payload.title,
        description=payload.description,
        start_time=payload.start_time,
        end_time=payload.end_time,
        location=payload.location,
        attendees=payload.attendees,
        recurrence=payload.recurrence,
        user_id=current_user.id,
        status=ScheduleStatus.scheduled,
        ai_reasoning=analysis.get("reasoning"),
        confirmed=True,
    )
    db.add(sched)
    db.commit()
    db.refresh(sched)

    log_action(
        db, "create_schedule", "schedule",
        user_id=current_user.id, resource_id=sched.id,
        details={"title": sched.title, "start": str(sched.start_time)},
        ip_address=request.client.host if request.client else None,
    )
    return ScheduleAIAnalysis(**analysis, schedule=ScheduleOut.model_validate(sched))


@router.put("/{schedule_id}", response_model=ScheduleAIAnalysis)
def update_schedule(
    schedule_id: UUID,
    payload: ScheduleUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    sched = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Schedule not found")
    check_resource_access(sched.user_id, current_user)

    context = _build_context(db, current_user)
    analysis = claude_service.analyze_schedule(payload.model_dump(exclude_unset=True), context)

    if not payload.confirmed:
        return ScheduleAIAnalysis(**analysis)

    for field, value in payload.model_dump(exclude_unset=True, exclude={"confirmed"}).items():
        if value is not None:
            setattr(sched, field, value)
    db.commit()
    db.refresh(sched)

    log_action(
        db, "update_schedule", "schedule",
        user_id=current_user.id, resource_id=sched.id,
        details=payload.model_dump(exclude={"confirmed"}),
        ip_address=request.client.host if request.client else None,
    )
    return ScheduleAIAnalysis(**analysis, schedule=ScheduleOut.model_validate(sched))


@router.delete("/{schedule_id}", response_model=ScheduleAIAnalysis)
def delete_schedule(
    schedule_id: UUID,
    confirmed: bool = False,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    sched = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Schedule not found")
    check_resource_access(sched.user_id, current_user)

    context = _build_context(db, current_user)
    analysis = claude_service.analyze_schedule({"action": "delete", "schedule_id": str(schedule_id)}, context)
    analysis["confirmation_required"] = True
    analysis["confirmation_message"] = f"Cancel/delete event '{sched.title}'?"

    if not confirmed:
        return ScheduleAIAnalysis(**analysis)

    log_action(
        db, "delete_schedule", "schedule",
        user_id=current_user.id, resource_id=sched.id,
        details={"title": sched.title},
        ip_address=request.client.host if request.client else None,
    )
    db.delete(sched)
    db.commit()
    return ScheduleAIAnalysis(**analysis)
