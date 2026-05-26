"""SQLAlchemy queries for jobs — no HTTP or ingest logic."""

from __future__ import annotations

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.models import Job


class JobRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def _apply_filters(
        self,
        stmt: Select,
        *,
        source: str | None = None,
        sources: list[str] | None = None,
        community: bool | None = None,
        q: str | None = None,
    ) -> Select:
        if community is not None:
            stmt = stmt.where(Job.is_community.is_(community))
        if source:
            stmt = stmt.where(Job.source == source.strip().lower())
        elif sources:
            normalized = [s.strip().lower() for s in sources if s.strip()]
            if normalized:
                stmt = stmt.where(Job.source.in_(normalized))
        if q:
            pattern = f"%{q.strip()}%"
            stmt = stmt.where(
                or_(
                    Job.title.ilike(pattern),
                    Job.company.ilike(pattern),
                    Job.location.ilike(pattern),
                    Job.description.ilike(pattern),
                )
            )
        return stmt

    def count(
        self,
        *,
        source: str | None = None,
        sources: list[str] | None = None,
        community: bool | None = None,
        q: str | None = None,
    ) -> int:
        stmt = self._apply_filters(
            select(func.count(Job.id)),
            source=source,
            sources=sources,
            community=community,
            q=q,
        )
        return int(self._session.scalar(stmt) or 0)

    def list_jobs(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        source: str | None = None,
        sources: list[str] | None = None,
        community: bool | None = None,
        q: str | None = None,
    ) -> list[Job]:
        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset = (page - 1) * page_size
        stmt = self._apply_filters(
            select(Job),
            source=source,
            sources=sources,
            community=community,
            q=q,
        )
        stmt = stmt.order_by(Job.posted_at.desc().nullslast(), Job.id.desc()).offset(offset).limit(page_size)
        return list(self._session.scalars(stmt).all())

    def source_summaries(self, *, community: bool | None = None) -> list[tuple[str, int, bool]]:
        stmt = select(Job.source, func.count(Job.id), Job.is_community).group_by(Job.source, Job.is_community)
        if community is not None:
            stmt = stmt.where(Job.is_community.is_(community))
        stmt = stmt.order_by(func.count(Job.id).desc())
        rows = self._session.execute(stmt).all()
        return [(str(src), int(cnt), bool(is_comm)) for src, cnt, is_comm in rows]

    def total_count(self) -> int:
        return int(self._session.scalar(select(func.count()).select_from(Job)) or 0)
