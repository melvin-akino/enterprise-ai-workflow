from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .database import engine, Base
from .routers import auth, tasks, emails, schedules, knowledge, audit

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Enterprise AI Workflow Agent",
    description="AI-powered workflow management with Claude reasoning and audit logging",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(emails.router, prefix="/email", tags=["email"])
app.include_router(schedules.router, prefix="/schedule", tags=["schedule"])
app.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
app.include_router(audit.router, prefix="/audit", tags=["audit"])


@app.get("/health")
def health():
    return {"status": "ok", "environment": settings.ENVIRONMENT}


@app.exception_handler(404)
def not_found(_req, _exc):
    return JSONResponse(status_code=404, content={"detail": "Not found"})
