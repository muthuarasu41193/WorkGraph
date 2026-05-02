"""
Lever public postings JSON API.

Endpoint: GET https://api.lever.co/v0/postings/{site}?mode=json
Returns a JSON array of posting objects.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.utils import LOG, canonical_job_text, http_get_json, sha256_hex


def _parse_ms_timestamp(ms: Any) -> datetime | None:
    try:
        n = int(ms)
        dt = datetime.fromtimestamp(n / 1000.0, tz=timezone.utc)
        return dt
    except (TypeError, ValueError, OSError):
        return None


def _build_description(posting: dict[str, Any]) -> str:
    """Lever postings nest descriptive lists — flatten into searchable text."""
    parts: list[str] = []

    desc = posting.get("description")
    if isinstance(desc, str) and desc.strip():
        parts.append(desc.strip())

    lists = posting.get("lists")
    if isinstance(lists, list):
        for block in lists:
            if not isinstance(block, dict):
                continue
            t = str(block.get("text") or "").strip()
            if t:
                parts.append(t)
            content = block.get("content")
            if isinstance(content, str) and content.strip():
                parts.append(content.strip())

    text_blob = posting.get("text")
    if isinstance(text_blob, str) and text_blob.strip():
        parts.append(text_blob.strip())

    combined = "\n\n".join(parts)
    return combined.strip()


def fetch_lever_jobs(site: str) -> list[dict[str, Any]]:
    site_slug = site.strip()
    if not site_slug:
        return []

    url = f"https://api.lever.co/v0/postings/{site_slug}"
    payload = http_get_json(url, params={"mode": "json"})
    # Historically Lever returned a bare JSON array; some proxies wrap payloads.
    if isinstance(payload, dict) and isinstance(payload.get("data"), list):
        payload = payload["data"]
    if not isinstance(payload, list):
        LOG.warning("Lever unexpected payload for site=%s", site_slug)
        return []

    company_display = site_slug.replace("-", " ").title()

    normalized: list[dict[str, Any]] = []
    for posting in payload:
        if not isinstance(posting, dict):
            continue
        pid = posting.get("id")
        if not pid:
            continue

        apply_url = str(posting.get("hostedUrl") or posting.get("applyUrl") or "").strip()
        if not apply_url:
            continue

        title = str(posting.get("text") or "").strip()
        # Lever uses categories for structured meta
        categories = posting.get("categories")
        location = ""
        commitment = ""
        team = ""
        if isinstance(categories, dict):
            location = str(categories.get("location") or "").strip()
            commitment = str(categories.get("commitment") or "").strip()
            team = str(categories.get("team") or "").strip()

        if team:
            title = f"{team}: {title}" if title else team

        description = _build_description(posting)
        if commitment:
            description = f"{commitment}\n\n{description}"

        posted_at = _parse_ms_timestamp(posting.get("createdAt"))

        canon = canonical_job_text(title, company_display, location, description)
        normalized.append(
            {
                "external_id": f"lever:{pid}",
                "title": title or "Untitled role",
                "company": company_display,
                "location": location,
                "description": description,
                "apply_url": apply_url,
                "posted_at": posted_at,
                "source": "lever",
                "content_hash": sha256_hex(canon),
            }
        )

    LOG.info("Lever site=%s normalized_jobs=%s", site_slug, len(normalized))
    return normalized
