# WorkGraph setup

WorkGraph is an AI-powered hidden job discovery platform built entirely with **free, open-source, self-hostable** components.

## Prerequisites

- Docker 24+ and Docker Compose v2
- Node.js 20+ (local web dev)
- Python 3.12+ (local API dev)
- 16 GB RAM recommended when running Ollama + sentence-transformers locally

## Quick start (Docker)

```bash
cd "C:/Cursor Learning/landing"
cp .env.workgraph.example .env
# Edit secrets (POSTGRES_PASSWORD, JOB_AGGREGATOR_API_KEY, etc.)

docker compose -f infrastructure/docker-compose.yml up -d postgres redis minio typesense api
```

Pull a local LLM (optional, improves resume/ATS quality):

```bash
docker compose -f infrastructure/docker-compose.yml --profile ai up -d ollama
docker exec -it workgraph-ollama-1 ollama pull deepseek-r1:1.5b
```

Start the web app locally (points at API on port 8000):

```bash
cp .env.workgraph.example .env.local
npm install
npm run dev
```

Verify:

- API health: http://localhost:8000/health
- API docs: http://localhost:8000/docs
- Web: http://localhost:3000

## Services map

| Service    | Port (default) | Purpose                          |
|-----------|----------------|----------------------------------|
| postgres  | 5432           | Primary DB + pgvector            |
| redis     | 6379           | BullMQ job queues                |
| minio     | 9000 / 9001    | Resume & file storage            |
| typesense | 8108           | Typo-tolerant job search         |
| api       | 8000           | FastAPI (jobs, resume, ATS)      |
| web       | 3000           | Next.js dashboard                |
| ollama    | 11434          | Local LLM (DeepSeek, etc.)         |

Optional profiles: `--profile full` adds SuperTokens, n8n, Grafana, Prometheus, Uptime Kuma.

## Database migrations

SQL migrations run automatically on first Postgres boot from `migrations/postgres/`.

For existing Supabase projects, keep using Supabase migrations in `supabase/migrations/` until you cut over to self-hosted Postgres.

## Environment files

| File                    | Used by                          |
|-------------------------|----------------------------------|
| `.env` / `.env.local`   | Next.js                          |
| `job_aggregator/.env`   | Python API & CLI ingest          |
| `.env.workgraph.example`| Template for all variables       |

## Incremental rollout

WorkGraph supports **dual mode** during migration:

1. **Self-hosted mode**: set `WORKGRAPH_API_URL` → resume/ATS use `/api/v2/*` → FastAPI + Ollama + spaCy
2. **Legacy mode**: Supabase + Groq via `/api/parse-resume` when `WORKGRAPH_API_URL` is unset

See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) and [DEPLOYMENT.md](./DEPLOYMENT.md).
