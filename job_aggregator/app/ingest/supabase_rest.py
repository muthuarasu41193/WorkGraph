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
    params = {"on_conflict": "apply_url"}

    try:
        chunk_size = int(os.getenv("JOB_INGEST_REST_CHUNK", str(_DEFAULT_CHUNK)).strip())
    except ValueError:
        chunk_size = _DEFAULT_CHUNK
    chunk_size = max(1, min(chunk_size, 100))

    examined = len(normalized_jobs)
    batches_ok = 0
    rows_upserted = 0

    for i in range(0, examined, chunk_size):
        chunk = normalized_jobs[i : i + chunk_size]
        payload = [_row_to_json(r) for r in chunk]
        resp = requests.post(
            endpoint,
            params=params,
            headers=headers,
            data=json.dumps(payload),
            timeout=float(os.getenv("HTTP_TIMEOUT_SECONDS", "60")),
        )
        if resp.status_code not in (200, 201, 204):
            detail = (resp.text or "")[:800]
            LOG.error(
                "PostgREST upsert failed HTTP %s: %s",
                resp.status_code,
                detail,
            )
            raise RuntimeError(
                f"Supabase REST upsert failed (HTTP {resp.status_code}). "
                "Check SUPABASE_SERVICE_ROLE_KEY, RLS bypass for service role, and public.jobs exists. "
                f"Body: {detail}"
            )
        batches_ok += 1
        rows_upserted += len(chunk)

    LOG.info(
        "REST upsert complete: rows=%s batches=%s chunk=%s",
        rows_upserted,
        batches_ok,
        chunk_size,
    )
    return {
        "examined": examined,
        "upserted": rows_upserted,
        "inserted": 0,
        "updated": 0,
        "unchanged": 0,
    }
