"""
CLI entrypoints:

    python -m app.main ingest
    python -m app.main match --resume path/to/resume.txt

Or from job_aggregator/: ``python main.py ...`` (thin shim at repo root).
"""

from __future__ import annotations

import argparse
import getpass
import json
import os
import sys
from pathlib import Path


def _cmd_ingest(*, no_embed: bool = False) -> int:
    from app.config import COMPANIES_JSON
    from app.database import init_db, session_scope
    from app.ingest.runner import run_full_ingestion
    from app.utils import configure_logging

    configure_logging()
    init_db()

    with session_scope() as session:
        stats = run_full_ingestion(session, Path(COMPANIES_JSON))
        print(json.dumps({"ingestion": stats}, indent=2))

        if no_embed:
            print(json.dumps({"embedding_jobs_encoded": "skipped_no_embed"}, indent=2))
        else:
            from app.config import EMBED_BATCH_SIZE
            from app.matching.embedder import JobEmbedder, embed_pending_jobs

            embedder = JobEmbedder()
            embedded = embed_pending_jobs(session, embedder, batch_size=EMBED_BATCH_SIZE)
            print(json.dumps({"embedding_jobs_encoded": embedded}, indent=2))

    return 0


POOLER_PROBE_REGIONS = (
    "us-east-1",
    "us-east-2",
    "us-west-1",
    "us-west-2",
    "ca-central-1",
    "eu-west-1",
    "eu-west-2",
    "eu-west-3",
    "eu-central-1",
    "eu-central-2",
    "eu-north-1",
    "ap-south-1",
    "ap-south-2",
    "ap-southeast-1",
    "ap-southeast-2",
    "ap-northeast-1",
    "ap-northeast-2",
    "sa-east-1",
    "af-south-1",
    "me-central-1",
    "me-south-1",
)


