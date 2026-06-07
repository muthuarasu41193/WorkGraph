"""
Persist normalized job rows via Supabase PostgREST (service role).

Use when DATABASE_PASSWORD / pooler setup is unavailable but SUPABASE_SERVICE_ROLE_KEY is set.
Bypasses SQLAlchemy; suitable for CI and local sync without psycopg2 pooler quirks.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from typing import Any

import requests

LOG = logging.getLogger(__name__)

_DEFAULT_CHUNK = 25


def resolve_supabase_rest_url() -> str:
    """HTTPS origin for PostgREST (from URL env or inferred project ref)."""
    raw = (
        os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        or os.getenv("SUPABASE_URL")
        or ""
    ).strip().rstrip("/")
    if raw:
        return raw
    from app.config import infer_supabase_project_ref

    ref = infer_supabase_project_ref()
    return f"https://{ref}.supabase.co" if ref else ""


def _supabase_rest_base_and_key() -> tuple[str, str]:
    url = resolve_supabase_rest_url()
    key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_SECRET_KEY")
        or ""
    ).strip()
    if not url or not key:
        raise ValueError(
            "REST ingest requires NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and "
            "SUPABASE_SERVICE_ROLE_KEY (Dashboard → Settings → API Keys → Secret)."
        )
    return url, key


def _dedupe_by_apply_url(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Last row per apply_url wins — matches SQLAlchemy ingest sequential upsert order."""
    by_url: dict[str, dict[str, Any]] = {}
    for row in rows:
        url = str(row.get("apply_url") or "").strip()
        if url:
            by_url[url] = row
    return list(by_url.values())


def _dedupe_by_external_id_keep_first(rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], int]:
    """First row per external_id wins — mirrors runner.persist_normalized_jobs insert order."""
    seen: set[str] = set()
    kept: list[dict[str, Any]] = []
    skipped = 0
    for row in rows:
        ext = str(row.get("external_id") or "").strip()
        if not ext or ext in seen:
            if ext:
                skipped += 1
            continue
        seen.add(ext)
        kept.append(row)
    return kept, skipped


def _postgrest_in_filter(values: list[str]) -> str:
    parts: list[str] = []
    for value in values:
        escaped = value.replace('"', '""')
        parts.append(f'"{escaped}"')
    return f"in.({','.join(parts)})"


def _fetch_existing_external_id_urls(
    base: str,
    key: str,
    external_ids: list[str],
) -> dict[str, str]:
    """Map external_id -> apply_url for rows already stored in public.jobs."""
    unique = list(dict.fromkeys(ext for ext in external_ids if ext))
    if not unique:
        return {}

    endpoint = f"{base}/rest/v1/jobs"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
    }
    timeout = float(os.getenv("HTTP_TIMEOUT_SECONDS", "60"))
    out: dict[str, str] = {}
    lookup_batch = 50

    for i in range(0, len(unique), lookup_batch):
        batch = unique[i : i + lookup_batch]
        resp = requests.get(
            endpoint,
            params={
                "select": "external_id,apply_url",
                "external_id": _postgrest_in_filter(batch),
            },
            headers=headers,
            timeout=timeout,
        )
        if resp.status_code not in (200, 206):
            detail = (resp.text or "")[:500]
            raise RuntimeError(
                f"Supabase REST lookup failed (HTTP {resp.status_code}) while checking external_id conflicts. "
                f"Body: {detail}"
            )
        rows = resp.json()
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            ext = str(row.get("external_id") or "").strip()
            url = str(row.get("apply_url") or "").strip()
            if ext and url:
                out[ext] = url
    return out


def _filter_external_id_conflicts(
    rows: list[dict[str, Any]],
    existing: dict[str, str],
) -> tuple[list[dict[str, Any]], int]:
    """Skip rows whose external_id is already tied to a different apply_url in the DB."""
    kept: list[dict[str, Any]] = []
    skipped = 0
    for row in rows:
        ext = str(row.get("external_id") or "").strip()
        url = str(row.get("apply_url") or "").strip()
        existing_url = existing.get(ext)
        if existing_url and existing_url != url:
            LOG.warning(
                "Skipping external_id collision (different URL?): ext=%s existing_url=%s new_url=%s",
                ext,
                existing_url,
                url,
            )
            skipped += 1
            continue
        kept.append(row)
    return kept, skipped


