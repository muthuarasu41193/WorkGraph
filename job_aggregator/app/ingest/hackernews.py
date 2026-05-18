"""
Hacker News job-ish posts via the public Algolia search API.

Endpoint:
  GET https://hn.algolia.com/api/v1/search_by_date
"""

from __future__ import annotations

import os
import re
from typing import Any

from app.ingest.base import compact_text, env_int, host_label, normalize_job, parse_datetime
from app.utils import LOG, http_get_json, strip_html_to_text

_TITLE_RE = re.compile(
    r"\b(hiring|who is hiring|engineer|developer|designer|remote|job|jobs|career|opening|role)\b",
    re.I,
)


def fetch_hackernews_jobs() -> list[dict[str, Any]]:
    query = str(os.getenv("HN_SEARCH_QUERY", "hiring remote engineer") or "").strip()
    limit = env_int("HN_LIMIT", 40, min_value=1, max_value=100)
    payload = http_get_json(
        "https://hn.algolia.com/api/v1/search_by_date",
        params={"query": query, "tags": "story", "hitsPerPage": limit},
    )
    if not isinstance(payload, dict):
        LOG.warning("HackerNews unexpected payload")
        return []

    hits = payload.get("hits")
    if not isinstance(hits, list):
        return []

    normalized: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    for hit in hits:
        if not isinstance(hit, dict):
            continue

        object_id = str(hit.get("objectID") or "").strip()
        title = str(hit.get("title") or hit.get("story_title") or "").strip()
        if not object_id or not title or not _TITLE_RE.search(title):
            continue

        apply_url = str(hit.get("url") or "").strip()
        if not apply_url:
            apply_url = f"https://news.ycombinator.com/item?id={object_id}"
        if apply_url in seen_urls:
            continue

        description = compact_text(
            str(hit.get("story_text") or "").strip(),
            strip_html_to_text(str(hit.get("comment_text") or "").strip()),
            f"Points: {hit.get('points')}" if hit.get("points") is not None else "",
            f"Author: {hit.get('author')}" if hit.get("author") else "",
        )
        company = host_label(apply_url) or "Hacker News"

        row = normalize_job(
            source="hackernews",
            external_id=f"hackernews:{object_id}",
            title=title,
            company=company,
            location="Internet",
            description=description,
            apply_url=apply_url,
            posted_at=parse_datetime(hit.get("created_at")),
        )
        if row is None:
            continue
        normalized.append(row)
        seen_urls.add(apply_url)

    LOG.info("HackerNews normalized_jobs=%s", len(normalized))
    return normalized
