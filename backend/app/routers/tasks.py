from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from ..database import get_db
from ..models.task import Task
from ..models.user import User
from ..middleware.auth import get_current_active_user, check_resource_access
from ..schemas.task import TaskCreate, TaskUpdate, TaskOut, AIAnalysis
from ..services import claude_service
from ..services.audit_service import log_action

router = APIRouter()


def _build_context(db: Session, user: User) -> dict:
    tasks = db.query(Task).filter(Task.user_id == user.id).limit(20).all()
    return {
        "user": {"id": str(user.id), "role": user.role, "username": user.username},
        "existing_tasks": [
            {
                "id": str(t.id), "title": t.title, "status": t.status,
                "priority": t.priority, "due_date": str(t.due_date) if t.due_date else None,
            }
            for t in tasks
        ],
    }


@router.get("/", response_model=List[TaskOut])
def list_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role == "admin":
        return db.query(Task).order_by(Task.created_at.desc()).all()
    if current_user.role == "manager":
        return db.query(Task).order_by(Task.created_at.desc()).all()
    return db.query(Task).filter(Task.user_id == current_user.id).order_by(Task.created_at.desc()).all()


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    check_resource_access(task.user_id, current_user)
    return task


@router.post("/", response_model=AIAnalysis, status_code=201)
def create_task(
    payload: TaskCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    context = _build_context(db, current_user)
    analysis = claude_service.analyze_task(payload.model_dump(), context)

    if not payload.confirmed:
        return AIAnalysis(**analysis)

    # User confirmed — persist the task
    task = Task(
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        assigned_to=payload.assigned_to,
        due_date=payload.due_date,
        user_id=current_user.id,
        ai_reasoning=analysis.get("reasoning"),
        ai_recommendation=analysis.get("recommendation"),
        confirmed=True,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    log_action(
        db, "create_task", "task",
        user_id=current_user.id, resource_id=task.id,
        details={"title": task.title, "priority": task.priority},
        ip_address=request.client.host if request.client else None,
    )

    return AIAnalysis(**analysis, task=TaskOut.model_validate(task))


@router.put("/{task_id}", response_model=AIAnalysis)
def update_task(
    task_id: UUID,
    payload: TaskUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    check_resource_access(task.user_id, current_user)

    context = _build_context(db, current_user)
    context["current_task"] = {"id": str(task.id), "title": task.title, "status": task.status}
    analysis = claude_service.analyze_task(payload.model_dump(exclude_unset=True), context)

    if not payload.confirmed:
        return AIAnalysis(**analysis)

    for field, value in payload.model_dump(exclude_unset=True, exclude={"confirmed"}).items():
        if value is not None:
            setattr(task, field, value)
    db.commit()
    db.refresh(task)

    log_action(
        db, "update_task", "task",
        user_id=current_user.id, resource_id=task.id,
        details=payload.model_dump(exclude={"confirmed"}),
        ip_address=request.client.host if request.client else None,
    )
    return AIAnalysis(**analysis, task=TaskOut.model_validate(task))


@router.delete("/{task_id}", response_model=AIAnalysis)
def delete_task(
    task_id: UUID,
    confirmed: bool = False,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    check_resource_access(task.user_id, current_user)

    context = _build_context(db, current_user)
    context["task_to_delete"] = {"id": str(task.id), "title": task.title, "status": task.status}
    analysis = claude_service.analyze_task({"action": "delete", "task_id": str(task_id)}, context)
    analysis["confirmation_required"] = True
    analysis["confirmation_message"] = f"Permanently delete task '{task.title}'?"

    if not confirmed:
        return AIAnalysis(**analysis)

    log_action(
        db, "delete_task", "task",
        user_id=current_user.id, resource_id=task.id,
        details={"title": task.title},
        ip_address=request.client.host if request.client else None,
    )
    db.delete(task)
    db.commit()
    return AIAnalysis(**analysis)
