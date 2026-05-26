"""FastAPI application factory."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import ingest, jobs, search, sources
import logging

from app.config import use_supabase_rest_reads
from app.database import format_database_target, init_db

LOG = logging.getLogger(__name__)


@asynccontextmanager
async def _lifespan(_app: FastAPI):
    if use_supabase_rest_reads():
        LOG.info(
            "Job API reading via Supabase REST (SUPABASE_SERVICE_ROLE_KEY) — same store as ingest-community."
        )
    else:
        init_db()
        LOG.info("Job API reading from: %s", format_database_target())
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="WorkGraph Job Aggregator API",
        version="1.0.0",
        description="REST API for normalized jobs (ATS live listings + community posts).",
        lifespan=_lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )
    app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
    app.include_router(search.router, prefix="/search", tags=["search"])
    app.include_router(sources.router, prefix="/sources", tags=["sources"])
    app.include_router(ingest.router, prefix="/ingest", tags=["ingest"])

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
