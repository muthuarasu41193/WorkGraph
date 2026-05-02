#!/usr/bin/env python3
"""Shim so `python main.py ingest` works when run from the job_aggregator/ directory."""

from app.main import main

if __name__ == "__main__":
    raise SystemExit(main())
