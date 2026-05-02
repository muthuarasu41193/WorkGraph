"""SQLAlchemy ORM models."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Job(Base):
    """
    Normalized job posting.

    Unique constraints:
      - external_id: stable ATS identifier (e.g. greenhouse:12345).
      - apply_url: canonical application URL (dedupe key per requirements).
    """

    __tablename__ = "jobs"
    __table_args__ = (
        UniqueConstraint("apply_url", name="uq_jobs_apply_url"),
        UniqueConstraint("external_id", name="uq_jobs_external_id"),
        Index("ix_jobs_source_posted_at", "source", "posted_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(512), nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False, default="")
    company: Mapped[str] = mapped_column(String(512), nullable=False, default="")
    location: Mapped[str] = mapped_column(String(512), nullable=False, default="")
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    apply_url: Mapped[str] = mapped_column(String(4096), nullable=False)
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Embedding payload as JSON array of floats (portable across SQLite & Postgres).
    embedding_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding_model_version: Mapped[str | None] = mapped_column(String(128), nullable=True)

    # SHA-256 hex digest of canonical text used for embedding — skip re-encode when unchanged.
    content_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)

