"""Community ingest orchestration (cron / internal API)."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.ingest.community_runner import run_community_ingestion
from app.ingest.supabase_rest import persist_normalized_jobs_via_rest


class IngestService:
    def run_community_sync(self, session: Session | None) -> dict[str, Any]:
        if session is not None:
            return run_community_ingestion(session)

        from app.ingest.community_runner import fetch_community_jobs_async
        import asyncio

        rows = asyncio.run(fetch_community_jobs_async())
        agg = persist_normalized_jobs_via_rest(rows)
        return {
            "normalized_rows": len(rows),
            "ingestion_backend": "supabase_rest",
            **agg,
        }
