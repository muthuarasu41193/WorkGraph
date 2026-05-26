"""FastAPI dependencies."""

from __future__ import annotations

import os
from collections.abc import Generator

from fastapi import Header, HTTPException, status
from sqlalchemy.orm import Session

from app.config import use_supabase_rest_reads
from app.database import get_session
from app.services.job_service import JobService


def get_db() -> Generator[Session, None, None]:
    session = get_session()
    try:
        yield session
    finally:
        session.close()


def get_job_service() -> Generator[JobService, None, None]:
    if use_supabase_rest_reads():
        yield JobService.from_rest()
        return
    session = get_session()
    try:
        yield JobService.from_session(session)
    finally:
        session.close()


def verify_ingest_key(authorization: str | None = Header(default=None)) -> None:
    """Protect POST /ingest — set JOB_AGGREGATOR_API_KEY or reuse CRON_SECRET."""
    expected = (os.getenv("JOB_AGGREGATOR_API_KEY") or os.getenv("CRON_SECRET") or "").strip()
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ingest API disabled: set JOB_AGGREGATOR_API_KEY or CRON_SECRET",
        )
    token = ""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    if token != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid ingest token")
