"""
USAJOBS Search API — U.S. federal job listings.

Docs: https://developer.usajobs.gov/api-reference/get-api-search
Endpoint: GET https://data.usajobs.gov/api/Search

Requires:
  USAJOBS_API_KEY — Authorization-Key header
  USAJOBS_USER_AGENT — email used on the API application (User-Agent header)
"""

from __future__ import annotations

import os
from typing import Any

from app.ingest.base import compact_text, env_int, normalize_job, parse_datetime, split_csv
from app.utils import LOG, http_get_json

API_URL = "https://data.usajobs.gov/api/Search"


def _split_queries(raw: str) -> list[str]:
    if "|" in raw:
        parts = [part.strip() for part in raw.split("|")]
    else:
        parts = [part.strip() for part in raw.replace(";", ",").split(",")]
    return [part for part in parts if part]


def _usajobs_headers() -> dict[str, str] | None:
    api_key = os.getenv("USAJOBS_API_KEY", "").strip()
    user_agent = os.getenv("USAJOBS_USER_AGENT", "").strip()
    if not api_key or not user_agent:
        LOG.info("USAJobs skipped (set USAJOBS_API_KEY and USAJOBS_USER_AGENT to enable)")
        return None
    return {
        "Host": "data.usajobs.gov",
        "User-Agent": user_agent,
        "Authorization-Key": api_key,
    }


def _location_text(descriptor: dict[str, Any]) -> str:
    locations = descriptor.get("PositionLocation")
    if not isinstance(locations, list):
        return ""
    parts: list[str] = []
    for loc in locations:
        if not isinstance(loc, dict):
            continue
        name = str(loc.get("LocationName") or "").strip()
        if name:
            parts.append(name)
            continue
        city = str(loc.get("CityName") or "").strip()
        state = str(loc.get("CountrySubDivisionCode") or "").strip()
        if city and state:
            parts.append(f"{city}, {state}")
        elif city:
            parts.append(city)
    return "; ".join(dict.fromkeys(parts))


def _apply_url(descriptor: dict[str, Any], matched_id: str) -> str:
    uri = str(descriptor.get("PositionURI") or "").strip()
    if uri:
        return uri
    apply_uris = descriptor.get("ApplyURI")
    if isinstance(apply_uris, list):
        for item in apply_uris:
            url = str(item or "").strip()
            if url:
                return url
    if matched_id:
        return f"https://www.usajobs.gov/job/{matched_id}"
    return ""


def _description_text(descriptor: dict[str, Any]) -> str:
    bits: list[str] = []

    dept = str(descriptor.get("DepartmentName") or "").strip()
    org = str(descriptor.get("OrganizationName") or "").strip()
    if org:
        bits.append(f"Agency: {org}")
    if dept and dept != org:
        bits.append(f"Department: {dept}")

    categories = descriptor.get("JobCategory")
    if isinstance(categories, list):
        labels = [
            str(item.get("Name") or "").strip()
            for item in categories
            if isinstance(item, dict) and str(item.get("Name") or "").strip()
        ]
        if labels:
            bits.append(f"Category: {', '.join(labels)}")

    rem_min = descriptor.get("PositionRemuneration")
    if isinstance(rem_min, list):
        for rem in rem_min:
            if not isinstance(rem, dict):
                continue
            minimum = rem.get("MinimumRange")
            maximum = rem.get("MaximumRange")
            if minimum is not None and maximum is not None:
                bits.append(f"Salary: ${minimum} – ${maximum}")
                break

    formatted = descriptor.get("PositionFormattedDescription")
    if isinstance(formatted, list):
        for block in formatted:
            if not isinstance(block, dict):
                continue
            content = str(block.get("Content") or "").strip()
            if content:
                bits.append(content)
                break

    user_area = descriptor.get("UserArea")
    if isinstance(user_area, dict):
        details = user_area.get("Details")
        if isinstance(details, dict):
            for key in ("MajorDuties", "QualificationSummary", "Education"):
                text = str(details.get(key) or "").strip()
                if text:
                    bits.append(text)

    return compact_text(*bits)


def fetch_usajobs_jobs() -> list[dict[str, Any]]:
    """
    Pull normalized federal job rows from USAJOBS Search API.

    Env (required):
      USAJOBS_API_KEY, USAJOBS_USER_AGENT

    Env (optional):
      USAJOBS_KEYWORD — pipe/comma-separated keywords (default: software engineer)
      USAJOBS_LOCATION_NAME — e.g. United States
      USAJOBS_RESULTS_PER_PAGE — 1–500 (default 100)
      USAJOBS_MAX_PAGES — pages per keyword (default 2)
    """
    headers = _usajobs_headers()
    if headers is None:
        return []

    queries_raw = os.getenv("USAJOBS_KEYWORD", "").strip() or os.getenv("USAJOBS_KEYWORDS", "").strip()
    if not queries_raw:
        queries_raw = "software engineer"
    queries = _split_queries(queries_raw) if queries_raw else ["software engineer"]

    location = os.getenv("USAJOBS_LOCATION_NAME", "").strip()
    results_per_page = env_int("USAJOBS_RESULTS_PER_PAGE", 100, min_value=1, max_value=500)
    max_pages = env_int("USAJOBS_MAX_PAGES", 2, min_value=1, max_value=10)

    normalized: list[dict[str, Any]] = []
    seen_urls: set[str] = set()

    for keyword in queries:
        for page in range(1, max_pages + 1):
            params: dict[str, Any] = {
                "Keyword": keyword,
                "ResultsPerPage": results_per_page,
                "Page": page,
            }
            if location:
                params["LocationName"] = location

            payload = http_get_json(API_URL, params=params, headers=headers)
            if not isinstance(payload, dict):
                LOG.warning("USAJobs unexpected payload keyword=%s page=%s", keyword, page)
                break

            search_result = payload.get("SearchResult")
            if not isinstance(search_result, dict):
                break

            items = search_result.get("SearchResultItems")
            if not isinstance(items, list):
                break

            for item in items:
                if not isinstance(item, dict):
                    continue
                matched_id = str(item.get("MatchedObjectId") or "").strip()
                descriptor = item.get("MatchedObjectDescriptor")
                if not isinstance(descriptor, dict):
                    continue

                apply_url = _apply_url(descriptor, matched_id)
                if not apply_url or apply_url in seen_urls:
                    continue

                title = str(descriptor.get("PositionTitle") or "").strip()
                company = str(descriptor.get("OrganizationName") or "U.S. Federal Government").strip()
                location_text = _location_text(descriptor)
                posted_at = parse_datetime(descriptor.get("PublicationStartDate"))

                row = normalize_job(
                    source="usajobs",
                    external_id=f"usajobs:{matched_id or apply_url}",
                    title=title,
                    company=company,
                    location=location_text,
                    description=_description_text(descriptor),
                    apply_url=apply_url,
                    posted_at=posted_at,
                    is_community=False,
                )
                if row is None:
                    continue
                normalized.append(row)
                seen_urls.add(apply_url)

            if len(items) < results_per_page:
                break

    LOG.info("USAJobs complete: queries=%s normalized_jobs=%s", len(queries), len(normalized))
    return normalized
