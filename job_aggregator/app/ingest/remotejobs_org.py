"""
RemoteJobs.org public jobs API.

Docs: https://remotejobs.org/api-access
Endpoint: GET https://remotejobs.org/api/v1/jobs

No API key or authentication required. Supports pagination via limit/offset and
optional filters: category, type, q (keyword search).

Categories: programming, design, marketing, sales, writing, data-science,
devops, product-management, customer-support, finance, human-resources, legal

Job types: full-time, part-time, contract, freelance
"""

from __future__ import annotations

import os
import time
from typing import Any

from app.ingest.base import compact_text, env_int, normalize_job, parse_datetime, split_csv
from app.utils import LOG, http_get_json

API_BASE = "https://remotejobs.org/api/v1/jobs"

DEFAULT_CATEGORIES = (
    "programming",
    "design",
    "marketing",
    "sales",
    "writing",
    "data-science",
    "devops",
    "product-management",
    "customer-support",
    "finance",
    "human-resources",
    "legal",
)

_ATTRIBUTION = "Powered by RemoteJobs.org — https://remotejobs.org"


def _split_queries(raw: str) -> list[str]:
    if "|" in raw:
        parts = [part.strip() for part in raw.split("|")]
    else:
        parts = [part.strip() for part in raw.replace(";", ",").split(",")]
    return [part for part in parts if part]


def _company_name(job: dict[str, Any]) -> str:
    company = job.get("company")
    if isinstance(company, dict):
        return str(company.get("name") or "").strip()
    if isinstance(company, str):
        return company.strip()
    return ""


def _category_label(job: dict[str, Any]) -> str:
    category = job.get("category")
    if isinstance(category, dict):
        name = str(category.get("name") or "").strip()
        slug = str(category.get("slug") or "").strip()
        if name and slug:
            return f"{name} ({slug})"
        return name or slug
    if isinstance(category, str):
        return category.strip()
    return ""


def _salary_text(job: dict[str, Any]) -> str:
    salary_text = str(job.get("salary_text") or "").strip()
    if salary_text:
        return f"Salary: {salary_text}"
    salary_min = job.get("salary_min")
    salary_max = job.get("salary_max")
    try:
        if salary_min is not None and salary_max is not None:
            return f"Salary: ${int(salary_min):,} - ${int(salary_max):,}"
        if salary_min is not None:
            return f"Salary from: ${int(salary_min):,}"
        if salary_max is not None:
            return f"Salary up to: ${int(salary_max):,}"
    except (TypeError, ValueError):
        pass
    return ""


def _description_for(job: dict[str, Any]) -> str:
    job_type = str(job.get("type") or "").strip()
    category = _category_label(job)
    translation_note = ""
    if job.get("is_translated") is True:
        original = str(job.get("original_language") or "").strip()
        translation_note = f"Translated from {original}" if original else "Translated to English"

    return compact_text(
        _salary_text(job),
        f"Category: {category}" if category else "",
        f"Type: {job_type}" if job_type else "",
        translation_note,
        str(job.get("description") or "").strip(),
        _ATTRIBUTION,
    )


def _fetch_pages(
    *,
    category: str | None,
    job_type: str | None,
    query: str | None,
    limit: int,
    max_pages: int,
    normalized: list[dict[str, Any]],
    seen_urls: set[str],
) -> int:
    offset = 0
    pages = 0

    while pages < max_pages:
        pages += 1
        params: dict[str, Any] = {"limit": limit, "offset": offset}
        if category:
            params["category"] = category
        if job_type:
            params["type"] = job_type
        if query:
            params["q"] = query

        if offset > 0:
            time.sleep(max(0.5, float(os.getenv("REMOTEJOBS_REQUEST_DELAY_SECONDS", "1.25"))))

        payload = http_get_json(API_BASE, params=params)
        if not isinstance(payload, dict):
            LOG.warning(
                "RemoteJobs.org unexpected payload category=%s type=%s q=%s page=%s",
                category,
                job_type,
                query,
                pages,
            )
            break

        rows = payload.get("data")
        if not isinstance(rows, list):
            break

        for job in rows:
            if not isinstance(job, dict):
                continue

            job_id = str(job.get("id") or "").strip()
            apply_url = str(job.get("apply_url") or job.get("url") or "").strip()
            if not apply_url or apply_url in seen_urls:
                continue

            title = str(job.get("title") or "").strip()
            company = _company_name(job)
            location = str(job.get("location") or "Remote").strip()

            row = normalize_job(
                source="remotejobs",
                external_id=f"remotejobs:{job_id or apply_url}",
                title=title,
                company=company,
                location=location,
                description=_description_for(job),
                apply_url=apply_url,
                posted_at=parse_datetime(job.get("posted_at")),
            )
            if row is None:
                continue
            normalized.append(row)
            seen_urls.add(apply_url)

        pagination = payload.get("pagination")
        has_more = isinstance(pagination, dict) and pagination.get("has_more") is True
        if not has_more or len(rows) < limit:
            break
        offset += limit

    return pages


def fetch_remotejobs_jobs() -> list[dict[str, Any]]:
    """
    Pull normalized rows from RemoteJobs.org.

    Env (optional):
      REMOTEJOBS_LIMIT — jobs per page, 1–50 (default 50).
      REMOTEJOBS_MAX_PAGES — pages per category/query pass (default 4).
      REMOTEJOBS_CATEGORIES — comma-separated category slugs; default all documented categories.
      REMOTEJOBS_TYPES — comma-separated job types (full-time, part-time, contract, freelance).
      REMOTEJOBS_SEARCH_QUERIES — pipe- or comma-separated keyword searches (q param).
      REMOTEJOBS_TYPE — single job type filter (alias when only one type is needed).
      REMOTEJOBS_Q — single keyword search (alias).
    """
    limit = env_int("REMOTEJOBS_LIMIT", 50, min_value=1, max_value=50)
    max_pages = env_int("REMOTEJOBS_MAX_PAGES", 4, min_value=1, max_value=20)

    categories_raw = os.getenv("REMOTEJOBS_CATEGORIES", "").strip()
    categories = split_csv(categories_raw) if categories_raw else list(DEFAULT_CATEGORIES)

    types_raw = os.getenv("REMOTEJOBS_TYPES", "").strip()
    types = split_csv(types_raw)
    single_type = os.getenv("REMOTEJOBS_TYPE", "").strip()
    if single_type and single_type not in types:
        types.append(single_type)
    if not types:
        types = [""]

    queries_raw = os.getenv("REMOTEJOBS_SEARCH_QUERIES", "").strip()
    if not queries_raw:
        queries_raw = os.getenv("REMOTEJOBS_Q", "").strip()
    queries = _split_queries(queries_raw) if queries_raw else [""]

    normalized: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    total_pages = 0

    for category in categories:
        for job_type in types:
            for query in queries:
                total_pages += _fetch_pages(
                    category=category or None,
                    job_type=job_type or None,
                    query=query or None,
                    limit=limit,
                    max_pages=max_pages,
                    normalized=normalized,
                    seen_urls=seen_urls,
                )

    LOG.info(
        "RemoteJobs.org complete: categories=%s types=%s queries=%s pages=%s normalized_jobs=%s",
        len(categories),
        len(types),
        len(queries),
        total_pages,
        len(normalized),
    )
    return normalized
