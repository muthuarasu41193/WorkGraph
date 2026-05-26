"""Sync wrapper for RSS ingest (used by full ATS ingest batch)."""

from __future__ import annotations

import asyncio

from app.ingest.async_rss import fetch_rss_jobs_async


def fetch_rss_jobs() -> list[dict]:
    return asyncio.run(fetch_rss_jobs_async())
