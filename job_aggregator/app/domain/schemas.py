"""Public API schemas — unified job shape for clients."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class JobPublic(BaseModel):
    id: int
    title: str
    company: str
    location: str
    source: str
    source_url: str
    snippet: str
    tags: list[str] = Field(default_factory=list)
    posted_at: datetime | None = None
    is_community: bool = False
    kind: str = "listing"
    classification: str = "employer_hiring"


class PaginatedJobs(BaseModel):
    items: list[JobPublic]
    page: int
    page_size: int
    total: int
    total_pages: int


class SourceSummary(BaseModel):
    source: str
    count: int
    is_community: bool


class SourcesResponse(BaseModel):
    sources: list[SourceSummary]
    total_jobs: int
