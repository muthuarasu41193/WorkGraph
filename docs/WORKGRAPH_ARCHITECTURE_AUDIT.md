# WorkGraph Architecture Audit

**Date:** 18 August 2026  
**Scope:** Full repository inspection. No application code was modified.  
**Production URL (documented):** `https://work-graph-fawn.vercel.app`  
**Canonical product domain (SEO):** `https://workgraph.ai`

This audit describes **what exists and works today**, then **what is built but unused**, then **risks**, then a **recommended architecture that preserves working product paths**.

---

## Executive snapshot

WorkGraph is a **Next.js App Router SaaS** with a **working production path** on Vercel:

| Layer | Production today |
|-------|------------------|
| Web | Next.js 16 + React 19, deployed on Vercel |
| Auth | **Supabase Auth** (default; SuperTokens is optional and unused when Supabase keys exist) |
| Data | **Supabase Postgres** + RLS (`supabase/migrations/*`) |
| Files | **Supabase Storage** buckets `resumes` (public) and `avatars` (public) |
| Jobs | Python `job_aggregator` writes `public.jobs` via GitHub Actions (every 6 hours) |
| Matching | **Keyword/skill overlap in Next.js** (`lib/job-match.ts`) against `public.jobs` |
| Hidden jobs | **Live fetch** Reddit + Hacker News + GitHub (`/api/hidden-jobs`) |
| AI | **Groq** (`llama-3.3-70b-versatile`) for parse, ATS, Talent Intelligence |
| Resume storage | Raw text on `profiles.resume_raw_text` + public Storage URL |

A **second, self-hosted stack** also exists in-repo (FastAPI, pgvector, Ollama, MinIO, Typesense, BullMQ, SuperTokens). It is **not the current production runtime**. Treat it as a migration target, not as a replacement for working Vercel + Supabase + Groq flows.

**Do not replace** the live jobs catalog, Hidden Jobs Discovery aggregator, Talent Intelligence Groq pipeline, application Kanban, Interview Vault, or employer Hiring Signals. Those are working product surfaces. Harden and connect them; do not rebuild them.

---

## 1. Framework and version

| Component | Version / notes |
|-----------|-----------------|
| Next.js | `^16.2.4` (`output: "standalone"`) |
| React / React DOM | `^19.2.5` |
| TypeScript | `^6.0.3` (strict) |
| Node | `>=20.16.0` (CI uses Node 20) |
| Tailwind CSS | `^4.2.4` |
| ESLint | `eslint-config-next` `^16.2.4` |
| Python aggregator | 3.12 in GitHub Actions; FastAPI `>=0.115` |
| Worker | Node + BullMQ (`@workgraph/worker`) |

Next config keeps `pdf-parse` and `@napi-rs/canvas` as `serverExternalPackages` to avoid Vercel bundling failures.

---

## 2. Current architecture

### 2.1 Two stacks in one repo

```
┌─────────────────────────────────────────────────────────────────┐
│  PRODUCTION PATH (Vercel) — this is what users hit today        │
│                                                                 │
│  Browser ──► Next.js App Router                                 │
│                │  BFF: /api/*                                   │
│                ├─ Supabase Auth (cookies + JWT)                 │
│                ├─ Supabase Postgres (profiles, jobs, vault, …)  │
│                ├─ Supabase Storage (resumes, avatars)           │
│                └─ Groq LLM (parse / ATS / Talent Intelligence)  │
│                                                                 │
│  GitHub Actions ──► job_aggregator ──► public.jobs (REST/SQL)   │
│  Live Hidden Jobs ──► Reddit / HN / GitHub (no persistence)     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SELF-HOSTED PATH (Docker Compose) — built, not production      │
│                                                                 │
│  Next.js ──► FastAPI :8000                                      │
│                ├─ Postgres + pgvector (wg_* schema)             │
│                ├─ Redis + BullMQ worker                         │
│                ├─ MinIO, Typesense, Ollama (optional)           │
│                └─ SuperTokens (only if Supabase keys unset)     │
└─────────────────────────────────────────────────────────────────┘
```

The Next.js app **switches** some routes when `WORKGRAPH_API_URL` / `NEXT_PUBLIC_WORKGRAPH_API_URL` is set (`lib/workgraph-api-routes.ts`):

| Feature | Default (production) | If WorkGraph API URL set |
|---------|----------------------|---------------------------|
| Resume parse | `/api/parse-resume` (Groq) | `/api/v2/parse-resume` (FastAPI spaCy/Ollama, still upserts Supabase) |
| ATS score | `/api/ats-score` (Groq) | `/api/v2/ats-score` (FastAPI, still upserts Supabase) |
| Semantic match | unused | `/api/v2/match-jobs` → FastAPI `/match/jobs` |
| Community / wallet | unused | `/api/v2/community/*`, `/api/v2/wallet` |

Keyword job ranking on the Jobs tab **does not depend** on the FastAPI URL. It always scores `public.jobs` in Next.js.

### 2.2 Frontend architecture

**App Router** under `app/`. Marketing and product share one Next.js app.

**Public / marketing**

- `/` landing (`app/page.tsx`)
- `/waitlist`, `/login`, `/signup`, `/reset-password`
- `/company/[slug]` public verified employer pages
- `/interview-vault` marketplace browse

**Jobseeker product (primary dashboard)**

- `/profile` — **canonical dashboard**. `app/profile/page.tsx` is a null page; UI lives in `app/profile/layout.tsx` with client-side `?view=` routing (`lib/dashboard-routes.ts`).
- `/create-profile`, `/upload`
- `/discovery` → redirects to `/profile?view=job-discovery`
- `/home` — alternate server-rendered home (`app/(dashboard)/home`) that also loads keyword + optional semantic matches
- `/applications` — Kanban (also a dashboard tab)