def _cmd_probe_db() -> int:
    """Try Session pooler hosts until one accepts postgres.<ref> (IPv4-friendly vs direct db IPv6-only)."""
    import psycopg2

    from app.config import infer_supabase_project_ref

    ref = infer_supabase_project_ref()
    print(json.dumps({"project_ref_inferred": ref}, indent=2))
    pwd = None
    for key in ("DATABASE_PASSWORD", "SUPABASE_DB_PASSWORD"):
        raw = os.getenv(key)
        if raw is not None and raw.strip():
            pwd = raw
            break
    if not ref:
        print(
            "Set SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL "
            "(e.g. https://<ref>.supabase.co or Supabase dashboard URL with .../project/<ref>/...).",
            file=sys.stderr,
        )
        return 1
    if pwd is None:
        if sys.stdin.isatty():
            pwd = getpass.getpass(
                "Database password (Supabase → Project Settings → Database; input hidden): "
            )
        if not pwd or not pwd.strip():
            print(
                "No password: set DATABASE_PASSWORD in job_aggregator/.env "
                "(remove the line if blank so it does not override), or run probe-db in a terminal.",
                file=sys.stderr,
            )
            return 1
        pwd = pwd.strip()

    user = f"postgres.{ref}"
    db = os.getenv("DATABASE_NAME") or os.getenv("SUPABASE_DB_NAME") or "postgres"
    port = int((os.getenv("DATABASE_PORT") or os.getenv("SUPABASE_DB_PORT") or "5432").strip())

    # Hosted Supabase may register the tenant on aws-1-<region> instead of aws-0-<region>.
    # See: https://stackoverflow.com/questions/78422887 (pooler hostname must match dashboard).
    for aws_prefix in ("aws-0", "aws-1"):
        for region in POOLER_PROBE_REGIONS:
            host = f"{aws_prefix}-{region}.pooler.supabase.com"
            try:
                conn = psycopg2.connect(
                    host=host,
                    port=port,
                    dbname=db,
                    user=user,
                    password=pwd,
                    sslmode="require",
                    connect_timeout=12,
                )
                conn.close()
                print(
                    json.dumps(
                        {
                            "ok": True,
                            "DATABASE_POOLER_HOST": host,
                            "DATABASE_POOLER_AWS_PREFIX": aws_prefix,
                            "DATABASE_POOLER_REGION": region,
                        },
                        indent=2,
                    )
                )
                print(
                    f"\nAdd to job_aggregator/.env (either full host or prefix + region):\n"
                    f"DATABASE_POOLER_HOST={host}\n"
                    f"# or:\n# DATABASE_POOLER_AWS_PREFIX={aws_prefix}\n# DATABASE_POOLER_REGION={region}\n"
                    f"# plus DATABASE_PASSWORD and SUPABASE_PROJECT_REF={ref} (or NEXT_PUBLIC_SUPABASE_URL)."
                )
                return 0
            except psycopg2.OperationalError as exc:
                msg = str(exc).replace("\n", " ").lower()
                if "password authentication failed" in msg:
                    print(json.dumps({"ok": False, "error": "password authentication failed"}, indent=2), file=sys.stderr)
                    return 1
                if "tenant" in msg or "enotfound" in msg or "user not found" in msg:
                    continue
                if "could not translate host name" in msg:
                    continue
                print(json.dumps({"tried": host, "error": str(exc)[:240]}, indent=2))
                return 1

    # Direct connection (user postgres, not postgres.ref) — works when IPv6/DNS route to db.* is OK.
    direct_host = f"db.{ref}.supabase.co"
    try:
        conn = psycopg2.connect(
            host=direct_host,
            port=port,
            dbname=db,
            user="postgres",
            password=pwd,
            sslmode="require",
            connect_timeout=15,
        )
        conn.close()
        print(json.dumps({"ok": True, "mode": "direct", "DATABASE_HOST": direct_host, "DATABASE_USER": "postgres"}, indent=2))
        print(
            f"\nPooler did not match; direct connection works. Add to job_aggregator/.env:\n"
            f"DATABASE_HOST={direct_host}\n"
            f"DATABASE_USER=postgres\n"
            f"DATABASE_PASSWORD=<same>\n"
            f"DATABASE_PORT={port}\n"
            f"# Remove DATABASE_POOLER_* lines so these take effect."
        )
        return 0
    except psycopg2.OperationalError as exc:
        print(json.dumps({"direct_attempt": direct_host, "error": str(exc)[:280]}, indent=2))

    print(
        json.dumps(
            {
                "ok": False,
                "hint": "No pooler host matched; direct db.* also failed. Confirm DATABASE_PASSWORD in "
                "Supabase → Settings → Database, then copy the exact Session pooler host from Connect "
                "(may be aws-1-… not aws-0-…). You can set DATABASE_POOLER_HOST to that full hostname.",
            },
            indent=2,
        )
    )
    return 1


def _cmd_match(resume: Path, top_k: int) -> int:
    from app.database import init_db, session_scope
    from app.matching.embedder import JobEmbedder
    from app.matching.matcher import match_resume_file
    from app.utils import configure_logging

    configure_logging()
    init_db()

    with session_scope() as session:
        embedder = JobEmbedder()
        matches = match_resume_file(session, embedder, resume, top_k=top_k)

    print(json.dumps({"matches": matches, "count": len(matches)}, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="WorkGraph job aggregator — ATS ingest + local embedding match.")
    sub = parser.add_subparsers(dest="command", required=True)

    p_ingest = sub.add_parser("ingest", help="Fetch jobs from configured ATS boards, dedupe, embed new/changed rows.")
    p_ingest.add_argument(
        "--no-embed",
        action="store_true",
        help="Skip sentence-transformers (fast CI/cron). Website job cards only need rows in public.jobs.",
    )
    p_ingest.set_defaults(func=lambda args: _cmd_ingest(no_embed=bool(getattr(args, "no_embed", False))))

    p_probe = sub.add_parser(
        "probe-db",
        help="Find DATABASE_POOLER_REGION when direct db.* fails DNS (IPv6-only); uses Session pooler (IPv4).",
    )
    p_probe.set_defaults(func=lambda _: _cmd_probe_db())

    p_match = sub.add_parser("match", help="Embed resume text locally and print top similarity matches.")
    p_match.add_argument("--resume", required=True, type=Path, help="Plain-text resume (.txt) path.")
    p_match.add_argument("--top-k", type=int, default=20, dest="top_k", help="Number of matches (default 20).")
    p_match.set_defaults(func=lambda args: _cmd_match(args.resume, args.top_k))

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
