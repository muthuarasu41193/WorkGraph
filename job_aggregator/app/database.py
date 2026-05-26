"""SQLAlchemy engine, sessions, schema bootstrap."""

from __future__ import annotations

import logging
from collections.abc import Generator
from contextlib import contextmanager

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import DATABASE_CONNECT_ARGS, DATABASE_URL, infer_supabase_project_ref
from app.models import Base

LOG = logging.getLogger(__name__)

_connect_args = DATABASE_CONNECT_ARGS

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args=_connect_args,
    echo=False,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

# Columns added after early SQLite/Postgres deployments (see supabase migration 20260512193000).
_POSTGRES_COLUMN_DDLS: tuple[tuple[str, str], ...] = (
    ("kind", "TEXT NOT NULL DEFAULT 'listing'"),
    ("classification", "TEXT NOT NULL DEFAULT 'employer_hiring'"),
    ("is_community", "BOOLEAN NOT NULL DEFAULT false"),
)
_SQLITE_COLUMN_DDLS: tuple[tuple[str, str], ...] = (
    ("kind", "TEXT NOT NULL DEFAULT 'listing'"),
    ("classification", "TEXT NOT NULL DEFAULT 'employer_hiring'"),
    ("is_community", "INTEGER NOT NULL DEFAULT 0"),
)


def upgrade_schema(bind: Engine | None = None) -> None:
    """
    Add community metadata columns to existing jobs tables.

    SQLAlchemy create_all() does not ALTER existing tables; local jobs.db often
    predates kind / classification / is_community.
    """
    bind = bind or engine
    insp = inspect(bind)
    if not insp.has_table("jobs"):
        return

    existing = {col["name"] for col in insp.get_columns("jobs")}
    dialect = bind.dialect.name
    patches = _POSTGRES_COLUMN_DDLS if dialect == "postgresql" else _SQLITE_COLUMN_DDLS

    with bind.begin() as conn:
        for col_name, ddl in patches:
            if col_name in existing:
                continue
            if dialect == "postgresql":
                conn.execute(text(f"ALTER TABLE jobs ADD COLUMN IF NOT EXISTS {col_name} {ddl}"))
            else:
                conn.execute(text(f"ALTER TABLE jobs ADD COLUMN {col_name} {ddl}"))
            LOG.info("Added missing jobs.%s (%s)", col_name, dialect)


def format_database_target() -> str:
    """Human-readable label for logs (helps catch SQLite vs Supabase mismatches)."""
    url = DATABASE_URL
    url_str = url.render_as_string(hide_password=True) if hasattr(url, "render_as_string") else str(url)
    if url_str.startswith("sqlite"):
        path = url_str.replace("sqlite:///", "").replace("sqlite://", "")
        return f"SQLite ({path})"
    host = getattr(url, "host", None) or ""
    if "supabase.co" in host or "pooler.supabase.com" in host:
        ref = infer_supabase_project_ref()
        return f"PostgreSQL / Supabase ({ref or host})"
    if host:
        return f"PostgreSQL ({host})"
    return url_str


def init_db() -> None:
    """Create tables if missing, then patch older schemas."""
    Base.metadata.create_all(bind=engine)
    upgrade_schema()
    LOG.info("Database target: %s", format_database_target())


@contextmanager
def session_scope() -> Generator[Session, None, None]:
    """Transactional scope — commit on success, rollback on error."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_session() -> Session:
    """Caller must close(). Prefer session_scope() for writes."""
    return SessionLocal()
