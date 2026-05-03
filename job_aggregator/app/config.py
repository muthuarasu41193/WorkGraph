"""
Central configuration loaded from environment variables.

DATABASE_URL examples:
  sqlite:///./jobs.db
  postgresql+psycopg2://user:pass@host:5432/dbname

Prefer split vars for Supabase when passwords contain @ or other URI-special characters:
  DATABASE_HOST, DATABASE_PASSWORD, DATABASE_USER, DATABASE_NAME, DATABASE_PORT
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from sqlalchemy.engine.url import URL, make_url

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
_REPO_ROOT = _PROJECT_ROOT.parent

# Landing repo secrets (NEXT_PUBLIC_SUPABASE_URL, etc.), then job_aggregator/.env wins.
for _env_name in (".env", ".env.local"):
    load_dotenv(_REPO_ROOT / _env_name)
load_dotenv(_PROJECT_ROOT / ".env", override=True)


def _default_sqlite_url() -> str:
    """SQLite file beside job_aggregator root when DATABASE_URL unset."""
    return f"sqlite:///{_PROJECT_ROOT / 'jobs.db'}"


def _first_nonempty_env(*keys: str) -> str:
    for key in keys:
        val = os.getenv(key)
        if val is not None and val.strip():
            return val.strip()
    return ""


def _password_env() -> str | None:
    for key in ("DATABASE_PASSWORD", "SUPABASE_DB_PASSWORD"):
        raw = os.getenv(key)
        if raw is None:
            continue
        if raw.strip() == "":
            continue
        return raw
    return None


def _collapse_typo_space_after_user_password_colon(url: str) -> str:
    """Fix `.env` typo `postgresql://postgres: secret@host` (space after colon)."""
    if not url.startswith("postgresql"):
        return url
    return re.sub(
        r"^(postgresql(?:\+[\w]+)?://[^/@?:]+):\s+",
        r"\1:",
        url,
        count=1,
    )


def infer_supabase_project_ref() -> str | None:
    """Resolve project ref from env or NEXT_PUBLIC_SUPABASE_URL (supports dashboard URLs)."""
    direct = _first_nonempty_env("SUPABASE_PROJECT_REF", "DATABASE_PROJECT_REF")
    if direct:
        return direct
    raw = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "").strip()
    if not raw:
        return None
    from urllib.parse import urlparse

    p = urlparse(raw if "://" in raw else f"https://{raw}")
    host = (p.netloc or "").lower().split(":")[0]
    if host.endswith(".supabase.co"):
        leaf = host.removesuffix(".supabase.co")
        if leaf and "." not in leaf:
            return leaf
        parts = leaf.split(".")
        if parts:
            return parts[-1]
    parts = [x for x in p.path.strip("/").split("/") if x]
    if "project" in parts:
        i = parts.index("project")
        if i + 1 < len(parts):
            return parts[i + 1]
    return None


def _pg_pooler_from_shorthand() -> URL | None:
    """Session pooler (IPv4). Use DATABASE_POOLER_HOST from Connect UI, or region + aws prefix.

    Some projects use ``aws-1-<region>`` instead of ``aws-0-<region>`` (probe-db discovers both).
    """
    pwd = _password_env()
    if pwd is None:
        return None
    ref = infer_supabase_project_ref()
    if not ref:
        return None

    host_override = _first_nonempty_env("DATABASE_POOLER_HOST", "SUPABASE_POOLER_HOST")
    if host_override:
        host = host_override.strip()
    else:
        region = _first_nonempty_env("DATABASE_POOLER_REGION", "SUPABASE_POOLER_REGION")
        if not region:
            return None
        prefix = _first_nonempty_env("DATABASE_POOLER_AWS_PREFIX", "aws-0") or "aws-0"
        if prefix not in ("aws-0", "aws-1"):
            prefix = "aws-0"
        host = f"{prefix}-{region}.pooler.supabase.com"
    user = f"postgres.{ref}"
    db = _first_nonempty_env("DATABASE_NAME", "SUPABASE_DB_NAME") or "postgres"
    port_str = _first_nonempty_env("DATABASE_PORT", "SUPABASE_DB_PORT") or "5432"
    port = int(port_str)
    query = {"sslmode": "require"}
    return URL.create(
        drivername="postgresql+psycopg2",
        username=user,
        password=pwd,
        host=host,
        port=port,
        database=db,
        query=query,
    )


def _pg_from_components() -> URL | None:
    """Build URL with URL.create so passwords never need manual %-encoding."""
    host = _first_nonempty_env("DATABASE_HOST", "SUPABASE_DB_HOST")
    pwd = _password_env()
    if not host or pwd is None:
        return None
    user = _first_nonempty_env("DATABASE_USER", "SUPABASE_DB_USER") or "postgres"
    db = _first_nonempty_env("DATABASE_NAME", "SUPABASE_DB_NAME") or "postgres"
    port_str = _first_nonempty_env("DATABASE_PORT", "SUPABASE_DB_PORT") or "5432"
    port = int(port_str)
    query: dict[str, Any] = {}
    if host.endswith(".supabase.co") or ".pooler.supabase.com" in host:
        query["sslmode"] = "require"
    return URL.create(
        drivername="postgresql+psycopg2",
        username=user,
        password=pwd,
        host=host,
        port=port,
        database=db,
        query=query,
    )


def _normalize_database_url(raw: str) -> str:
    s = _collapse_typo_space_after_user_password_colon(raw.strip())
    if not s:
        return _default_sqlite_url()
    _validate_database_url(s)
    if _is_supabase_host(s):
        u = make_url(s)
        q = dict(u.query)
        q.setdefault("sslmode", "require")
        u = u.update_query_dict(q)
        return u.render_as_string(hide_password=False)
    return s


def _is_supabase_host(url_or_str: str) -> bool:
    if not url_or_str.startswith("postgresql"):
        return False
    try:
        h = make_url(url_or_str).host or ""
    except Exception:
        return False
    return "supabase.co" in h or "pooler.supabase.com" in h


def _validate_database_url(url: str) -> None:
    """Catch common mis-pastes before psycopg2 emits opaque DNS errors."""
    if url.startswith("sqlite"):
        return
    try:
        u = make_url(url)
    except Exception as exc:
        raise ValueError(
            "DATABASE_URL is not a valid SQLAlchemy URL. "
            "Expected postgresql+psycopg2://USER:PASSWORD@HOST:5432/DBNAME "
            "(password special chars must be URL-encoded), "
            "or set DATABASE_HOST + DATABASE_PASSWORD instead."
        ) from exc
    if not u.host:
        raise ValueError("DATABASE_URL must include a host after '@'.")
    # Unescaped @ in the password splits the authority wrong → psycopg2 tries to resolve
    # "tail-of-password@db....supabase.co" as hostname (cryptic DNS errors).
    if "@" in u.host:
        raise ValueError(
            "DATABASE_URL looks mis-parsed: host contains '@'. "
            "Encode @ as %40 in the password segment, or use DATABASE_HOST + DATABASE_PASSWORD "
            "(raw password, no encoding needed)."
        )
    user = u.username or ""
    if user and any(ch in user for ch in "<>[]{}"):
        raise ValueError(
            "DATABASE_URL username looks invalid (unexpected characters). "
            "Supabase direct connections use username `postgres` (pooler: `postgres.<project-ref>`). "
            "Copy the connection string from Supabase → Project Settings → Database."
        )


def _resolve_database_url() -> str | URL:
    # Resolve Session pooler *before* DATABASE_HOST. A common .env mistake is
    # DATABASE_HOST=aws-*-....pooler.supabase.com with default user "postgres";
    # the pooler requires ``postgres.<project_ref>`` (handled in _pg_pooler_from_shorthand).
    pooler = _pg_pooler_from_shorthand()
    if pooler is not None:
        return pooler
    built = _pg_from_components()
    if built is not None:
        return built
    raw = os.getenv("DATABASE_URL", "").strip()
    if raw:
        return _normalize_database_url(raw)
    return _default_sqlite_url()


def database_connect_args(url: str | URL) -> dict[str, Any]:
    """psycopg2 connect kwargs (SSL for Supabase; sqlite thread flag)."""
    if isinstance(url, str):
        if url.startswith("sqlite"):
            return {"check_same_thread": False}
        u = make_url(url)
    else:
        u = url
    if u.drivername.startswith("sqlite"):
        return {"check_same_thread": False}
    out: dict[str, Any] = {}
    host = u.host or ""
    if "supabase.co" in host or "pooler.supabase.com" in host:
        # Also set via query string; duplicate sslmode in connect_args is fine for libpq.
        out["sslmode"] = "require"
    # Direct db.*.supabase.co is often IPv6-only; Windows frequently fails DNS for that host.
    # Run: nslookup db.<ref>.supabase.co — if you get an AAAA line, paste it as DATABASE_HOSTADDR.
    hostaddr = _first_nonempty_env("DATABASE_HOSTADDR", "SUPABASE_DB_HOSTADDR")
    if hostaddr:
        out["hostaddr"] = hostaddr
    return out


DATABASE_URL: str | URL = _resolve_database_url()
DATABASE_CONNECT_ARGS: dict[str, Any] = database_connect_args(DATABASE_URL)

# Embedding model — local MiniLM as specified (384-dim vectors).
EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")

# Fixed version tag stored with embeddings for future migrations / recompute policies.
EMBEDDING_MODEL_VERSION: str = os.getenv("EMBEDDING_MODEL_VERSION", "all-MiniLM-L6-v2-v1")

# HTTP timeouts & retries (handled in utils.http_get).
HTTP_TIMEOUT_SECONDS: float = float(os.getenv("HTTP_TIMEOUT_SECONDS", "25"))
HTTP_MAX_RETRIES: int = int(os.getenv("HTTP_MAX_RETRIES", "4"))

# Embedding batch size for sentence-transformers.encode.
EMBED_BATCH_SIZE: int = int(os.getenv("EMBED_BATCH_SIZE", "32"))

COMPANIES_JSON: Path = Path(
    os.getenv("COMPANIES_JSON", str(Path(__file__).resolve().parent.parent / "companies.json"))
)
