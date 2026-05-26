"""Job read model — maps repository rows to public DTOs."""

from __future__ import annotations

import math
from typing import Any, Protocol

from sqlalchemy.orm import Session

from app.domain.mappers import row_to_public
from app.domain.schemas import PaginatedJobs, SourceSummary, SourcesResponse
from app.repositories.job_repository import JobRepository
from app.repositories.job_repository_rest import JobRepositoryRest


class _JobRepo(Protocol):
    def count(
        self,
        *,
        source: str | None = None,
        sources: list[str] | None = None,
        community: bool | None = None,
        q: str | None = None,
    ) -> int: ...

    def list_jobs(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        source: str | None = None,
        sources: list[str] | None = None,
        community: bool | None = None,
        q: str | None = None,
    ) -> list[Any]: ...

    def source_summaries(self, *, community: bool | None = None) -> list[tuple[str, int, bool]]: ...

    def total_count(self) -> int: ...


class JobService:
    def __init__(self, repo: _JobRepo) -> None:
        self._repo = repo

    @classmethod
    def from_session(cls, session: Session) -> JobService:
        return cls(JobRepository(session))

    @classmethod
    def from_rest(cls) -> JobService:
        return cls(JobRepositoryRest())

    def list_jobs(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        source: str | None = None,
        sources: list[str] | None = None,
        community: bool | None = None,
    ) -> PaginatedJobs:
        total = self._repo.count(source=source, sources=sources, community=community)
        rows = self._repo.list_jobs(
            page=page,
            page_size=page_size,
            source=source,
            sources=sources,
            community=community,
        )
        total_pages = max(1, math.ceil(total / page_size)) if total else 0
        return PaginatedJobs(
            items=[row_to_public(row) for row in rows],
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )

    def search_jobs(
        self,
        *,
        q: str,
        page: int = 1,
        page_size: int = 20,
        source: str | None = None,
        sources: list[str] | None = None,
        community: bool | None = None,
    ) -> PaginatedJobs:
        query = q.strip()
        if not query:
            return PaginatedJobs(items=[], page=page, page_size=page_size, total=0, total_pages=0)
        total = self._repo.count(source=source, sources=sources, community=community, q=query)
        rows = self._repo.list_jobs(
            page=page,
            page_size=page_size,
            source=source,
            sources=sources,
            community=community,
            q=query,
        )
        total_pages = max(1, math.ceil(total / page_size)) if total else 0
        return PaginatedJobs(
            items=[row_to_public(row) for row in rows],
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )

    def list_sources(self, *, community: bool | None = None) -> SourcesResponse:
        summaries = self._repo.source_summaries(community=community)
        return SourcesResponse(
            sources=[
                SourceSummary(source=src, count=cnt, is_community=is_comm)
                for src, cnt, is_comm in summaries
            ],
            total_jobs=self._repo.total_count(),
        )
