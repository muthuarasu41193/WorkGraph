"""GET /jobs — paginated listing with optional source and community filters."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_job_service
from app.domain.schemas import PaginatedJobs
from app.services.job_service import JobService

router = APIRouter()


@router.get("", response_model=PaginatedJobs)
def list_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    source: str | None = Query(None, description="Filter by a single source (e.g. reddit, greenhouse)"),
    sources: str | None = Query(None, description="Comma-separated source list"),
    community: bool | None = Query(
        None,
        description="true = community/social posts only; false = live ATS jobs only",
    ),
    service: JobService = Depends(get_job_service),
) -> PaginatedJobs:
    source_list = [s.strip() for s in sources.split(",")] if sources else None
    return service.list_jobs(
        page=page,
        page_size=page_size,
        source=source,
        sources=source_list,
        community=community,
    )
