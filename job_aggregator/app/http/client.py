"""Async HTTP client with retries (community ingest + future scaling)."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from app.config import HTTP_MAX_RETRIES, HTTP_TIMEOUT_SECONDS

LOG = logging.getLogger(__name__)

_DEFAULT_HEADERS = {
    "Accept": "application/json, text/plain, application/xml, application/rss+xml, application/atom+xml",
    "User-Agent": "WorkGraphJobAggregator/2.0 (+https://github.com/workgraph)",
}


async def fetch_text(
    url: str,
    *,
    params: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
) -> str | None:
    merged = {**_DEFAULT_HEADERS, **(headers or {})}
    backoff = 1.0
    last_exc: Exception | None = None
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT_SECONDS, follow_redirects=True) as client:
        for attempt in range(HTTP_MAX_RETRIES):
            try:
                resp = await client.get(url, params=params, headers=merged)
                if resp.status_code == 429 or 500 <= resp.status_code < 600:
                    LOG.warning("HTTP %s for %s (attempt %s)", resp.status_code, url, attempt + 1)
                    await asyncio.sleep(backoff)
                    backoff = min(backoff * 2, 30)
                    continue
                resp.raise_for_status()
                return resp.text
            except Exception as exc:
                last_exc = exc
                LOG.warning("Async request failed %s attempt %s: %s", url, attempt + 1, exc)
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 30)
    LOG.error("Giving up on %s: %s", url, last_exc)
    return None


async def fetch_json(
    url: str,
    *,
    params: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
) -> Any | None:
    text_headers = {**(headers or {}), "Accept": "application/json"}
    raw = await fetch_text(url, params=params, headers=text_headers)
    if raw is None:
        return None
    try:
        import json

        return json.loads(raw)
    except ValueError as exc:
        LOG.warning("JSON decode failed for %s: %s", url, exc)
        return None