Dashboard views on `/profile`:

`home` · `jobs` · `resume-intelligence` · `workgraph-direct` · `applications` · `job-discovery` · `hidden-jobs` (dismissed catalog jobs) · `vault` (local prep notes) · `profile` · `job-news` · `settings`

**Employer product**

- `/employer/signup`, `/employer/onboarding`
- `/employer/dashboard`, `/employer/signals`, `/employer/signals/new`, `/employer/signals/[id]`

**UI stack**

- Tailwind 4 + shadcn/Radix primitives (`components/ui/*`)
- Framer Motion, Lucide, Recharts
- TanStack Query (`components/providers/WorkGraphProviders.tsx`)
- Zustand stores: `stores/dashboard-store.ts`, `nav-ui-store.ts`, `profile-nav-store.ts`, `apply-followup-store.ts`
- `@dnd-kit` for application Kanban
- TipTap for Interview Vault rich text
- `react-window` for large job lists

**State split (intentional, keep it)**

| Concern | Store |
|---------|--------|
| Server data | TanStack Query + Next server loaders |
| Nav / UI chrome | Zustand |
| Saved / dismissed jobs | `localStorage` (`lib/saved-jobs-storage.ts`, `lib/hidden-jobs-storage.ts`) |
| Hidden opportunity saves | Supabase `hidden_job_saves` (authenticated) + local cache |

### 2.3 Backend / API architecture

**Primary BFF:** Next.js Route Handlers (`app/api/**/route.ts`). ~43 routes. These are the production API.

**Secondary API:** FastAPI `job_aggregator/app/api/main.py` (`WorkGraph API` v2.0.0). Clean-ish layering:

| Layer | Location |
|-------|----------|
| HTTP | `app/api/routes/*` |
| Services | `app/services/*` |
| Repositories | `app/repositories/*` (SQLAlchemy + optional Supabase REST) |
| Ingest | `app/ingest/*` |
| Matching | `app/matching/*` |
| Domain | `app/domain/schemas.py`, `mappers.py` |

FastAPI is used in production **only as a CLI ingest process** (GitHub Actions), not as the public HTTP API (unless `WORKGRAPH_API_URL` is pointed at a hosted instance).

Rate limiting: FastAPI `slowapi` (`API_RATE_LIMIT`, default 120/minute). Next.js in-memory maps on contact + hidden-jobs only (not multi-instance safe on Vercel).

### 2.4 Database

**Canonical production schema** is **Supabase** (`supabase/migrations/`).  
**Canonical self-hosted schema** is **`migrations/postgres/`** (`wg_users`, `wg_profiles`, `jobs` with pgvector).

These are **not the same identity model**. Production users live in `auth.users`; self-hosted users live in `wg_users`.

#### Production (Supabase)

| Table | Purpose |
|-------|---------|
| `auth.users` | Identity (Supabase Auth) |
| `profiles` | Jobseeker profile, resume text/URL, ATS fields, skills JSONB |
| `jobs` | Aggregated ATS + community listings |
| `job_tracker_entries` | Legacy pipeline counters (applied/interview/offers/saved) |
| `applications` | Kanban tracker (enum status, notes, timeline JSONB, Realtime) |
| `resume_versions` | Content-hashed resume snapshots |
| `resume_intelligence_reports` | Cached Talent Intelligence reports |
| `resume_intelligence_feedback` | Ratings on reports |
| `hidden_job_analytics` | view/click/save events |
| `hidden_job_saves` | Saved hidden opportunities |
| `vault_experiences` / `vault_purchases` / `vault_reviews` | Interview Vault marketplace |
| `employer_profiles` | Employer company identity + verification |
| `hiring_signals` | Employer-posted intent (not scraped ATS) |
| `signal_connections` | Seeker ↔ signal, with `application_snapshot` JSONB |

`jobs` extra columns (community metadata): `kind`, `classification`, `is_community`.

RLS is enabled on user-owned tables. `jobs` is readable by `anon` and `authenticated` (public listings). Storage policies allow public **read** of `resumes` and `avatars`.

#### Self-hosted (`migrations/postgres/`)

Extensions: `uuid-ossp`, `vector`.

| Table | Purpose |
|-------|---------|
| `wg_users` | Identity + role |
| `wg_profiles` | Career graph + `resume_embedding vector(384)` |
| `jobs` | Listings + `embedding vector(384)` + `embedding_json` |
| `wg_ats_scores` | ATS history |
| `wg_saved_jobs` | Saved listings |
| `wg_job_applications` | Applications (duplicate of Supabase `applications`) |
| `wg_subscriptions` | free/premium usage |
| `wg_wallets` / `wg_wallet_transactions` | Contributor wallet |
| `wg_community_posts` / `wg_community_votes` | Community |
| `wg_scraper_runs` | Ingest run log |

**Gap:** Interview Vault, employer Hiring Signals, Talent Intelligence reports, Hidden Jobs analytics, and the Kanban `applications` table **exist only on Supabase**. A self-hosted cutover would lose those product features unless those migrations are ported.

### 2.5 Authentication

**Default and production:** Supabase Auth.

- Middleware (`middleware.ts`) refreshes Supabase cookies on almost all routes.
- If Supabase URL/anon key are present, SuperTokens is **never** used (`lib/auth/config.ts`).
- Session resolution: bearer JWT and/or SSR cookies (`lib/route-auth.ts`, `lib/auth/session-server.ts`).
- Callback: `app/auth/callback/route.ts`.

**Optional:** SuperTokens (`AUTH_PROVIDER=supertokens`) only when Supabase is **not** configured. Routes: `/api/auth/[[...path]]`, Docker profile `auth`. CI builds with SuperTokens flags to catch compile errors; that does not mean production uses SuperTokens.

Employer and jobseeker share the same `auth.users` table; employer rows are `employer_profiles.id = auth.users.id`.