def _upsert_chunk(
    *,
    endpoint: str,
    headers: dict[str, str],
    params: dict[str, str],
    rows: list[dict[str, Any]],
) -> tuple[int, int]:
    """Upsert rows; on HTTP 409 retry row-by-row and skip individual conflicts."""
    if not rows:
        return 0, 0

    payload = [_row_to_json(r) for r in rows]
    timeout = float(os.getenv("HTTP_TIMEOUT_SECONDS", "60"))
    resp = requests.post(
        endpoint,
        params=params,
        headers=headers,
        data=json.dumps(payload),
        timeout=timeout,
    )
    if resp.status_code in (200, 201, 204):
        return len(rows), 0

    detail = (resp.text or "")[:800]
    if resp.status_code == 409 and len(rows) > 1:
        LOG.warning(
            "PostgREST batch upsert HTTP 409; retrying %s rows individually. Body: %s",
            len(rows),
            detail,
        )
        upserted = 0
        skipped = 0
        for row in rows:
            row_upserted, row_skipped = _upsert_chunk(
                endpoint=endpoint,
                headers=headers,
                params=params,
                rows=[row],
            )
            upserted += row_upserted
            skipped += row_skipped
        return upserted, skipped

    if resp.status_code == 409:
        LOG.warning("Skipping row on PostgREST HTTP 409: %s", detail)
        return 0, 1

    LOG.error("PostgREST upsert failed HTTP %s: %s", resp.status_code, detail)
    raise RuntimeError(
        f"Supabase REST upsert failed (HTTP {resp.status_code}). "
        "Check SUPABASE_SERVICE_ROLE_KEY, RLS bypass for service role, and public.jobs exists. "
        f"Body: {detail}"
    )


def _row_to_json(row: dict[str, Any]) -> dict[str, Any]:
    posted = row.get("posted_at")
    posted_out: str | None
    if posted is None:
        posted_out = None
    elif isinstance(posted, datetime):
        posted_out = posted.isoformat()
    elif isinstance(posted, str):
        posted_out = posted or None
    else:
        posted_out = None

    return {
        "external_id": row["external_id"],
        "title": row["title"],
        "company": row["company"],
        "location": row["location"],
        "description": row["description"],
        "apply_url": row["apply_url"],
        "posted_at": posted_out,
        "source": row["source"],
        "kind": row.get("kind") or "listing",
        "classification": row.get("classification") or "employer_hiring",
        "is_community": bool(row.get("is_community", False)),
        "content_hash": row["content_hash"],
        "embedding_json": None,
        "embedding_model_version": None,
    }


def persist_normalized_jobs_via_rest(normalized_jobs: list[dict[str, Any]]) -> dict[str, int]:
    """
    Upsert jobs with ON CONFLICT (apply_url) DO UPDATE via PostgREST.

    Does not return insert vs update breakdown (PostgREST merge-duplicates).
    """
    base, key = _supabase_rest_base_and_key()
    endpoint = f"{base}/rest/v1/jobs"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    # public.jobs dedupes on apply_url (see runner.persist_normalized_jobs); external_id is secondary.
    params = {"on_conflict": "apply_url"}

    try:
        chunk_size = int(os.getenv("JOB_INGEST_REST_CHUNK", str(_DEFAULT_CHUNK)).strip())
    except ValueError:
        chunk_size = _DEFAULT_CHUNK
    chunk_size = max(1, min(chunk_size, 100))

    deduped = _dedupe_by_apply_url(normalized_jobs)
    if len(deduped) < len(normalized_jobs):
        LOG.info(
            "REST ingest deduped by apply_url: %s -> %s rows",
            len(normalized_jobs),
            len(deduped),
        )

    rows_considered = len(deduped)
    deduped, dup_ext_in_batch = _dedupe_by_external_id_keep_first(deduped)
    if dup_ext_in_batch:
        LOG.info(
            "REST ingest skipped duplicate external_id within batch: %s",
            dup_ext_in_batch,
        )

    existing_ext_urls = _fetch_existing_external_id_urls(
        base,
        key,
        [str(r.get("external_id") or "") for r in deduped],
    )
    deduped, skipped_ext_conflicts = _filter_external_id_conflicts(deduped, existing_ext_urls)
    if skipped_ext_conflicts:
        LOG.info(
            "REST ingest skipped external_id conflicts already in DB: %s",
            skipped_ext_conflicts,
        )

    batches_ok = 0
    rows_upserted = 0
    rows_skipped = dup_ext_in_batch + skipped_ext_conflicts

    for i in range(0, len(deduped), chunk_size):
        chunk = deduped[i : i + chunk_size]
        upserted, skipped = _upsert_chunk(
            endpoint=endpoint,
            headers=headers,
            params=params,
            rows=chunk,
        )
        if upserted:
            batches_ok += 1
        rows_upserted += upserted
        rows_skipped += skipped

    LOG.info(
        "REST upsert complete: rows=%s skipped=%s batches=%s chunk=%s",
        rows_upserted,
        rows_skipped,
        batches_ok,
        chunk_size,
    )
    return {
        "examined": rows_considered,
        "upserted": rows_upserted,
        "skipped": rows_skipped,
        "inserted": 0,
        "updated": 0,
        "unchanged": 0,
    }
