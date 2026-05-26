"""
Async RSS / Atom feed ingest for community job listings.
"""

from __future__ import annotations

import os
from typing import Any
from urllib.parse import urlparse
from xml.etree import ElementTree as ET

from app.http.client import fetch_text
from app.ingest.base import (
    compact_text,
    host_label,
    normalize_job,
    parse_datetime,
    rss_item_link,
    rss_item_text,
    split_csv,
)
from app.utils import LOG


def _default_feed_urls() -> list[str]:
    raw = os.getenv(
        "RSS_FEED_URLS",
        "https://jobicy.com/?feed=job_feed,https://weworkremotely.com/remote-jobs.rss",
    )
    return split_csv(raw)


def _local_name(tag: str) -> str:
    return str(tag or "").split("}", 1)[-1].lower()


def _parse_items(xml_text: str) -> list[ET.Element]:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as exc:
        LOG.warning("RSS parse failed: %s", exc)
        return []
    return [elem for elem in root.iter() if _local_name(elem.tag) in {"item", "entry"}]


async def _fetch_feed_items(url: str) -> list[ET.Element]:
    xml_text = await fetch_text(url)
    if not xml_text:
        return []
    return _parse_items(xml_text)


async def fetch_rss_jobs_async() -> list[dict[str, Any]]:
    feeds = _default_feed_urls()
    if not feeds:
        return []

    normalized: list[dict[str, Any]] = []
    seen_urls: set[str] = set()

    for feed_url in feeds:
        items = await _fetch_feed_items(feed_url)
        feed_host = host_label(feed_url) or "rss"
        kept = 0
        for item in items:
            title = rss_item_text(item, "title")
            apply_url = rss_item_link(item)
            if not title or not apply_url:
                continue
            if apply_url in seen_urls:
                continue
            guid = rss_item_text(item, "guid", "id") or apply_url
            categories = rss_item_text(item, "category")
            description = compact_text(
                rss_item_text(item, "description", "summary", "content"),
                categories,
                f"Feed: {feed_url}",
            )
            row = normalize_job(
                source="rss",
                external_id=f"rss:{feed_host}:{guid}",
                title=title,
                company=feed_host,
                location=categories or "RSS feed",
                description=description,
                apply_url=apply_url,
                posted_at=parse_datetime(rss_item_text(item, "pubDate", "published", "updated")),
                kind="listing",
                classification="employer_hiring",
                is_community=True,
            )
            if row is None:
                continue
            normalized.append(row)
            seen_urls.add(apply_url)
            kept += 1
        LOG.info("RSS async feed=%s items=%s kept=%s", feed_url, len(items), kept)

    return normalized
