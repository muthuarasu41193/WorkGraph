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
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ingest.ashby import fetch_ashby_jobs
from app.ingest.greenhouse import fetch_greenhouse_jobs
from app.ingest.lever import fetch_lever_jobs
from app.models import Job

LOG = logging.getLogger(__name__)


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


def run_full_ingestion(session: Session, companies_path: Path) -> dict[str, Any]:
    """Fetch every configured board/site/slug and persist normalized rows."""
    companies = load_companies(companies_path)

    totals = {
        "greenhouse_boards": 0,
        "lever_sites": 0,
        "ashby_slugs": 0,
        "normalized_rows": 0,
        "inserted": 0,
        "updated": 0,
        "unchanged": 0,
    }

    all_rows: list[dict[str, Any]] = []

    for token in companies["greenhouse"]:
        totals["greenhouse_boards"] += 1
        all_rows.extend(fetch_greenhouse_jobs(token))

    for site in companies["lever"]:
        totals["lever_sites"] += 1
        all_rows.extend(fetch_lever_jobs(site))

    for slug in companies["ashby"]:
        totals["ashby_slugs"] += 1
        all_rows.extend(fetch_ashby_jobs(slug))

    totals["normalized_rows"] = len(all_rows)

    agg = persist_normalized_jobs(session, all_rows)
    totals["inserted"] = agg["inserted"]
    totals["updated"] = agg["updated"]
    totals["unchanged"] = agg["unchanged"]

    LOG.info(
        "Ingest complete boards/gh=%s lever=%s ashby=%s rows=%s inserted=%s updated=%s unchanged=%s",
        totals["greenhouse_boards"],
        totals["lever_sites"],
        totals["ashby_slugs"],
        totals["normalized_rows"],
        totals["inserted"],
        totals["updated"],
        totals["unchanged"],
    )

    return totals
