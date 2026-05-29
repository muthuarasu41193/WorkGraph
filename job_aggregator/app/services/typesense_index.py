"""
Typesense job search — typo-tolerant full-text search with SQL fallback.

Requires Typesense running (docker compose typesense service).
"""

from __future__ import annotations

import logging
import os
import time
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.schemas import JobPublic, PaginatedJobs
from app.models import Job

LOG = logging.getLogger(__name__)

COLLECTION = os.getenv("TYPESENSE_COLLECTION", "workgraph_jobs")

TYPESENSE_HOST = os.getenv("TYPESENSE_HOST", "localhost")
TYPESENSE_PORT = os.getenv("TYPESENSE_PORT", "8108")
TYPESENSE_PROTOCOL = os.getenv("TYPESENSE_PROTOCOL", "http")
TYPESENSE_API_KEY = os.getenv("TYPESENSE_API_KEY", "workgraph_typesense_dev")


def typesense_enabled() -> bool:
    return os.getenv("TYPESENSE_DISABLED", "").lower() not in ("1", "true", "yes")


def _client():
    import typesense

    return typesense.Client(
        {
            "nodes": [
                {
                    "host": TYPESENSE_HOST,
                    "port": TYPESENSE_PORT,
                    "protocol": TYPESENSE_PROTOCOL,
                }
            ],
            "api_key": TYPESENSE_API_KEY,
            "connection_timeout_seconds": 5,
        }
    )


def collection_schema() -> dict[str, Any]:
    return {
        "name": COLLECTION,
        "fields": [
            {"name": "job_id", "type": "int32"},
            {"name": "title", "type": "string"},
            {"name": "company", "type": "string"},
            {"name": "location", "type": "string"},
            {"name": "description", "type": "string"},
            {"name": "source", "type": "string", "facet": True},
            {"name": "apply_url", "type": "string", "optional": True},
            {"name": "posted_at", "type": "int64", "optional": True},
            {"name": "is_community", "type": "bool", "facet": True},
            {"name": "remote_type", "type": "string", "facet": True, "optional": True},
            {"name": "kind", "type": "string", "facet": True, "optional": True},
        ],
        "default_sorting_field": "posted_at",
    }


def ensure_collection(*, recreate: bool = False) -> None:
    client = _client()
    if recreate:
        try:
            client.collections[COLLECTION].delete()
        except Exception:
            pass
    try:
        client.collections[COLLECTION].retrieve()
    except Exception:
        client.collections.create(collection_schema())
        LOG.info("Created Typesense collection %s", COLLECTION)


def _job_document(job: Job) -> dict[str, Any]:
    posted = int(job.posted_at.timestamp()) if job.posted_at else int(time.time())
    remote = getattr(job, "remote_type", None) or ""
    return {
        "id": str(job.id),
        "job_id": job.id,
        "title": job.title or "",
        "company": job.company or "",
        "location": job.location or "",
        "description": (job.description or "")[:8000],
        "source": job.source or "other",
        "apply_url": job.apply_url or "",
        "posted_at": posted,
        "is_community": bool(job.is_community),
        "remote_type": remote,
        "kind": job.kind or "listing",
    }


def index_jobs_batch(jobs: list[Job], *, batch_size: int = 100) -> int:
    if not jobs:
        return 0
    ensure_collection()
    client = _client()
    indexed = 0
    for i in range(0, len(jobs), batch_size):
        chunk = jobs[i : i + batch_size]
        docs = [_job_document(j) for j in chunk]
        client.collections[COLLECTION].documents.import_(docs, {"action": "upsert"})
        indexed += len(docs)
    return indexed


def sync_all_jobs(session: Session, *, limit: int = 5000) -> dict[str, int]:
    """Upsert all jobs from Postgres/SQLite into Typesense."""
    if not typesense_enabled():
        return {"indexed": 0, "skipped": True}
    rows = session.scalars(select(Job).order_by(Job.id.desc()).limit(limit)).all()
    count = index_jobs_batch(list(rows))
    return {"indexed": count, "db_rows": len(rows)}


def search_jobs_typesense(
    *,
    q: str,
    page: int = 1,
    page_size: int = 20,
    source: str | None = None,
    community: bool | None = None,
    remote_type: str | None = None,
) -> PaginatedJobs | None:
    """Return paginated jobs from Typesense, or None if unavailable."""
    if not typesense_enabled() or not q.strip():
        return None
    try:
        ensure_collection()
        client = _client()
        filters: list[str] = []
        if source:
            filters.append(f"source:={source}")
        if community is not None:
            filters.append(f"is_community:={'true' if community else 'false'}")
        if remote_type:
            filters.append(f"remote_type:={remote_type}")

        params: dict[str, Any] = {
            "q": q,
            "query_by": "title,company,location,description,source",
            "per_page": page_size,
            "page": page,
            "typo_tolerance": 2,
        }
        if filters:
            params["filter_by"] = " && ".join(filters)

        result = client.collections[COLLECTION].documents.search(params)
        hits = result.get("hits") or []
        total = int(result.get("found") or 0)
        items: list[JobPublic] = []
        for hit in hits:
            doc = hit.get("document") or {}
            job_id = int(doc.get("job_id") or doc.get("id") or 0)
            posted_ts = doc.get("posted_at")
            posted_at = None
            if posted_ts:
                from datetime import datetime, timezone

                posted_at = datetime.fromtimestamp(int(posted_ts), tz=timezone.utc)
            items.append(
                JobPublic(
                    id=job_id,
                    title=str(doc.get("title") or ""),
                    company=str(doc.get("company") or ""),
                    location=str(doc.get("location") or ""),
                    source=str(doc.get("source") or ""),
                    source_url=str(doc.get("apply_url") or ""),
                    snippet=(str(doc.get("description") or ""))[:320],
                    tags=[],
                    posted_at=posted_at,
                    is_community=bool(doc.get("is_community")),
                    kind=str(doc.get("kind") or "listing"),
                    classification="employer_hiring",
                )
            )
        total_pages = max(1, (total + page_size - 1) // page_size) if total else 0
        return PaginatedJobs(
            items=items,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )
    except Exception as exc:
        LOG.warning("Typesense search unavailable: %s", exc)
        return None
