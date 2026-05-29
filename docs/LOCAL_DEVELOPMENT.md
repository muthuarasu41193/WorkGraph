# Local development

## 1. Infrastructure only

```bash
docker compose -f infrastructure/docker-compose.yml up -d postgres redis minio typesense
```

Copy env:

```bash
cp .env.workgraph.example .env
cp .env.workgraph.example job_aggregator/.env
```

Set in `job_aggregator/.env`:

```env
DATABASE_URL=postgresql+psycopg2://workgraph:workgraph_dev@localhost:5432/workgraph
```

## 2. Python API

```bash
cd job_aggregator
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
# On low-RAM Windows, skip --reload (loads ML libs twice) and use:
python -m app.main serve-api --port 8000
```

Ingest jobs (after DB is up):

```bash
python -m app.main ingest
python -m app.main ingest-community
```

## 3. Next.js web

```bash
npm install
# .env.local
# NEXT_PUBLIC_WORKGRAPH_API_URL=http://localhost:8000
# WORKGRAPH_API_URL=http://localhost:8000
npm run dev
```

With `WORKGRAPH_API_URL` set, the UI automatically uses:

- `POST /api/v2/parse-resume` — spaCy + optional Ollama, saves to Supabase profile
- `POST /api/v2/ats-score` — local ATS engine, saves score to profile
- `POST /api/v2/match-jobs` — semantic job matches for the dashboard

### Typesense search index

```bash
# After ingest populated jobs:
curl -X POST http://localhost:8000/ingest/typesense/sync \
  -H "Authorization: Bearer YOUR_JOB_AGGREGATOR_API_KEY"
```

Search: `GET http://localhost:8000/search?q=react&remote_type=remote`

## 4. Background worker

```bash
cd services/worker
npm install
set REDIS_URL=redis://localhost:6379/0
set WORKGRAPH_API_URL=http://localhost:8000
set JOB_AGGREGATOR_API_KEY=your_secret
npm run dev
```

## 5. Ollama (optional)

```bash
ollama serve
ollama pull deepseek-r1:1.5b
```

Without Ollama, resume parsing still works (spaCy + heuristics); ATS uses keyword overlap only.

## Testing API manually

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/ats/score \
  -H "Content-Type: application/json" \
  -d "{\"resume_text\":\"Senior Python engineer with 5 years AWS Docker FastAPI experience.\",\"job_description\":\"Looking for Python FastAPI AWS engineer.\"}"
```

## Feature implementation status

| #  | Feature              | Status in repo                                      |
|----|----------------------|-----------------------------------------------------|
| 1  | Resume parser        | FastAPI `/resume/parse` + Next `/api/v2/parse-resume` |
| 2  | ATS engine           | FastAPI `/ats/score` + local + Ollama               |
| 3  | Job matching         | `/match/jobs` + existing embedder                   |
| 4  | Job aggregation      | Existing `job_aggregator` ingest (GH, Lever, RSS…)  |
| 5  | Reddit discovery     | `async_reddit.py` + community ingest                |
| 6  | X/Twitter            | Planned — scraper module next phase                 |
| 7  | Typesense search     | Docker ready; index sync next phase                 |
| 8  | Dashboard            | Existing profile UI; wire v2 APIs next                |
| 9–24 | Community, auth, etc. | Schema + Docker profiles; implement per phase     |
