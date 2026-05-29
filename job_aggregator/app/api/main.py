"""FastAPI application factory."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.routes import ats, community, ingest, jobs, match, profile_wg, resume, search, sources, wallet
from app.config import use_supabase_rest_reads
from app.database import format_database_target, init_db

LOG = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address, default_limits=[os.getenv("API_RATE_LIMIT", "120/minute")])


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
        title="WorkGraph API",
        version="2.0.0",
        description=(
            "Self-hosted WorkGraph API: jobs, search, resume parsing, ATS scoring, "
            "semantic matching, and ingest triggers."
        ),
        lifespan=_lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    origins = os.getenv("CORS_ORIGINS", "*").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in origins if o.strip()],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
    app.include_router(search.router, prefix="/search", tags=["search"])
    app.include_router(sources.router, prefix="/sources", tags=["sources"])
    app.include_router(ingest.router, prefix="/ingest", tags=["ingest"])
    app.include_router(resume.router, prefix="/resume", tags=["resume"])
    app.include_router(ats.router, prefix="/ats", tags=["ats"])
    app.include_router(match.router, prefix="/match", tags=["match"])
    app.include_router(profile_wg.router, prefix="/profile", tags=["profile"])
    app.include_router(community.router, prefix="/community", tags=["community"])
    app.include_router(wallet.router, prefix="/wallet", tags=["wallet"])

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "service": "workgraph-api"}

    @app.get("/metrics")
    def metrics() -> JSONResponse:
        """Minimal Prometheus-style metrics (expand with prometheus_client later)."""
        from app.services.ollama_client import ollama_available

        lines = [
            "# HELP workgraph_up API is running",
            "# TYPE workgraph_up gauge",
            "workgraph_up 1",
            "# HELP workgraph_ollama_up Ollama reachable",
            "# TYPE workgraph_ollama_up gauge",
            f"workgraph_ollama_up {1 if ollama_available() else 0}",
        ]
        return JSONResponse(content="\n".join(lines), media_type="text/plain")

    @app.exception_handler(Exception)
    async def unhandled(_request: Request, exc: Exception) -> JSONResponse:
        LOG.exception("Unhandled error: %s", exc)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    return app


app = create_app()