### 2.6 File storage

| Mode | Mechanism |
|------|-----------|
| Production | Supabase Storage `resumes/{userId}/{timestamp}-{filename}`, `avatars/{userId}/…` |
| Self-hosted | MinIO S3 API (`job_aggregator/app/services/storage.py`), buckets `resumes`, `avatars`, `attachments` |

Upload cap: **4 MB** (`lib/upload-limits.ts`) to stay under Vercel body limits.

**Privacy issue:** both resume and avatar buckets are **public**. Anyone with the URL can download a resume. See Security / Privacy.

### 2.7 Resume processing

Three working parsers exist. Production uses **A**.

| Path | Auth | Extract | Structure | Persist |
|------|------|---------|-----------|---------|
| **A. `/api/parse-resume`** | Required | pdf-parse / mammoth | Groq JSON | Supabase Storage + `profiles` upsert |
| **B. `/api/v2/parse-resume`** | Required | FastAPI spaCy + regex + optional Ollama | FastAPI | Still upserts **Supabase** profile |
| **C. `/api/resume/analyze`** | **None** | PDF text | Groq coaching JSON | **None** (ephemeral) |
| FastAPI `POST /resume/parse` | **None** | pypdf / python-docx | spaCy + optional Ollama | Optional MinIO if `store=true` |

Talent Intelligence (`/api/talent-intelligence/analyze`) does **not** re-parse files. It reads `profiles.resume_raw_text` (and related JSON fields) and compares against a pasted/selected job description.

Legacy helper: `utils/resumeParser.ts` (duplicate of pdf/mammoth extract used by the parse route).

### 2.8 Job ingestion

**Working production ingest:** GitHub Actions → `job_aggregator` CLI → `public.jobs`.

| Workflow | Schedule | Command |
|----------|----------|---------|
| `.github/workflows/supabase-jobs-ingest.yml` | `0 */6 * * *` UTC | `python -m app.main ingest --no-embed` |
| `.github/workflows/community-jobs-ingest.yml` | `30 */6 * * *` UTC | `python -m app.main ingest-community` |
| Vercel cron `vercel.json` | `0 6 * * *` (Hobby: once/day) | `GET /api/sync-community-jobs` with `CRON_SECRET` |

`--no-embed` is **intentional** in CI: listings appear on the website without PyTorch. Semantic embeddings are therefore **not populated in production**.

**ATS / board sources** (`job_aggregator/app/ingest/runner.py` + extras):

- Greenhouse, Lever, Ashby (`companies.json` board slugs)
- Adzuna (optional keys)
- USAJobs
- Public RSS / RemoteOK / Jobicy / Arbeitnow / RemoteJobs.org (community/public feeds)

Dedupe: unique `apply_url` + `external_id`. Content hash invalidates stale text. Optional prune of Greenhouse/Lever/Ashby URLs missing from a full fetch (`INGEST_PRUNE_MISSING`).

**Hidden Jobs Discovery is a separate pipeline** (not `public.jobs`): live HTTP to Reddit, HN, GitHub, in-memory/cache TTL, ranking + hiring filter. Do not fold this into ATS ingest; the product explicitly treats it as non-ATS.

### 2.9 Job matching

| Matcher | Where | Used in production UI? |
|---------|-------|------------------------|
| Skill/alias + role-term scoring | `lib/job-match.ts` | **Yes** — Jobs tab, home recommendations, `/api/jobs?rank_profile=1` |
| Sentence-transformers MiniLM + cosine | FastAPI `app/matching/matcher.py` | Only if `WORKGRAPH_API_URL` set **and** `embedding_json` filled |
| Keyword token overlap | FastAPI `keyword_matcher.py` | FastAPI fallback when embeddings fail |
| Hiring-signal fit | `lib/employer/fit-signals.ts` | WorkGraph Direct |

Production GitHub ingest skips embeddings, so FastAPI semantic match against the same Supabase DB would usually fall back to keyword overlap or return empty.

`lib/job-match.ts` is the **working** recommendation engine. Flooring `matchPercent` at 48 when skills exist is a product quirk (can overstate weak matches) but it is live behavior — tune, don’t rip out.

Home dashboard also calls `loadSemanticJobMatches` which **no-ops** unless the FastAPI URL is set.

### 2.10 AI / LLM integrations

| Task | Production | Self-hosted alternative |
|------|------------|-------------------------|
| Resume → structured profile | Groq `llama-3.3-70b-versatile` | spaCy NER + optional Ollama `deepseek-r1:1.5b` |
| ATS score on profile | Groq | Heuristic ATS engine + optional Ollama |
| Talent Intelligence (12-section report) | Groq, 4 chained JSON prompts | **No equivalent** |
| Ephemeral resume analyze | Groq (`/api/resume/analyze`) | — |

Talent Intelligence design (keep): never fabricates experience; four prompt IDs; cache on `(user_id, cache_key)`; deterministic ATS + keyword analyzers **before** LLM.

`GROQ_API_KEY` is required for the production AI path. Module-level Groq client in `lib/groq.ts` constructs with `"missing-groq-api-key"` if unset (fails later on first call).

### 2.11 Embedding / vector infrastructure

| Piece | Status |
|-------|--------|
| Model | `sentence-transformers/all-MiniLM-L6-v2` (384-d) |
| Storage (self-hosted) | `jobs.embedding vector(384)` IVFFlat **and** `embedding_json` TEXT |
| Matcher actually used | **`embedding_json` loaded into NumPy** — pgvector index is unused by the Python matcher |
| Production ingest | `--no-embed` → no vectors |
| Resume embeddings | `wg_profiles.resume_embedding` column exists; not used by Next.js |
| Typesense | Implemented (`typesense_index.py`); production Jobs tab uses PostgREST `ilike` / filters, not Typesense |

