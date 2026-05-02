"""
Greenhouse public job board JSON API.

Docs: GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs
Board metadata (company display name): GET .../boards/{board_token}
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.utils import LOG, canonical_job_text, http_get_json, sha256_hex, strip_html_to_text


def _parse_dt(value: Any) -> datetime | None:
    if not value or not isinstance(value, str):
        return None
    try:
        # Greenhouse uses ISO8601 strings like "2024-01-18T22:47:06.858Z"
        normalized = value.replace("Z", "+00:00")
        dt = datetime.fromisoformat(normalized)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return None


def fetch_greenhouse_jobs(board_token: str) -> list[dict[str, Any]]:
    """
    Fetch & normalize jobs for a Greenhouse board token (URL slug).

    Returns standardized dicts ready for persistence (no DB writes).
    """
    token = board_token.strip().lower()
    if not token:
        return []

    board_meta = http_get_json(f"https://boards-api.greenhouse.io/v1/boards/{token}")
    company_name = token
    if isinstance(board_meta, dict):
        company_name = str(board_meta.get("name") or token).strip()

    payload = http_get_json(f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs")
    if not isinstance(payload, dict):
        LOG.warning("Greenhouse unexpected payload for board=%s", token)
        return []

    raw_jobs = payload.get("jobs")
    if not isinstance(raw_jobs, list):
        return []

    normalized: list[dict[str, Any]] = []
    for job in raw_jobs:
        if not isinstance(job, dict):
            continue
        jid = job.get("id")
        if jid is None:
            continue
        title = str(job.get("title") or "").strip()
        apply_url = str(job.get("absolute_url") or "").strip()
        if not apply_url:
            continue

        loc = job.get("location")
        location = ""
        if isinstance(loc, dict):
            location = str(loc.get("name") or "").strip()

        raw_content = job.get("content")
        description = strip_html_to_text(str(raw_content or ""))

        posted_at = _parse_dt(job.get("updated_at")) or _parse_dt(job.get("first_published"))

        canon = canonical_job_text(title, company_name, location, description)
        normalized.append(
            {
                "external_id": f"greenhouse:{jid}",
                "title": title or "Untitled role",
                "company": company_name,
                "location": location,
                "description": description,
                "apply_url": apply_url,
                "posted_at": posted_at,
                "source": "greenhouse",
                "content_hash": sha256_hex(canon),
            }
        )

    LOG.info("Greenhouse board=%s normalized_jobs=%s", token, len(normalized))
    return normalized
