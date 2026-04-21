import uuid
from datetime import datetime
from sqlalchemy import String, Text, Enum, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from ..database import Base
import enum


class SummaryType(str, enum.Enum):
    task = "task"
    email = "email"
    schedule = "schedule"
    knowledge = "knowledge"
    daily = "daily"


class Summary(Base):
    __tablename__ = "summaries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    summary_type: Mapped[SummaryType] = mapped_column(Enum(SummaryType), nullable=False, index=True)
    source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=True)
    source_type: Mapped[str] = mapped_column(String(50), nullable=True)
    metadata_: Mapped[dict] = mapped_column(JSONB, nullable=True, name="metadata")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
