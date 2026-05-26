"""
Community-only ingest: Reddit JSON + RSS feeds (async fetch, sync persist).
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from sqlalchemy.orm import Session

from app.ingest.async_reddit import fetch_reddit_jobs_async
from app.ingest.async_rss import fetch_rss_jobs_async
from app.ingest.runner import persist_normalized_jobs
from app.ingest.sync_rss import _normalize_community_row

LOG = logging.getLogger(__name__)


async def fetch_community_jobs_async() -> list[dict[str, Any]]:
    reddit_task = fetch_reddit_jobs_async()
    rss_task = fetch_rss_jobs_async()
    reddit_rows, rss_rows = await asyncio.gather(reddit_task, rss_task)

    all_rows: list[dict[str, Any]] = []
    seen_apply_urls: set[str] = set()
    per_source: dict[str, int] = {"reddit": 0, "rss": 0}

    for batch, name in ((reddit_rows, "reddit"), (rss_rows, "rss")):
        kept = 0
        for row in batch:
            row = _normalize_community_row(row)
            apply_url = str(row.get("apply_url") or "").strip()
            if not apply_url or apply_url in seen_apply_urls:
                continue
            all_rows.append(row)
            seen_apply_urls.add(apply_url)
            kept += 1
        per_source[name] = kept

    LOG.info("Community async fetch total=%s breakdown=%s", len(all_rows), per_source)
    return all_rows


def run_community_ingestion(session: Session) -> dict[str, Any]:
    rows = asyncio.run(fetch_community_jobs_async())
    counts = persist_normalized_jobs(session, rows)
    return {
        "normalized_rows": len(rows),
        "sources": {"reddit": sum(1 for r in rows if r.get("source") == "reddit"), "rss": sum(1 for r in rows if r.get("source") == "rss")},
        **counts,
        "ingestion_backend": "postgresql",
    }
