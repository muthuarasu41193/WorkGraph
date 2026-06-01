"""
Runs the community / public-feed job sources as one batch.

This module does not persist rows by itself; it returns normalized rows so the
caller can either inspect, persist, or merge them into the main ingest flow.
"""

from __future__ import annotations

import re
from typing import Any, Callable

from app.ingest.arbeitnow import fetch_arbeitnow_jobs
from app.ingest.hackernews import fetch_hackernews_jobs
from app.ingest.jobicy import fetch_jobicy_jobs
from app.ingest.reddit import fetch_reddit_jobs
from app.ingest.remotejobs_org import fetch_remotejobs_jobs
from app.ingest.remoteok import fetch_remoteok_jobs
from app.ingest.rss_feeds import fetch_rss_jobs
from app.utils import LOG

FetchFn = Callable[[], list[dict[str, Any]]]

# Live job boards first so RSS duplicates keep board source + is_community=false.
_FETCHERS: dict[str, FetchFn] = {
    "remoteok": fetch_remoteok_jobs,
    "jobicy": fetch_jobicy_jobs,
    "arbeitnow": fetch_arbeitnow_jobs,
    "remotejobs": fetch_remotejobs_jobs,
    "reddit": fetch_reddit_jobs,
    "hackernews": fetch_hackernews_jobs,
    "rss": fetch_rss_jobs,
}

# Job boards ingested alongside community feeds but stored as live listings (Jobs tab).
_LIVE_LISTING_SOURCES = frozenset({"remoteok", "jobicy", "arbeitnow", "remotejobs"})

_REMOTE_RE = re.compile(r"\bremote\b", re.I)
_INTERNSHIP_RE = re.compile(r"\b(intern|internship)\b", re.I)
_FREELANCE_RE = re.compile(r"\b(freelance|contract|gig|seeking freelancer|looking for freelancer)\b", re.I)
_FOR_HIRE_RE = re.compile(r"\b(for hire|available for hire|who wants to be hired|candidate|seeking work)\b", re.I)
_HIRING_RE = re.compile(r"\b(hiring|we are hiring|job opening|role open|position open|vacancy)\b", re.I)


def _classify(row: dict[str, Any]) -> tuple[str, str]:
    source = str(row.get("source") or "").strip().lower()
    text = " ".join(
        str(row.get(key) or "").strip()
        for key in ("title", "company", "location", "description")
    )
    text = text.lower()

    kind = "listing" if source in {"remoteok", "jobicy", "arbeitnow", "remotejobs"} else "post"
    if _INTERNSHIP_RE.search(text):
        return kind, "internship"
    if _FOR_HIRE_RE.search(text):
        return "post", "candidate_for_hire"
    if _FREELANCE_RE.search(text):
        return "post", "freelance"
    if _REMOTE_RE.search(text) and kind == "listing":
        return kind, "remote"
    if _HIRING_RE.search(text):
        return kind, "employer_hiring"
    if _REMOTE_RE.search(text):
        return kind, "remote"
    return kind, "discussion_only"


def _normalize_community_row(row: dict[str, Any]) -> dict[str, Any]:
    kind, classification = _classify(row)
    source = str(row.get("source") or "").strip().lower()
    out = dict(row)
    out["kind"] = str(row.get("kind") or kind)
    out["classification"] = str(row.get("classification") or classification)
    out["is_community"] = source not in _LIVE_LISTING_SOURCES
    return out


def fetch_public_feed_jobs() -> list[dict[str, Any]]:
    all_rows: list[dict[str, Any]] = []
    seen_apply_urls: set[str] = set()
    per_source_counts: dict[str, int] = {}

    for name, fetcher in _FETCHERS.items():
        try:
            rows = fetcher()
        except Exception as exc:
            LOG.exception("Public feed fetch failed source=%s err=%s", name, exc)
            per_source_counts[name] = 0
            continue

        kept = 0
        for row in rows:
            row = _normalize_community_row(row)
            apply_url = str(row.get("apply_url") or "").strip()
            if not apply_url or apply_url in seen_apply_urls:
                continue
            all_rows.append(row)
            seen_apply_urls.add(apply_url)
            kept += 1
        per_source_counts[name] = kept

    LOG.info("Public feed sync complete total=%s breakdown=%s", len(all_rows), per_source_counts)
    return all_rows


def fetch_public_feed_stats() -> dict[str, int]:
    stats: dict[str, int] = {}
    for name, fetcher in _FETCHERS.items():
        try:
            stats[name] = len(fetcher())
        except Exception as exc:
            LOG.exception("Public feed stats failed source=%s err=%s", name, exc)
            stats[name] = 0
    return stats
