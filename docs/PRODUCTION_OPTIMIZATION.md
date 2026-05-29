# Production optimization

## API (FastAPI)

- Run multiple Uvicorn workers behind a reverse proxy: `uvicorn app.api.main:app --workers 4`
- Set `API_RATE_LIMIT=60/minute` on public endpoints
- Pre-load sentence-transformers at container start (first request is slow otherwise)
- Use `--no-embed` for cron ingest when only listing cards are needed; run embed on a schedule via BullMQ `workgraph:embed` queue

## Database

- Create IVFFlat index after ≥ 1k jobs with embeddings (`migrations/postgres/002_core_schema.sql`)
- `VACUUM ANALYZE jobs` weekly
- Connection pool: SQLAlchemy `pool_size=10`, `max_overflow=20` for multi-worker API

## Ollama

- Pin model in `.env`: `OLLAMA_MODEL=deepseek-r1:1.5b`
- GPU: set `OLLAMA_NUM_GPU=1` in Ollama container
- Disable Ollama on ATS hot path if latency SLO < 2s: `use_ollama=false` in request body

## Next.js

- `output: "standalone"` enabled in `next.config.ts` for Docker
- Prefer `/api/v2/*` routes server-side only (`WORKGRAPH_API_URL` not public if API is internal)

## Caching

- Redis cache for `/jobs` list pages (TTL 60s) — add in phase 2
- CDN for MinIO `avatars` bucket public reads

## Scraping ethics

- Respect `robots.txt` and rate limits per source
- Store `last_seen_at` and mark `is_expired` after N days without refresh
