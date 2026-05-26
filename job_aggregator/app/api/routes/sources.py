"""GET /sources — distinct sources with row counts."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_job_service
from app.domain.schemas import SourcesResponse
from app.services.job_service import JobService

router = APIRouter()


@router.get("", response_model=SourcesResponse)
def list_sources(
    community: bool | None = Query(None, description="Filter summaries to community or ATS rows"),
    service: JobService = Depends(get_job_service),
) -> SourcesResponse:
    return service.list_sources(community=community)
