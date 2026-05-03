"""
Orchestrates multi-ATS ingestion + persistence with dedupe rules.

Dedup strategy:
  - Primary key for uniqueness in DB: apply_url (unique constraint).
  - external_id also unique for debugging / cross-system reconciliation.

When apply_url exists but content_hash changed → refresh textual fields & wipe embedding so matcher re-encodes.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.ingest.ashby import fetch_ashby_jobs
from app.ingest.greenhouse import fetch_greenhouse_jobs
from app.ingest.lever import fetch_lever_jobs
from app.models import Job

LOG = logging.getLogger(__name__)

_ATS_SOURCES = frozenset({"greenhouse", "lever", "ashby"})


def prune_jobs_missing_from_fetch(session: Session, apply_urls: set[str], *, min_fetched: int) -> int:
    """
    Delete ATS-backed rows whose apply_url was not returned in this ingest pass.

    Guarded by min_fetched so a transient empty API response does not wipe the table.
    """
    if len(apply_urls) < min_fetched:
        LOG.info(
            "Skipping prune: fetched URLs (%s) < INGEST_PRUNE_MIN_FETCHED (%s)",
            len(apply_urls),
            min_fetched,
        )
        return 0
    res = session.execute(delete(Job).where(Job.source.in_(_ATS_SOURCES), Job.apply_url.not_in(apply_urls)))
    removed = int(res.rowcount or 0)
    if removed:
        LOG.info("Pruned %s jobs no longer returned by ATS feeds", removed)
    return removed


def load_companies(path: Path) -> dict[str, list[str]]:
    if not path.exists():
        raise FileNotFoundError(f"Missing companies file: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("companies.json must be a JSON object")
    out: dict[str, list[str]] = {}
    for key in ("greenhouse", "lever", "ashby"):
        raw = data.get(key, [])
        if raw is None:
            out[key] = []
        elif isinstance(raw, list):
            out[key] = [str(x).strip() for x in raw if str(x).strip()]
        else:
            raise ValueError(f"companies.{key} must be a list")
    return out


def collect_normalized_jobs(companies_path: Path) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """Fetch all ATS boards and return normalized rows + board/site counts."""
    companies = load_companies(companies_path)
    boards = {"greenhouse_boards": 0, "lever_sites": 0, "ashby_slugs": 0}
    all_rows: list[dict[str, Any]] = []

    for token in companies["greenhouse"]:
        boards["greenhouse_boards"] += 1
        all_rows.extend(fetch_greenhouse_jobs(token))

    for site in companies["lever"]:
        boards["lever_sites"] += 1
        all_rows.extend(fetch_lever_jobs(site))

    for slug in companies["ashby"]:
        boards["ashby_slugs"] += 1
        all_rows.extend(fetch_ashby_jobs(slug))

    return all_rows, boards


def persist_normalized_jobs(session: Session, normalized_jobs: list[dict[str, Any]]) -> dict[str, int]:
    """
    Upsert normalized rows into Job table.

    Returns counters for observability / CLI reporting.
    """
    counts = {"examined": 0, "inserted": 0, "updated": 0, "unchanged": 0}

    for row in normalized_jobs:
        counts["examined"] += 1
        apply_url = row["apply_url"]
        external_id = row["external_id"]

        existing = session.scalar(select(Job).where(Job.apply_url == apply_url))
        if existing is not None:
            if existing.content_hash == row["content_hash"]:
                counts["unchanged"] += 1
                continue
            existing.external_id = external_id
            existing.title = row["title"]
            existing.company = row["company"]
            existing.location = row["location"]
            existing.description = row["description"]
            existing.posted_at = row["posted_at"]
            existing.source = row["source"]
            existing.content_hash = row["content_hash"]
            existing.embedding_json = None
            existing.embedding_model_version = None
            counts["updated"] += 1
            continue

        # New row — guard against external_id collision with different URL (rare ATS glitch).
        ext_conflict = session.scalar(select(Job).where(Job.external_id == external_id))
        if ext_conflict is not None:
            LOG.warning(
                "Skipping external_id collision (different URL?): ext=%s existing_url=%s new_url=%s",
                external_id,
                ext_conflict.apply_url,
                apply_url,
            )
            counts["unchanged"] += 1
            continue

        session.add(
            Job(
                external_id=external_id,
                title=row["title"],
                company=row["company"],
                location=row["location"],
                description=row["description"],
                apply_url=apply_url,
                posted_at=row["posted_at"],
                source=row["source"],
                content_hash=row["content_hash"],
                embedding_json=None,
                embedding_model_version=None,
            )
        )
        counts["inserted"] += 1

    session.flush()
    return counts


def run_full_ingestion_via_rest(companies_path: Path) -> dict[str, Any]:
    """Fetch ATS feeds and upsert rows via Supabase PostgREST (service role key)."""
    from app.ingest.supabase_rest import persist_normalized_jobs_via_rest

    all_rows, boards = collect_normalized_jobs(companies_path)
    totals: dict[str, Any] = {
        **boards,
        "normalized_rows": len(all_rows),
        "inserted": 0,
        "updated": 0,
        "unchanged": 0,
        "pruned": 0,
        "ingestion_backend": "supabase_rest",
    }
    agg = persist_normalized_jobs_via_rest(all_rows)
    totals["inserted"] = agg["inserted"]
    totals["updated"] = agg["updated"]
    totals["unchanged"] = agg["unchanged"]
    totals["upserted"] = agg["upserted"]

    LOG.info(
        "Ingest complete (REST) boards/gh=%s lever=%s ashby=%s rows=%s upserted=%s",
        totals["greenhouse_boards"],
        totals["lever_sites"],
        totals["ashby_slugs"],
        totals["normalized_rows"],
        totals["upserted"],
    )
    return totals


def run_full_ingestion(session: Session, companies_path: Path) -> dict[str, Any]:
    """Fetch every configured board/site/slug and persist normalized rows."""
    all_rows, boards = collect_normalized_jobs(companies_path)

    totals: dict[str, Any] = {
        **boards,
        "normalized_rows": len(all_rows),
        "inserted": 0,
        "updated": 0,
        "unchanged": 0,
        "pruned": 0,
        "ingestion_backend": "postgresql",
    }

    agg = persist_normalized_jobs(session, all_rows)
    totals["inserted"] = agg["inserted"]
    totals["updated"] = agg["updated"]
    totals["unchanged"] = agg["unchanged"]

    prune_flag = os.getenv("INGEST_PRUNE_MISSING", "").strip().lower()
    if prune_flag in ("1", "true", "yes"):
        try:
            min_fetched = int(os.getenv("INGEST_PRUNE_MIN_FETCHED", "80").strip())
        except ValueError:
            min_fetched = 80
        fetched_urls = {row["apply_url"] for row in all_rows}
        totals["pruned"] = prune_jobs_missing_from_fetch(session, fetched_urls, min_fetched=min_fetched)

    LOG.info(
        "Ingest complete boards/gh=%s lever=%s ashby=%s rows=%s inserted=%s updated=%s unchanged=%s pruned=%s",
        totals["greenhouse_boards"],
        totals["lever_sites"],
        totals["ashby_slugs"],
        totals["normalized_rows"],
        totals["inserted"],
        totals["updated"],
        totals["unchanged"],
        totals["pruned"],
    )

    return totals
