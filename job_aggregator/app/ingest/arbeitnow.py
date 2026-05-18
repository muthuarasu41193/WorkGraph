"""
Arbeitnow public job board API.

Endpoint:
  GET https://www.arbeitnow.com/api/job-board-api
"""

from __future__ import annotations

import os
from typing import Any

from app.ingest.base import compact_text, env_int, normalize_job, parse_datetime
from app.utils import LOG, http_get_json


def _extract_location(job: dict[str, Any]) -> str:
    if job.get("remote") is True:
        return "Remote"
    location = job.get("location")
    if isinstance(location, str):
        return location.strip()
    if isinstance(location, list):
        return ", ".join(str(part).strip() for part in location if str(part).strip())
    return ""


def fetch_arbeitnow_jobs() -> list[dict[str, Any]]:
    max_pages = env_int("ARBEITNOW_MAX_PAGES", 2, min_value=1, max_value=10)
    visa_only = str(os.getenv("ARBEITNOW_VISA_SPONSORSHIP", "") or "").strip().lower() in {"1", "true", "yes"}

    normalized: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    next_url = "https://www.arbeitnow.com/api/job-board-api"
    page = 0

    while next_url and page < max_pages:
        page += 1
        params: dict[str, Any] | None = {"visa_sponsorship": "true"} if visa_only and page == 1 else None
        payload = http_get_json(next_url, params=params)
        if not isinstance(payload, dict):
            LOG.warning("Arbeitnow unexpected payload page=%s", page)
            break

        rows = payload.get("data")
        if not isinstance(rows, list):
            break

        for job in rows:
            if not isinstance(job, dict):
                continue
            apply_url = str(job.get("url") or "").strip()
            if not apply_url or apply_url in seen_urls:
                continue

            job_id = str(job.get("slug") or job.get("id") or apply_url).strip()
            title = str(job.get("title") or "").strip()
            company = str(job.get("company_name") or job.get("company") or "").strip()
            location = _extract_location(job)

            tags = job.get("tags") if isinstance(job.get("tags"), list) else []
            job_types = job.get("job_types") if isinstance(job.get("job_types"), list) else []
            description = compact_text(
                f"Tags: {', '.join(str(tag).strip() for tag in tags if str(tag).strip())}" if tags else "",
                f"Types: {', '.join(str(tag).strip() for tag in job_types if str(tag).strip())}" if job_types else "",
                "Visa sponsorship available" if job.get("visa_sponsorship") else "",
                str(job.get("description") or "").strip(),
            )

            row = normalize_job(
                source="arbeitnow",
                external_id=f"arbeitnow:{job_id}",
                title=title,
                company=company,
                location=location,
                description=description,
                apply_url=apply_url,
                posted_at=parse_datetime(job.get("created_at") or job.get("published_at")),
            )
            if row is None:
                continue
            normalized.append(row)
            seen_urls.add(apply_url)

        links = payload.get("links")
        if isinstance(links, dict):
            next_value = str(links.get("next") or "").strip()
            next_url = next_value or ""
        else:
            next_url = ""

    LOG.info("Arbeitnow normalized_jobs=%s pages=%s", len(normalized), page)
    return normalized