Vector search is **scaffolded, not live** for Vercel users.

### 2.12 Environment variables

Documented in `.env.example` and `.env.workgraph.example`.

**Required for production Vercel (from `docs/VERCEL.md` + code):**

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Auth + PostgREST |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server upserts, Storage, admin auth.getUser |
| `GROQ_API_KEY` | Parse / ATS / Talent Intelligence |
| `NEXT_PUBLIC_APP_URL` | Email links, canonical origin |

**Important optional:**

| Variable | Role |
|----------|------|
| `WORKGRAPH_API_URL` | Enables v2 BFF + semantic match |
| `CRON_SECRET` | Vercel community sync + FastAPI ingest |
| `JOB_AGGREGATOR_API_KEY` | FastAPI ingest |
| `EMPLOYER_ADMIN_SECRET` | Manual employer verify approve/reject |
| `RESEND_API_KEY` / `WORKGRAPH_EMAIL_FROM` | Employer email |
| `GITHUB_TOKEN` | Hidden Jobs GitHub rate limits |
| `REDDIT_*` | PRAW ingest + hidden jobs |
| `COMMUNITY_JOBS_ADMIN_EMAILS` | Manual community sync |
| `STRIPE_*` / `RAZORPAY_*` | Declared; payments not wired as a complete checkout |
| SuperTokens `SUPERTOKENS_*` | Only without Supabase |

**CI ingest secrets:** `JOBS_DATABASE_URL` or pooler password set, or `SUPABASE_SERVICE_ROLE_KEY` + project URL (REST ingest).

### 2.13 API routes (Next.js)

#### Auth

| Method | Path | Notes |
|--------|------|--------|
| * | `/api/auth/[[...path]]` | SuperTokens handler or 503 |
| GET | `/api/auth/session` | Session JSON |
| POST | `/api/auth/sync-session` | Cookie sync |
| POST | `/api/auth/wg-sync` | WorkGraph user sync |
| GET | `/api/auth-health` | Health |

#### Profile / resume / ATS / intelligence

| Method | Path | Auth | Backend |
|--------|------|------|---------|
| POST | `/api/profile` | Yes | Supabase or FastAPI `/profile/me` |
| GET/PUT | `/api/v2/profile` | Yes | FastAPI BFF |
| POST | `/api/parse-resume` | Yes | Groq + Storage |
| POST | `/api/v2/parse-resume` | Yes | FastAPI parse + Storage |
| POST | `/api/ats-score` | Partial — **accepts `user_id` in body** | Groq |
| POST | `/api/v2/ats-score` | Same `user_id` pattern | FastAPI |
| POST | `/api/resume/analyze` | **No** | Groq |
| POST | `/api/talent-intelligence/analyze` | Yes | Groq + reports table |
| GET/DELETE | `/api/talent-intelligence/reports` | Yes | |
| GET/DELETE | `/api/talent-intelligence/reports/[id]` | Yes | |
| POST | `/api/v2/match-jobs` | **No** | FastAPI match |

