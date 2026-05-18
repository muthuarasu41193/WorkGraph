"""
Jobicy remote jobs feed.

Primary endpoint:
  GET https://jobicy.com/api/v2/remote-jobs

Fallback RSS:
  GET https://jobicy.com/?feed=job_feed
"""

from __future__ import annotations

import os
from typing import Any

from app.ingest.base import (
    compact_text,
    env_int,
    normalize_job,
    parse_datetime,
    parse_rss_items,
    rss_item_link,
    rss_item_text,
)
from app.utils import LOG, http_get_json


def _salary_text(job: dict[str, Any]) -> str:
    low = job.get("annualSalaryMin")
    high = job.get("annualSalaryMax")
    currency = str(job.get("salaryCurrency") or "USD").strip()
    try:
        if low is not None and high is not None:
            return f"Salary: {currency} {int(low)} - {int(high)}"
        if low is not None:
            return f"Salary from: {currency} {int(low)}"
        if high is not None:
            return f"Salary up to: {currency} {int(high)}"
    except (TypeError, ValueError):
        return ""
    return ""


def _fetch_json_jobs() -> list[dict[str, Any]]:
    params: dict[str, Any] = {"count": env_int("JOBICY_COUNT", 30, min_value=1, max_value=50)}
    for env_key, param_key in (
        ("JOBICY_GEO", "geo"),
        ("JOBICY_INDUSTRY", "industry"),
        ("JOBICY_TAG", "tag"),
    ):
        value = str(os.getenv(env_key, "") or "").strip()
        if value:
            params[param_key] = value

    payload = http_get_json("https://jobicy.com/api/v2/remote-jobs", params=params)
    if isinstance(payload, dict) and isinstance(payload.get("jobs"), list):
        return [row for row in payload["jobs"] if isinstance(row, dict)]
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]
    return []


def _fetch_rss_jobs() -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for item in parse_rss_items("https://jobicy.com/?feed=job_feed"):
        title = rss_item_text(item, "title")
        apply_url = rss_item_link(item)
        guid = rss_item_text(item, "guid")
        description = compact_text(
            rss_item_text(item, "description", "summary", "content"),
            rss_item_text(item, "category"),
        )
        row = normalize_job(
            source="jobicy",
            external_id=f"jobicy:{guid or apply_url or title}",
            title=title,
            company="Employer via Jobicy",
            location="Remote",
            description=description,
            apply_url=apply_url,
            posted_at=parse_datetime(rss_item_text(item, "pubdate", "published", "updated")),
        )
        if row is not None:
            normalized.append(row)
    return normalized


def fetch_jobicy_jobs() -> list[dict[str, Any]]:
    jobs = _fetch_json_jobs()
    normalized: list[dict[str, Any]] = []
    seen_urls: set[str] = set()

    for job in jobs:
        job_id = str(job.get("id") or job.get("slug") or "").strip()
        title = str(job.get("jobTitle") or job.get("title") or "").strip()
        company = str(job.get("companyName") or job.get("company") or "").strip()
        location = str(job.get("jobGeo") or job.get("jobRegion") or "Remote").strip()
        apply_url = str(job.get("url") or "").strip()
        if not apply_url or apply_url in seen_urls:
            continue

        description = compact_text(
            _salary_text(job),
            f"Industry: {job.get('jobIndustry')}" if job.get("jobIndustry") else "",
            f"Type: {job.get('jobType')}" if job.get("jobType") else "",
            f"Level: {job.get('jobLevel')}" if job.get("jobLevel") else "",
            str(job.get("jobExcerpt") or "").strip(),
            str(job.get("jobDescription") or "").strip(),
        )
        row = normalize_job(
            source="jobicy",
            external_id=f"jobicy:{job_id or apply_url}",
            title=title,
            company=company,
            location=location,
            description=description,
            apply_url=apply_url,
            posted_at=parse_datetime(job.get("pubDate") or job.get("date")),
        )
        if row is None:
            continue
        normalized.append(row)
        seen_urls.add(apply_url)

    if normalized:
        LOG.info("Jobicy normalized_jobs=%s via=json", len(normalized))
        return normalized

    fallback = _fetch_rss_jobs()
    LOG.info("Jobicy normalized_jobs=%s via=rss_fallback", len(fallback))
    return fallback
