"""
Adzuna Jobs API — multi-country search (requires app_id + app_key).

Docs: https://developer.adzuna.com/docs/search
Endpoint: GET https://api.adzuna.com/v1/api/jobs/{country}/search/{page}
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

from app.utils import LOG, canonical_job_text, http_get_json, sha256_hex, strip_html_to_text


def _parse_created(value: Any) -> datetime | None:
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


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or not str(raw).strip():
        return default
    try:
        return int(str(raw).strip())
    except ValueError:
        return default


def _split_countries(raw: str) -> list[str]:
    parts = [p.strip().lower() for p in raw.replace(";", ",").split(",")]
    return [p for p in parts if p]


def _split_queries(raw: str) -> list[str]:
    # Pipe = extra terms; comma also allowed for simple lists
    if "|" in raw:
        parts = [p.strip() for p in raw.split("|")]
    else:
        parts = [p.strip() for p in raw.replace(";", ",").split(",")]
    return [p for p in parts if p]


def fetch_adzuna_jobs() -> list[dict[str, Any]]:
    """
    Pull normalized rows from Adzuna for configured countries and search queries.

    Env (required to run):
      ADZUNA_APP_ID, ADZUNA_APP_KEY

    Env (optional):
      ADZUNA_COUNTRIES — comma-separated ISO country codes (default spans major markets).
      ADZUNA_SEARCH_QUERIES — pipe- or comma-separated keywords (default: software engineer).
      ADZUNA_RESULTS_PER_PAGE — 1–50 (default 50).
      ADZUNA_MAX_PAGES_PER_QUERY — pages per country/query pair (default 1).
    """
    app_id = os.getenv("ADZUNA_APP_ID", "").strip()
    app_key = os.getenv("ADZUNA_APP_KEY", "").strip()
    if not app_id or not app_key:
        LOG.info("Adzuna skipped (set ADZUNA_APP_ID and ADZUNA_APP_KEY to enable)")
        return []

    # Only include Adzuna job-search regions that return 200 for your app tier (404 = unsupported).
    countries_default = "gb,us,au,ca,de,fr,in,nl,br,es,it,pl,za,sg,nz,ch,at,be"
    countries = _split_countries(os.getenv("ADZUNA_COUNTRIES", countries_default))

    queries_raw = os.getenv("ADZUNA_SEARCH_QUERIES", "").strip()
    if not queries_raw:
        queries_raw = os.getenv("ADZUNA_WHAT", "software engineer").strip()
    queries = _split_queries(queries_raw) if queries_raw else [""]

    rpp = max(1, min(50, _env_int("ADZUNA_RESULTS_PER_PAGE", 50)))
    max_pages = max(1, min(20, _env_int("ADZUNA_MAX_PAGES_PER_QUERY", 1)))

    normalized: list[dict[str, Any]] = []
    seen_apply: set[str] = set()
    total_calls = 0

    for country in countries:
        for what in queries:
            for page in range(1, max_pages + 1):
                url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"
                params: dict[str, Any] = {
                    "app_id": app_id,
                    "app_key": app_key,
                    "results_per_page": rpp,
                    "content-type": "application/json",
                }
                if what:
                    params["what"] = what

                total_calls += 1
                payload = http_get_json(url, params=params)
                if not isinstance(payload, dict):
                    LOG.warning("Adzuna unexpected payload country=%s page=%s", country, page)
                    break

                results = payload.get("results")
                if not isinstance(results, list):
                    break

                for job in results:
                    if not isinstance(job, dict):
                        continue
                    jid = job.get("id")
                    if jid is None:
                        continue
                    jid_str = str(jid).strip()
                    if not jid_str:
                        continue

                    apply_url = str(job.get("redirect_url") or "").strip()
                    if not apply_url:
                        continue
                    if apply_url in seen_apply:
                        continue

                    title = str(job.get("title") or "").strip()

                    company_name = ""
                    comp = job.get("company")
                    if isinstance(comp, dict):
                        company_name = str(comp.get("display_name") or "").strip()

                    location = ""
                    loc = job.get("location")
                    if isinstance(loc, dict):
                        location = str(loc.get("display_name") or "").strip()

                    raw_desc = job.get("description")
                    description = strip_html_to_text(str(raw_desc or ""))

                    meta_bits: list[str] = []
                    cat = job.get("category")
                    if isinstance(cat, dict):
                        lab = str(cat.get("label") or "").strip()
                        if lab:
                            meta_bits.append(lab)

                    try:
                        smin = job.get("salary_min")
                        smax = job.get("salary_max")
                        if smin is not None and smax is not None:
                            meta_bits.append(f"Salary: {smin} – {smax}")
                        elif smin is not None:
                            meta_bits.append(f"Salary from: {smin}")
                        elif smax is not None:
                            meta_bits.append(f"Salary up to: {smax}")
                    except (TypeError, ValueError):
                        pass

                    ct = str(job.get("contract_type") or "").strip()
                    if ct:
                        meta_bits.append(ct)

                    if meta_bits:
                        prefix = " · ".join(meta_bits)
                        description = f"{prefix}\n\n{description}" if description else prefix

                    posted_at = _parse_created(job.get("created"))

                    canon = canonical_job_text(title, company_name, location, description)
                    external_id = f"adzuna:{country}:{jid_str}"
                    normalized.append(
                        {
                            "external_id": external_id,
                            "title": title or "Untitled role",
                            "company": company_name or "Employer via Adzuna",
                            "location": location,
                            "description": description,
                            "apply_url": apply_url,
                            "posted_at": posted_at,
                            "source": "adzuna",
                            "content_hash": sha256_hex(canon),
                        }
                    )
                    seen_apply.add(apply_url)

                if len(results) < rpp:
                    break

    LOG.info(
        "Adzuna complete: countries=%s queries=%s api_calls=%s normalized_jobs=%s",
        len(countries),
        len(queries),
        total_calls,
        len(normalized),
    )
    return normalized
