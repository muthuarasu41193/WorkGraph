"""
Reddit public JSON endpoints for job-related community posts.

Defaults to a small set of recruiting / job-focused subreddits and uses the
 Reddit post permalink as the direct destination URL.
"""

from __future__ import annotations

import os
import re
from typing import Any

from app.ingest.base import compact_text, env_int, normalize_job, parse_datetime, split_csv
from app.utils import LOG, http_get_json

_JOBISH_RE = re.compile(
    r"\b(hiring|job|jobs|career|opening|role|engineer|developer|designer|frontend|backend|full[- ]stack)\b",
    re.I,
)


def _load_subreddits() -> list[str]:
    raw = os.getenv("REDDIT_SUBREDDITS", "forhire,jobbit,remotework,jobs,hireaprogrammer")
    return split_csv(raw)


def _fetch_listing(subreddit: str, *, query: str, limit: int) -> list[dict[str, Any]]:
    if query:
        payload = http_get_json(
            f"https://www.reddit.com/r/{subreddit}/search.json",
            params={"q": query, "restrict_sr": "1", "sort": "new", "limit": limit},
        )
    else:
        payload = http_get_json(f"https://www.reddit.com/r/{subreddit}/new.json", params={"limit": limit})

    if not isinstance(payload, dict):
        return []
    data = payload.get("data")
    if not isinstance(data, dict):
        return []
    children = data.get("children")
    if not isinstance(children, list):
        return []
    rows: list[dict[str, Any]] = []
    for child in children:
        if isinstance(child, dict) and isinstance(child.get("data"), dict):
            rows.append(child["data"])
    return rows


def fetch_reddit_jobs() -> list[dict[str, Any]]:
    subreddits = _load_subreddits()
    if not subreddits:
        return []

    query = str(os.getenv("REDDIT_SEARCH_QUERY", "") or "").strip()
    limit = env_int("REDDIT_LIMIT_PER_SUBREDDIT", 20, min_value=1, max_value=100)

    normalized: list[dict[str, Any]] = []
    seen_urls: set[str] = set()

    for subreddit in subreddits:
        for post in _fetch_listing(subreddit, query=query, limit=limit):
            title = str(post.get("title") or "").strip()
            if not title:
                continue
            if not query and not _JOBISH_RE.search(title):
                continue

            post_id = str(post.get("id") or "").strip()
            permalink = str(post.get("permalink") or "").strip()
            apply_url = f"https://www.reddit.com{permalink}" if permalink else ""
            if not post_id or not apply_url or apply_url in seen_urls:
                continue

            flair = str(post.get("link_flair_text") or "").strip()
            author = str(post.get("author") or "").strip()
            description = compact_text(
                f"Subreddit: r/{subreddit}",
                f"Flair: {flair}" if flair else "",
                f"Author: u/{author}" if author else "",
                str(post.get("selftext") or "").strip(),
            )
            row = normalize_job(
                source="reddit",
                external_id=f"reddit:{subreddit}:{post_id}",
                title=title,
                company=f"r/{subreddit}",
                location=flair or "Community post",
                description=description,
                apply_url=apply_url,
                posted_at=parse_datetime(post.get("created_utc")),
            )
            if row is None:
                continue
            normalized.append(row)
            seen_urls.add(apply_url)

    LOG.info("Reddit normalized_jobs=%s subreddits=%s", len(normalized), len(subreddits))
    return normalized