#### Jobs / hidden / community

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/jobs` | Paginated catalog + optional ranking |
| GET | `/api/jobs-health` | |
| GET | `/api/community-jobs` | Community lane of `jobs` |
| GET | `/api/community-jobs-health` | |
| GET/POST | `/api/sync-community-jobs` | Cron bearer or admin email |
| GET | `/api/hidden-jobs` | Live aggregator, IP rate limit |
| POST | `/api/hidden-jobs/analytics` | Rate limited |

#### Applications / employer / vault / misc

| Method | Path |
|--------|------|
| GET/POST | `/api/applications` |
| PATCH/DELETE | `/api/applications/[id]` |
| GET/POST | `/api/hiring-signals` |
| POST | `/api/hiring-signals/connect` |
| GET/PUT | `/api/employer/profile` |
| GET/POST | `/api/employer/signals` |
| * | `/api/employer/signals/[id]` |
| GET | `/api/employer/inbox` |
| POST | `/api/employer/verify` |
| GET | `/api/company/[slug]` |
| * | `/api/vault/experiences`, `[id]`, `purchase`, `reviews`, `dashboard` |
| GET/POST | `/api/v2/community/posts`, `.../vote` |
| GET/POST | `/api/v2/wallet`, `/api/v2/dashboard` |
| POST | `/api/contact` |

#### FastAPI (when hosted)

`GET /health`, `GET /metrics`, `/jobs`, `/search`, `/sources`, `/ingest/community`, `/ingest/typesense/sync`, `/resume/parse`, `/ats/score`, `/match/jobs`, `/profile/me`, `/community/*`, `/wallet/*`.

OpenAPI at `/docs`. Ingest routes require `JOB_AGGREGATOR_API_KEY` or `CRON_SECRET`. **`/resume/parse` and `/match/jobs` are unauthenticated.** FastAPI identity for profile/community is header `X-User-Id` set by the Next BFF **after** session check — if FastAPI is exposed publicly, that header is spoofable (`require_user_id` in `app/api/deps.py`).

### 2.14 Background jobs

`services/worker` (BullMQ + Redis):

| Queue | Worker implemented? | Behavior |
|-------|---------------------|----------|
| `workgraph:scrape` | Yes | Always POSTs `/ingest/community` (even if `source` is not community) |
| `workgraph:ats` | Yes | POST `/ats/score` |
| `workgraph:embed` | Named only | **No worker** |
| `workgraph:notify` | Named only | **No worker** |
| `workgraph:email` | Named only | **No worker** |

Production does **not** run this worker. Ingest is GitHub Actions + optional Vercel cron.

### 2.15 Cron jobs

| Job | Cadence | Effect |
|-----|---------|--------|
| ATS ingest Action | Every 6h | Fill `public.jobs` from boards/APIs |
| Community ingest Action | Every 6h + 30m | Reddit + RSS into `public.jobs` |
| Vercel `/api/sync-community-jobs` | Daily 06:00 UTC | Same community sync via Next + service role |
| BullMQ `setInterval` | If `WORKER_CRON_ENABLED=true` | Enqueue scrape (self-hosted only) |

n8n is in Docker Compose (`profile: automation`) with no checked-in workflows — unused.

### 2.16 Analytics

| Mechanism | Status |
|-----------|--------|
| `lib/analytics.ts` `trackEvent` | CustomEvent `wg:analytics` + `console.debug` in dev. **No PostHog/GA sink.** |
| `hidden_job_analytics` | Persisted view/click/save |
| JsonLd `aggregateRating` 4.9 / 2400 | **Static marketing numbers**, not measured |
| PostHog / Grafana / Prometheus / Uptime Kuma | Compose profiles only |
| Cookie banner | localStorage consent; **does not gate** `trackEvent` |

### 2.17 Error handling

- Next route handlers generally return JSON `{ error }` / `{ ok: false }` with 4xx/5xx.
- FastAPI has a global `Exception` handler → 500 `"Internal server error"` (good: no stack traces to clients).
- Talent Intelligence has typed errors + Groq retry/backoff (`lib/talent-intelligence/errors.ts`).
- ATS/parse routes sometimes return **raw exception messages** to the client (can leak Groq/Supabase internals).
- Semantic match failures on home are swallowed (`console.warn`) and UI falls back to keyword cards — good degradation.

### 2.18 Logging

- Next.js: `console.error` / `console.warn` (Vercel logs). No structured logger, no request IDs.
- Python: `logging.basicConfig` in `app/utils.py` (`configure_logging`).
- FastAPI `/metrics` is a tiny Prometheus text gauge (up + Ollama reachability), not request histograms.
- Worker: `console.log` / `console.error` on queue events.

### 2.19 Security

**What is already in place (keep):**

- RLS on user-owned Supabase tables
- Session required on parse, Talent Intelligence, applications, vault write, employer APIs
- Ingest CLI/API keys for write paths
- Upload size cap
- Hidden-jobs + contact rate limits (best-effort)
- Employer verify approve/reject gated by `EMPLOYER_ADMIN_SECRET`
- Community manual sync gated by admin email list
- SQLAlchemy parameterized queries
- `createServerSupabaseClient` uses `cache: "no-store"` for PostgREST

**Risks — see section 11.**

### 2.20 Dependencies (notable)

**Web:** Next 16, React 19, Supabase SSR/JS, SuperTokens (optional), Groq SDK, TanStack Query, Zustand, pdf-parse, mammoth, dnd-kit, TipTap, Recharts, Framer Motion, Radix/shadcn.

**Python ingest (`requirements-ingest.txt` vs full `requirements.txt`):** CI ingest avoids heavy ML. Full API image includes sentence-transformers, spaCy, boto3, typesense, slowapi.

**Worker:** bullmq, ioredis only.

`tsconfig` **excludes** `**/__tests__/**` and `services/worker` — tests are not typechecked in the main project.

### 2.21 Tests

| Area | Files |
|------|--------|
| Hidden opportunities | 6 Node test files (dedupe, HN, ranking, validation, Reddit RSS, hiring filter) |
| Talent Intelligence | 2 files (report shape, Groq error parsing) |
| Job listing filters | 1 file |
| Python | **None** |
| Playwright/e2e | **None** |
| API route tests | **None** |

Runner: `npm test` → `node --import tsx --test` on those globs.

CI (`verify-build.yml`): Vercel config check + `tsc` + `next build`. **Does not run `npm test`.**

### 2.22 Deployment configuration

| Target | Config |
|--------|--------|
| Production web | Vercel Git integration on `main` (`docs/VERCEL.md`) |
| `vercel.json` | framework nextjs; daily community cron |
| Docker web | `Dockerfile.web` standalone Node 20 alpine |
| Docker API | `job_aggregator/Dockerfile` |
| Compose | `infrastructure/docker-compose.yml` (postgres/pgvector, redis, minio, typesense, api, worker, web; profiles: ai, auth, automation, analytics, monitoring) |
| Marketing static | GitHub Pages mentioned for `index.html` only — app is Vercel |

### 2.23 Performance bottlenecks

1. **Jobs ranking in the BFF:** `/api/jobs` can pull up to **4000** rows (`LIVE_JOBS_CLIENT_FILTER_CAP`) then score in Node. PostgREST pages of 1000. Fine at small corpus; will degrade as `jobs` grows.
2. **Semantic matcher loads all embedded jobs into memory** (`select Job where embedding_json is not null` + NumPy stack). Does not use pgvector ANN. Will not scale.
3. **Talent Intelligence:** 4 sequential Groq calls with **3s delay** between prompts (`PROMPT_CHAIN_DELAY_MS`) + `maxDuration` 120s. Cached by hash — good. Uncached first run is slow and Groq-TPM sensitive.
4. **Resume parse** on Vercel: pdf-parse + Groq, `maxDuration` 60. Cold start + PDF parse is the slow path.
5. **Hidden jobs:** live multi-provider fetch; mitigated by cache TTL (`HIDDEN_JOBS_CACHE_TTL_MS`, default 30 min in comments) and CDN `s-maxage=300`.
6. **Sentence-transformers** first load is heavy; production cron avoids it (`--no-embed`).
7. **In-memory rate limit maps** reset per serverless isolate — weak under load, not a CPU bottleneck.
8. **Middleware** runs Supabase `getUser()` on nearly every request including static-ish pages.

### 2.24 Accessibility

**Present:** `lang="en"`, focus-visible rings (`lib/focus-ring.ts`), many `aria-label`s on dashboard nav, vault editor, cookie dialog, loading `aria-busy`, `motion-reduce` on some hover/press utilities, theme toggle `aria-pressed`.

**Gaps:** no skip-to-content link; no documented axe/lighthouse CI; dashboard is a dense SPA-in-layout (`?view=`) which is harder for screen-reader wayfinding than real routes; charts (Recharts) likely lack text alternatives; cookie banner is a `role="dialog"` without focus trap.

### 2.25 SEO

**Present:** root `metadata` (title, description, canonical `workgraph.ai`, Open Graph, Twitter card), `JsonLd` SoftwareApplication, `alternates.canonical`, `/opengraph-image`.

**Gaps / risks:**

- No `app/sitemap.ts` or `robots.ts`
- Footer Privacy / Terms / Cookie Policy hrefs are `"#"`
- JsonLd `aggregateRating` is **invented** (legal/quality risk)
- Marketing copy claims Discord, Twitter, “50+ private sources”; Hidden Jobs code only uses **Reddit, HN, GitHub**
- Product dashboard routes are auth-gated (correct); `/profile` is not a crawl target
- Dual hostnames (`workgraph.ai` vs `work-graph-fawn.vercel.app`) — `metadataBase` uses `SITE.url`

### 2.26 Privacy / data handling

Stored PII: name, email, phone, location, resume **full text**, resume **file** (public URL), LinkedIn/GitHub, education/experience JSON, application notes, employer connection snapshots (phone excluded by design — good).

Talent Intelligence stores job descriptions + full report JSON per user (RLS owner-only).

Delete: report DELETE exists; no documented account-deletion / GDPR export flow; `deleteAllTalentIntelligenceData` exists in the service module.

Cookie banner is cosmetic vs analytics (analytics is a no-op CustomEvent today).

Resume files are **world-readable** via Storage public URLs.

Groq receives resume + JD text (third-party processor). No DPA/privacy policy page in the app.

---

## 3. Existing user flows

Keep these; they are the product.

1. **Waitlist / landing → signup / login (Supabase) → create profile** (upload resume or manual form).
2. **Resume upload → parse → profile completeness → stored resume.**
3. **Dashboard home:** pipeline counts, keyword-ranked jobs, optional semantic matches if API URL set.
4. **Jobs tab:** live `public.jobs` + hiring-signal cards, search/filters, save/dismiss in localStorage, apply outbound.
5. **Resume Intelligence:** pick/paste JD → cached Groq report → history.
6. **ATS score:** Groq score written onto `profiles`.
7. **Hidden Jobs Discovery:** live Reddit/HN/GitHub, save, analytics events.
8. **Applications Kanban:** CRUD + Realtime.
9. **WorkGraph Direct:** browse live hiring signals → connect with profile snapshot (no resume upload portal).
10. **Employer:** signup → profile → verification request → post signals → inbox.
11. **Interview Vault:** publish/buy/review experiences (INR pricing; payment providers env-only).
12. **Community + wallet:** only when FastAPI URL configured (Phase 3).

---

## 4. Existing AI pipeline

```
Resume file
    → extract text (pdf-parse / mammoth)
    → Groq structured JSON
    → profiles.* + resume_raw_text + public Storage URL

ATS
    → profiles.resume_raw_text
    → Groq rubric JSON
    → profiles.ats_score / ats_feedback

Talent Intelligence (flagship)
    → resume snapshot + JD
    → hash cache
    → parallel-designed but sequential Groq chains:
         match-and-gaps, recruiter, coaching, ats-keywords
    → plus deterministic ATSAnalyzer + KeywordAnalyzer
    → resume_intelligence_reports
```

Self-hosted branch (do not force into Vercel): spaCy + Ollama + MiniLM.

---

## 5. Existing job pipeline

```
GitHub Actions (6h)
    → Greenhouse / Lever / Ashby / Adzuna / USAJobs / public feeds
    → normalize + dedupe by apply_url
    → upsert public.jobs (--no-embed)
    → Next.js /api/jobs + dashboard read via Supabase

Community ingest (6h)
    → Reddit + RSS
    → public.jobs (is_community=true)

Hidden Jobs (on demand)
    → Reddit + HN + GitHub
    → filter hiring posts → rank → cache
    → NOT written to public.jobs
```

WorkGraph Direct hiring signals are **employer-authored**, merged into the jobs UI as `source: workgraph`.

---

## 6. Existing resume pipeline

```
Authenticated upload (≤4MB PDF/DOCX)
    → text extract
    → Groq parse
    → Storage resumes/{uid}/…
    → profiles upsert
    → optional ATS
    → optional Talent Intelligence vs a JD
    → resume_versions content hash (on intelligence analyze)
```

Manual create-profile writes the same `profiles` row without a file.

---

## 7. Current weaknesses

1. **Split brain:** docs and Docker describe a local-AI platform; production is Vercel + Groq + Supabase. Easy to “fix” the wrong stack.
2. **Embeddings never run in the production ingest path**, so “AI matching” in the Jobs tab is keyword scoring (which does work).
3. **Two identity schemas** (`auth.users` vs `wg_users`) and two application tables.
4. **Public resume bucket.**
5. **Unauthenticated / IDOR-prone AI routes** (see Security).
6. **Duplicate product surfaces** (home `/profile` vs `/home`; Job News vs Hidden Jobs vs community `jobs`; vault marketplace vs local “Prep Vault”).
7. **Marketing claims exceed implemented sources.**
8. **Worker/Typesense/pgvector/Ollama/PostHog** are incomplete relative to docs.
9. **Tests don’t run in CI;** no Python tests.
10. **No privacy policy / account deletion UX.**
11. **FastAPI `X-User-Id` trust** if the API is ever public.
12. **Match percent inflation** in `scoreJobRow`.

---

## 8. Technical debt

| Item | Notes |
|------|--------|
| Dual architecture docs | `WORKGRAPH_ARCHITECTURE.md` describes the target stack as if it were live |
| v1 vs v2 API | Parse/ATS duplicated; v2 still writes Supabase |
| `job_tracker_entries` vs `applications` vs `wg_job_applications` | Three pipeline models |
| `utils/resumeParser.ts` vs `lib/resume/pdf-parser.ts` vs Python parser | Three extractors |
| ATS: Groq route, FastAPI engine, Talent Intelligence ATSAnalyzer | Three scores |
| Worker scrape always hits `/ingest/community` | Bug / unfinished |
| Embed/notify/email queues | Dead names |
| `tsconfig` excludes tests | Drift |
| `shadcn` as a runtime dependency | Unusual; typically CLI/dev |
| In-memory rate limits on serverless | Ineffective horizontally |
| CORS FastAPI default `*` | From `CORS_ORIGINS` default |
| Phase 3 community/wallet | Behind API URL; not in Supabase schema |
| Interview Vault payments | Schema + UI; Stripe/Razorpay env unused as a complete flow |
| `/api/ats-score` `user_id` body | Trusts client-supplied id after optional auth |

---

## 9. Duplicate functionality (do not “pick a winner” by deleting the live path)

| Duplicates | Keep (working) | Treat as secondary |
|------------|----------------|--------------------|
| Job ranking | `lib/job-match.ts` on `public.jobs` | FastAPI MiniLM until embeddings are actually produced **into the same DB the web reads** |
| Resume parse | `/api/parse-resume` | FastAPI parse as offline/self-host option |
| ATS | Groq `/api/ats-score` + Talent Intelligence deterministic checks | FastAPI ATS when self-hosting |
| Hidden roles | `/api/hidden-jobs` live aggregator | Community rows in `public.jobs` (Job News / community lane) |
| Dashboard home | `/profile?view=home` | `app/(dashboard)/home` — converge routing later, don’t rebuild |
| Saved jobs | localStorage catalog saves | `wg_saved_jobs` / `hidden_job_saves` (latter already used for discovery) |
| Auth | Supabase | SuperTokens |
| Files | Supabase Storage | MinIO |
| Search | PostgREST filters | Typesense |

---

## 10. Security risks

**High**

1. **`resumes` bucket public read** — resume PDFs are secret URLs at best, not access-controlled.
2. **`POST /api/ats-score` accepts `user_id`** and uses the service role to load that profile’s resume and write ATS fields — **IDOR** if an attacker can guess/obtain a UUID (UUIDs are not secret once leaked).
3. **`POST /api/resume/analyze` has no auth** — Groq cost abuse + resume data sent to Groq from anyone.
4. **`POST /api/v2/match-jobs` has no auth** — resume text to FastAPI; cost/DoS if API URL is set.
5. **FastAPI `/resume/parse` and `/match/jobs` unauthenticated**; **`X-User-Id` trusted** for `/profile`, `/community`, `/wallet` if FastAPI is internet-facing.
6. **Service role key** used widely in Route Handlers — correct for server, catastrophic if a route ever leaked env or if RLS is bypassed without auth checks (ATS `user_id` is the example).

**Medium**

7. FastAPI CORS default `*` when `CORS_ORIGINS` unset.
8. Employer admin secret falls back to `CRON_SECRET` (blast radius if one leaks).
9. In-memory rate limits bypassable across instances.
10. Error responses may include upstream error strings.
11. Vault purchases insertable by authenticated users (RLS) — **no payment verification** in the purchase route pattern; users could unlock content without paying if the API only inserts a purchase row.
12. `hidden_job_analytics` insert allows `user_id IS NULL` — spam/pollution, lower severity.

**Lower**

13. Middleware session refresh on all HTML routes — session fixation standard for Supabase SSR, not a unique bug.
14. SuperTokens unused in production — extra attack surface only if misconfigured.

---

## 11. Privacy risks

1. Full resume text in Postgres (`profiles.resume_raw_text`) plus public file URL.
2. Groq processes resumes and job descriptions (third party); no in-product disclosure beyond cookie banner.
3. Talent Intelligence stores full JDs and LLM reports indefinitely (delete-one-report exists).
4. Application snapshots shared with employers (phone excluded — keep that invariant).
5. No privacy policy / DPA / retention schedule / export-my-data.
6. Analytics custom events could later be wired to PostHog without changing the banner logic.
7. Public `jobs` are vendor-public (OK); community posts may include personal contact info from Reddit — stored in `jobs.description`.

---

## 12. Performance risks

Covered in §2.23. Highest practical risks for a solo founder:

- Unbounded growth of `public.jobs` without expiry (`is_expired` exists on self-hosted `jobs`, not clearly used on Supabase ingest).
- Ranking 4k jobs in the request path.
- Groq 4-call chain + 3s delays hitting Vercel duration / TPM.
- Accidentally turning on embeddings in GitHub Actions (timeout, RAM, cost).

---

## 13. Recommended architecture

**Principle:** one production runtime, one identity store, optional self-host later. Do not migrate off Supabase/Groq until a feature is proven on the current path.

```
Browser
  → Next.js (Vercel) — UI + BFF
      → Supabase Auth + RLS Postgres + private Storage
      → Groq only for: parse, Talent Intelligence, optional ATS
      → public.jobs filled by existing GitHub Actions ingest (keep --no-embed until you need vectors)
      → Hidden Jobs live aggregator (keep)

Optional later (same product, different host):
  FastAPI + Ollama + MiniLM + MinIO
    — behind the Next BFF only, never public
    — shared Postgres (migrate wg_* into the Supabase/public schema or stop using wg_*)
```

**Canonical systems (keep):**

| Domain | System of record |
|--------|------------------|
| Users | `auth.users` + `profiles` |
| ATS jobs | `public.jobs` + existing ingest |
| Hidden opportunities | live `/api/hidden-jobs` + `hidden_job_saves` |
| Recommendations | `lib/job-match.ts` until embeddings are written **and** queried efficiently |
| Resume intelligence | Groq Talent Intelligence + `resume_intelligence_reports` |
| Applications | `applications` Kanban |
| Employer | `hiring_signals` / `signal_connections` |
| Interview marketplace | `vault_*` |

**Defer / do not productize until needed:** SuperTokens, Typesense, BullMQ worker, n8n, PostHog compose, pgvector matcher, community/wallet FastAPI.

**When you add semantic match:** embed asynchronously (separate Action or worker), store vectors, query with **pgvector** (or Typesense) — do not load all `embedding_json` into RAM. Keep keyword rank as fallback (already exists).

**Auth for FastAPI:** if you ever expose it, require a signed JWT or HMAC from the BFF; drop raw `X-User-Id` as sufficient auth.

---

## 14. Recommended implementation order

Order is **stabilize production**, then **security/privacy**, then **quality**, then **optional self-host**. Do not start with a stack rewrite.

### P0 — Security and privacy (no feature replacement)

1. Make `resumes` bucket **private**; serve via signed URLs.
2. Ignore client `user_id` on ATS routes; always use session user.
3. Require auth (or a secret) on `/api/resume/analyze` and `/api/v2/match-jobs`.
4. Verify Interview Vault purchase path cannot unlock without payment.
5. If FastAPI is deployed, bind it to private network + ingest key; do not trust `X-User-Id` alone.
6. Stop returning raw upstream errors to clients.

### P1 — Honesty and product clarity

7. Align landing claims with real sources (Reddit, HN, GitHub + ATS boards) or add sources before advertising them.
8. Replace fake JsonLd ratings or remove `aggregateRating`.
9. Add Privacy / Terms pages; wire footer links.
10. Add `sitemap.ts` / `robots.ts` for marketing routes only.

### P2 — Reliability of what already works

11. Run `npm test` in CI.
12. Add expiry/prune for stale `public.jobs` (self-hosted already has `is_expired` / last_seen).
13. Cap ranking corpus (SQL filter before Node scoring) as the table grows.
14. Account deletion + Talent Intelligence bulk delete in Settings (service function already exists).
15. Converge `/home` into `/profile?view=home` when you next touch routing — redirect only, no new dashboard.

### P3 — Matching upgrade (additive)

16. Optional: scheduled embed job **into the same Supabase `jobs` table the web reads**.
17. Use pgvector similarity **as a rerank** of the existing keyword shortlist — do not replace `lib/job-match.ts` until A/B shows lift.
18. Fix match-percent flooring so weak overlap is not ~48%+.

### P4 — Self-host / local AI (only if you leave Vercel or Groq)

19. Port missing Supabase tables (vault, employer, intelligence, applications) into `migrations/postgres`.
20. Point Next **only** at one Postgres.
21. Swap Groq → Ollama behind the same service interfaces (`llm-runner.ts` is the seam).
22. Then MinIO, Typesense, BullMQ — one at a time.

### Explicitly out of order

- Replacing Groq Talent Intelligence with Ollama while still on Vercel serverless.
- Replacing Hidden Jobs live fetch with “just ingest Reddit into `jobs`”.
- Replacing Supabase Auth with SuperTokens while Supabase is the database.
- Building Novu / WhatsApp / Socket.IO before P0.

---

## 15. Inspection checklist (26 areas)

| # | Area | Production reality |
|---|------|-------------------|
| 1 | Framework | Next 16 / React 19 / TS 6 / Node 20 |
| 2 | Frontend | App Router, `/profile` dashboard, Tailwind 4, Query + Zustand |
| 3 | Backend | Next BFF + Python ingest; FastAPI optional |
| 4 | Database | Supabase Postgres + RLS; second wg_* schema for Docker |
| 5 | Auth | Supabase; SuperTokens dormant |
| 6 | Files | Public Supabase Storage; MinIO unused in prod |
| 7 | Resume | Groq parse + raw text column |
| 8 | Job ingest | GH Actions 6h, `--no-embed` |
| 9 | Matching | Keyword `lib/job-match.ts` |
| 10 | LLM | Groq 3.3 70B; Ollama optional |
| 11 | Vectors | Code exists; not filled in prod; matcher uses JSON not pgvector |
| 12 | Env | Supabase + Groq required; long optional list |
| 13 | API routes | ~43 Next routes + FastAPI module |
| 14 | Background jobs | BullMQ incomplete; unused in prod |
| 15 | Cron | GH Actions + daily Vercel community sync |
| 16 | Analytics | Stub + hidden-job events; no product analytics vendor |
| 17 | Errors | JSON handlers; some leaky messages |
| 18 | Logging | console / Python logging; tiny /metrics |
| 19 | Security | RLS good; public resumes + IDOR + unauth AI routes |
| 20 | Dependencies | See package.json / requirements.txt |
| 21 | Tests | 9 TS files; not in CI; no Python/e2e |
| 22 | Deploy | Vercel + Docker files |
| 23 | Performance | Large job fetch, Groq chains, unused heavy ML |
| 24 | A11y | Partial labels/focus; no CI |
| 25 | SEO | Metadata + JsonLd; no sitemap; inflated claims |
| 26 | Privacy | Resume PII; public files; no policy pages |

---

## Related docs (existing, not replaced)

- `docs/WORKGRAPH_ARCHITECTURE.md` — **target** self-hosted design (aspirational vs this audit)
- `docs/VERCEL.md` — how production actually deploys
- `docs/PHASE3.md` — community/wallet behind WorkGraph API
- `lib/talent-intelligence/README.md` — Resume Intelligence
- `job_aggregator/README.md` — ingest CLI
