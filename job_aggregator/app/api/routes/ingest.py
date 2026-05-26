"""POST /ingest — trigger community sync (cron / ops)."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import verify_ingest_key
from app.config import should_use_rest_ingest
from app.services.ingest_service import IngestService

router = APIRouter()


@router.post("/community", dependencies=[Depends(verify_ingest_key)])
def ingest_community() -> dict:
    if should_use_rest_ingest():
        return IngestService().run_community_sync(None)
    from app.database import session_scope

    with session_scope() as session:
        return IngestService().run_community_sync(session)
