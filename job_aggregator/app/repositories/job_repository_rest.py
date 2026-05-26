"""Read jobs via Supabase PostgREST (no DATABASE_PASSWORD required)."""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import quote

import requests

from app.ingest.supabase_rest import _supabase_rest_base_and_key

LOG = logging.getLogger(__name__)

_SELECT = (
    "id,title,company,location,description,apply_url,posted_at,source,kind,classification,is_community"
)


def _parse_content_range(header: str | None) -> int | None:
    if not header or "/" not in header:
        return None
    try:
        return int(header.split("/")[-1].strip())
    except ValueError:
        return None


class JobRepositoryRest:
    """PostgREST-backed job queries — mirrors JobRepository for JobService."""

    def __init__(self) -> None:
        self._base, self._key = _supabase_rest_base_and_key()
        self._endpoint = f"{self._base}/rest/v1/jobs"

    def _headers(self, *, count_exact: bool = False, range_spec: str | None = None) -> dict[str, str]:
        headers = {
            "apikey": self._key,
            "Authorization": f"Bearer {self._key}",
            "Accept": "application/json",
        }
        if count_exact:
            headers["Prefer"] = "count=exact"
        if range_spec:
            headers["Range"] = range_spec
        return headers

    def _filter_params(
        self,
        *,
        source: str | None = None,
        sources: list[str] | None = None,
        community: bool | None = None,
        q: str | None = None,
    ) -> dict[str, str]:
        params: dict[str, str] = {"select": _SELECT}
        if community is not None:
            params["is_community"] = f"eq.{str(community).lower()}"
        if source:
            params["source"] = f"eq.{source.strip().lower()}"
        elif sources:
            normalized = [s.strip().lower() for s in sources if s.strip()]
            if normalized:
                params["source"] = f"in.({','.join(normalized)})"
        if q:
            term = quote(q.strip(), safe="")
            pattern = f"*{term}*"
            params["or"] = (
                f"(title.ilike.{pattern},company.ilike.{pattern},"
                f"location.ilike.{pattern},description.ilike.{pattern})"
            )
        return params

    def _get(
        self,
        params: dict[str, str],
        *,
        range_spec: str | None = None,
        count_exact: bool = False,
    ) -> tuple[list[dict[str, Any]], int | None]:
        headers = self._headers(count_exact=count_exact, range_spec=range_spec)
        params = {**params, "order": "posted_at.desc.nullslast,id.desc"}
        resp = requests.get(
            self._endpoint,
            params=params,
            headers=headers,
            timeout=float(__import__("os").getenv("HTTP_TIMEOUT_SECONDS", "60")),
        )
        if resp.status_code not in (200, 206):
            detail = (resp.text or "")[:500]
            raise RuntimeError(f"Supabase REST read failed HTTP {resp.status_code}: {detail}")
        rows = resp.json()
        if not isinstance(rows, list):
            rows = []
        total = _parse_content_range(resp.headers.get("Content-Range"))
        return rows, total

    def count(
        self,
        *,
        source: str | None = None,
        sources: list[str] | None = None,
        community: bool | None = None,
        q: str | None = None,
    ) -> int:
        params = self._filter_params(source=source, sources=sources, community=community, q=q)
        _, total = self._get(params, range_spec="0-0", count_exact=True)
        return int(total or 0)

    def list_jobs(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        source: str | None = None,
        sources: list[str] | None = None,
        community: bool | None = None,
        q: str | None = None,
    ) -> list[dict[str, Any]]:
        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        start = (page - 1) * page_size
        end = start + page_size - 1
        params = self._filter_params(source=source, sources=sources, community=community, q=q)
        rows, _ = self._get(params, range_spec=f"{start}-{end}", count_exact=True)
        return rows

    def source_summaries(self, *, community: bool | None = None) -> list[tuple[str, int, bool]]:
        params: dict[str, str] = {"select": "source,is_community"}
        if community is not None:
            params["is_community"] = f"eq.{str(community).lower()}"
        counts: dict[tuple[str, bool], int] = {}
        offset = 0
        page_size = 1000
        while True:
            headers = self._headers(range_spec=f"{offset}-{offset + page_size - 1}")
            resp = requests.get(
                self._endpoint,
                params={**params, "order": "id.asc"},
                headers=headers,
                timeout=60,
            )
            if resp.status_code not in (200, 206):
                break
            batch = resp.json()
            if not isinstance(batch, list) or not batch:
                break
            for row in batch:
                src = str(row.get("source") or "").strip()
                is_comm = bool(row.get("is_community"))
                key = (src, is_comm)
                counts[key] = counts.get(key, 0) + 1
            if len(batch) < page_size:
                break
            offset += page_size
        out = [(src, cnt, is_comm) for (src, is_comm), cnt in counts.items()]
        out.sort(key=lambda x: x[1], reverse=True)
        return out

    def total_count(self) -> int:
        _, total = self._get({"select": "id"}, range_spec="0-0", count_exact=True)
        return int(total or 0)
