"""
Ashby **public** job board JSON API (no API key).

Official docs expose listings at:
  GET https://api.ashbyhq.com/posting-api/job-board/{JOB_BOARD_SLUG}

The slug matches the hosted board path (e.g. jobs.ashbyhq.com/Ashby → slug `Ashby`).
NOTE: Slugs are case-sensitive for some tenants — preserve casing from companies.json.

Spec references `jobs[].descriptionPlain`, `applyUrl`, `jobUrl`, `publishedAt`, `isListed`.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.utils import LOG, canonical_job_text, http_get_json, sha256_hex


def _parse_iso8601(value: Any) -> datetime | None:
    if not value or not isinstance(value, str):
        return None
    try:
        normalized = value.replace("Z", "+00:00")
        dt = datetime.fromisoformat(normalized)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return None


def fetch_ashby_jobs(job_board_slug: str) -> list[dict[str, Any]]:
    """Fetch listed Ashby postings for the given job-board slug."""
    slug = job_board_slug.strip()
    if not slug:
        return []

    url = f"https://api.ashbyhq.com/posting-api/job-board/{slug}"
    payload = http_get_json(url, params={"includeCompensation": "false"})
    if not isinstance(payload, dict):
        LOG.warning("Ashby unexpected payload for slug=%s", slug)
        return []

    jobs_raw = payload.get("jobs")
    if not isinstance(jobs_raw, list):
        return []

    company_display = slug.replace("-", " ").strip()

    normalized: list[dict[str, Any]] = []
    for job in jobs_raw:
        if not isinstance(job, dict):
            continue
        # Hide internal / unlisted postings from aggregation pool.
        if job.get("isListed") is False:
            continue

        jid = job.get("id") or job.get("jobPostingId")
        apply_url = str(job.get("applyUrl") or job.get("jobUrl") or "").strip()
        if not jid or not apply_url:
            continue

        title = str(job.get("title") or "").strip()
        location = str(job.get("location") or "").strip()
        if job.get("isRemote"):
            location = f"{location} (Remote-friendly)".strip()

        description = str(job.get("descriptionPlain") or job.get("descriptionHtml") or "").strip()
        posted_at = _parse_iso8601(job.get("publishedAt"))

        canon = canonical_job_text(title, company_display, location, description)
        normalized.append(
            {
                "external_id": f"ashby:{jid}",
                "title": title or "Untitled role",
                "company": company_display,
                "location": location,
                "description": description,
                "apply_url": apply_url,
                "posted_at": posted_at,
                "source": "ashby",
                "content_hash": sha256_hex(canon),
            }
        )

    LOG.info("Ashby slug=%s normalized_jobs=%s", slug, len(normalized))
    return normalized
