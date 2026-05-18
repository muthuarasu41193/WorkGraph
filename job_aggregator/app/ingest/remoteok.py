"""
RemoteOK public jobs API.

Docs / feed:
  GET https://remoteok.com/api
"""

from __future__ import annotations

from typing import Any

from app.ingest.base import absolutize_url, compact_text, normalize_job, parse_datetime
from app.utils import LOG, http_get_json, strip_html_to_text


def _salary_text(job: dict[str, Any]) -> str:
    min_salary = job.get("salary_min")
    max_salary = job.get("salary_max")
    currency = str(job.get("salary_currency") or "USD").strip()
    try:
        if min_salary is not None and max_salary is not None:
            return f"Salary: {currency} {int(min_salary)} - {int(max_salary)}"
        if min_salary is not None:
            return f"Salary from: {currency} {int(min_salary)}"
        if max_salary is not None:
            return f"Salary up to: {currency} {int(max_salary)}"
    except (TypeError, ValueError):
        return ""
    return ""


def fetch_remoteok_jobs() -> list[dict[str, Any]]:
    payload = http_get_json("https://remoteok.com/api")
    if not isinstance(payload, list):
        LOG.warning("RemoteOK unexpected payload")
        return []

    normalized: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    for item in payload:
        if not isinstance(item, dict):
            continue
        if "id" not in item:
            continue

        rid = item.get("id")
        title = str(item.get("position") or item.get("title") or "").strip()
        company = str(item.get("company") or "").strip()
        location = str(item.get("location") or "Remote").strip()

        raw_url = str(item.get("apply_url") or item.get("url") or "").strip()
        apply_url = absolutize_url(raw_url, base="https://remoteok.com")
        if not apply_url or apply_url in seen_urls:
            continue

        tags = item.get("tags") if isinstance(item.get("tags"), list) else []
        description = compact_text(
            _salary_text(item),
            f"Tags: {', '.join(str(tag).strip() for tag in tags if str(tag).strip())}" if tags else "",
            strip_html_to_text(str(item.get("description") or "").strip()),
        )
        posted_at = parse_datetime(item.get("date")) or parse_datetime(item.get("epoch"))

        row = normalize_job(
            source="remoteok",
            external_id=f"remoteok:{rid}",
            title=title,
            company=company,
            location=location,
            description=description,
            apply_url=apply_url,
            posted_at=posted_at,
        )
        if row is None:
            continue
        normalized.append(row)
        seen_urls.add(apply_url)

    LOG.info("RemoteOK normalized_jobs=%s", len(normalized))
    return normalized
