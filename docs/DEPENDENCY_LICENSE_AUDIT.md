# WorkGraph dependency and open-source license audit

**Date:** 18 August 2026  
**Scope:** Direct dependencies declared in `package.json`, `services/worker/package.json`, `job_aggregator/requirements*.txt`, spaCy/Hugging Face models pulled at install/runtime, and Docker images in `infrastructure/docker-compose.yml`.  
**Not in scope:** A full transitive (nested) license scan, npm/PyPI malware scoring of every sub-dependency, or hosted-vendor Terms of Service as if they were OSI licenses.

**This document is not legal advice.** License names were taken from npm lockfile `license` fields, PyPI metadata, and upstream project pages as of the audit date. A lawyer should confirm anything in **NEEDS_LEGAL_REVIEW** before you ship a paid SaaS or an on-prem distribution.

**Licenses do not guarantee GDPR compliance.** Permissive OSS (MIT, Apache-2.0, BSD, ISC) says nothing about lawfulness of processing, DPAs, subprocessors, data residency, or retention. Hosted APIs (Groq, Supabase, Resend, Adzuna, Reddit, GitHub) are contracts and processors, not open-source licenses.

**No packages were uninstalled. `package.json` and application code were not modified.**

---

## How to read this audit

| Column | Meaning |
|--------|---------|
| Version | Resolved lockfile version for npm; declared constraint for Python (Python deps are largely **unpinned**) |
| SaaS OK? | Whether the **license text generally** allows running the software as part of a commercial SaaS. Not a warranty. |
| Copyleft? | Whether the license can require you to share source of the dependency (LGPL/GPL) or, for AGPL/SSPL, raise network/service obligations |
| Used? | Direct import or config reference in this repo |
| Removable? | Safe to drop later without replacing a live production feature |

**Production path today** (Vercel): Next.js + Supabase clients + Groq SDK + pdf-parse/mammoth. Python ingest runs in GitHub Actions. FastAPI, MinIO, Typesense, Redis, Ollama, n8n, Grafana, PostHog, SuperTokens **are not the live Vercel runtime**.

---

## Category summary

| Category | Count (approx.) | Intent |
|----------|-----------------|--------|
| **SAFE_TO_REVIEW** | Most npm + most Python libraries | Permissive licenses; keep using |
| **NEEDS_LEGAL_REVIEW** | Copyleft / source-available / dual-license | Counsel before enabling in a paid product or distributing binaries |
| **REMOVE_OR_REPLACE** | Unused and/or high-risk unused infra | Do not enable in customer-facing SaaS; uninstall or swap later |

---

## SAFE_TO_REVIEW

Permissive OSI licenses (MIT, Apache-2.0, BSD, ISC). Commercial SaaS use of **unmodified** libraries is generally permitted. You still owe attribution where the license requires it (Apache-2.0 NOTICE, keep copyright headers).

### Web app — `package.json` dependencies

| Package | Version (lock / declared) | Purpose | License | SaaS OK? | Copyleft? | Security / maintenance | Used? | Removable? |
|---------|---------------------------|---------|---------|----------|-----------|------------------------|-------|------------|
| `next` | 16.2.4 / `^16.2.4` | App framework | MIT | Generally yes | No | Actively maintained (Vercel) | Yes | No |
| `react` | 19.2.5 / `^19.2.5` | UI | MIT | Generally yes | No | Actively maintained | Yes | No |
| `react-dom` | 19.2.5 / `^19.2.5` | DOM renderer | MIT | Generally yes | No | Actively maintained | Yes | No |
| `@supabase/supabase-js` | 2.105.1 / `^2.105.1` | Supabase client | MIT | Generally yes | No | Actively maintained | Yes | No (prod auth/data) |
| `@supabase/ssr` | 0.10.2 / `^0.10.2` | Cookie/SSR auth | MIT | Generally yes | No | Actively maintained | Yes | No |
| `groq-sdk` | 1.1.2 / `^1.1.2` | Groq LLM client | Apache-2.0 | Generally yes | No | Actively maintained. **API usage is a paid/hosted ToS, not this license.** | Yes | No (prod AI) |
| `lucide-react` | 0.554.0 / `^0.554.0` | Icons | ISC | Generally yes | No | Actively maintained | Yes | No |
| `framer-motion` | 12.42.2 / `^12.42.2` | Motion | MIT | Generally yes | No | Actively maintained | Yes | No |
| `@tanstack/react-query` | 5.100.14 / `^5.90.12` | Server state | MIT | Generally yes | No | Actively maintained | Yes | No |
| `zustand` | 5.0.14 / `^5.0.9` | Client UI state | MIT | Generally yes | No | Actively maintained | Yes | No |
| `clsx` | 2.1.1 / `^2.1.1` | className helper | MIT | Generally yes | No | Actively maintained | Yes | No |
| `tailwind-merge` | 3.6.0 / `^3.6.0` | Tailwind class merge | MIT | Generally yes | No | Actively maintained | Yes | No |
| `class-variance-authority` | 0.7.1 / `^0.7.1` | Variant classes | Apache-2.0 | Generally yes | No | Actively maintained | Yes | No |
| `date-fns` | 4.4.0 / `^4.4.0` | Dates | MIT | Generally yes | No | Actively maintained | Yes | Optional later if you inline formats |
| `radix-ui` | 1.4.3 / `^1.4.3` | Headless primitives (dialog, tabs, etc.) | MIT | Generally yes | No | Actively maintained | Yes (`from "radix-ui"`) | No |
| `@dnd-kit/core` | 6.3.1 / `^6.3.1` | Kanban drag-and-drop | MIT | Generally yes | No | Actively maintained | Yes | No (Applications board) |
| `@tiptap/react` | 3.24.0 / `^3.24.0` | Rich text | MIT | Generally yes | No | Actively maintained | Yes (Interview Vault) | No |
| `@tiptap/starter-kit` | 3.24.0 / `^3.24.0` | TipTap starter | MIT | Generally yes | No | Actively maintained | Yes | No |
| `react-dropzone` | 15.0.0 / `^15.0.0` | File drop UI | MIT | Generally yes | No | Actively maintained | Yes | No |
| `react-hook-form` | 7.81.0 / `^7.81.0` | Contact form | MIT | Generally yes | No | Actively maintained | Yes | No |
| `recharts` | 3.8.1 / `^3.8.1` | Charts | MIT | Generally yes | No | Actively maintained | Yes | No |
| `mammoth` | 1.12.0 / `^1.12.0` | DOCX → text | BSD-2-Clause | Generally yes | No | Actively maintained | Yes (`/api/parse-resume`, `utils/resumeParser.ts`) | No |
| `pdf-parse` | **1.1.4** / `^1.1.1` | PDF → text | MIT | Generally yes | No | **1.x line is old** (2.x exists). Well-known footgun: some 1.x entrypoints parse a bundled test PDF. No Snyk CVE on 1.1.1 as of this audit. Prefer upgrading to 2.x **later**, do not rip out the working parse path now. | Yes | No (replace version later, not the feature) |
| `shadcn` | 4.8.3 / `^4.8.3` | shadcn v4 CSS (`@import "shadcn/tailwind.css"`) | MIT | Generally yes | No | Actively maintained. Unusual as a **runtime** dep (CLI + CSS). Supply-chain surface is larger than copied CSS. License is fine. | Yes (CSS) | Not without copying CSS out |
| `tw-animate-css` | 1.4.0 / `^1.4.0` | Animation utilities | MIT | Generally yes | No | Actively maintained | Yes (`globals.css`) | Optional |
| `supertokens-auth-react` | 0.50.0 / `^0.50.0` | Optional SuperTokens UI | Apache-2.0 | Generally yes | No | Actively maintained | Yes, **only if** SuperTokens enabled (dormant in prod) | Yes, if you drop SuperTokens |
| `supertokens-node` | 24.0.2 / `^24.0.0` | Optional SuperTokens backend | Apache-2.0 | Generally yes | No | Actively maintained | Yes, dormant in prod | Yes, if you drop SuperTokens |

### Web app — `package.json` devDependencies

| Package | Version (lock / declared) | Purpose | License | SaaS OK? | Copyleft? | Security / maintenance | Used? | Removable? |
|---------|---------------------------|---------|---------|----------|-----------|------------------------|-------|------------|
| `typescript` | 6.0.3 / `^6.0.3` | Typecheck | Apache-2.0 | Yes (dev) | No | Actively maintained | Yes (CI) | No |
| `eslint` | 9.39.4 / `^9.39.4` | Lint | MIT | Yes (dev) | No | Actively maintained | Yes | No |
| `eslint-config-next` | 16.2.4 / `^16.2.4` | Next ESLint | MIT | Yes (dev) | No | Actively maintained | Yes | No |
| `tailwindcss` | 4.2.4 / `^4.2.4` | CSS | MIT | Generally yes | No | Actively maintained | Yes | No |
| `@tailwindcss/postcss` | 4.2.4 / `^4.2.4` | PostCSS plugin | MIT | Generally yes | No | Actively maintained | Yes | No |
| `postcss` | 8.5.13 / `^8.5.12` | CSS pipeline | MIT | Generally yes | No | Actively maintained | Yes | No |
| `autoprefixer` | 10.5.0 / `^10.4.21` | Vendor prefixes | MIT | Generally yes | No | Actively maintained | Yes (`postcss.config.cjs`) | Maybe later (Tailwind 4 often prefixes itself) |
| `tsx` | 4.22.4 / `^4.22.4` | Run TS tests | MIT | Yes (dev) | No | Actively maintained | Yes (`npm test`) | No |
| `sharp` | 0.35.3 / `^0.35.3` | Image pipeline (Next often uses at build) | Apache-2.0 | Generally yes | No | Actively maintained | Indirect (Next image/OG). No app `import "sharp"`. | Keep for Next production images |
| `@types/node` | 25.6.0 | Types | MIT | Yes (dev) | No | Actively maintained | Yes | No |
| `@types/react` | 19.2.14 | Types | MIT | Yes (dev) | No | Actively maintained | Yes | No |
| `@types/react-dom` | 19.2.3 | Types | MIT | Yes (dev) | No | Actively maintained | Yes | No |
| `@types/pdf-parse` | 1.1.5 | Types for 1.x | MIT | Yes (dev) | No | Follows pdf-parse 1.x | Yes | With pdf-parse 1.x |

### Worker — `services/worker/package.json`

| Package | Declared | Purpose | License | SaaS OK? | Copyleft? | Security / maintenance | Used? | Removable? |
|---------|----------|---------|---------|----------|-----------|------------------------|-------|------------|
| `bullmq` | `^5.34.0` | Job queues | MIT | Generally yes | No | Actively maintained (Taskforce). BullMQ **Pro** is a separate commercial product and is **not** this package. | Yes, inside worker only. Worker **not** used on Vercel. | Yes, with the worker |
| `ioredis` | `^5.4.2` | Redis client | MIT | Generally yes | No | Actively maintained | Yes, worker only | Yes, with the worker |
| `tsx` / `typescript` / `@types/node` | worker devDeps | Build/dev | MIT / Apache-2.0 | Yes (dev) | No | Active | Yes for worker | With the worker |

### Python libraries — `job_aggregator/requirements.txt` (+ ingest/ml splits)

Python versions are **not pinned**. The “latest PyPI” column is the version **license metadata was read from** on 18 Aug 2026, not necessarily what CI installed.

| Package | Declared | Latest (license source) | Purpose | License | SaaS OK? | Copyleft? | Security / maintenance | Used? | Removable? |
|---------|----------|-------------------------|---------|---------|----------|-----------|------------------------|-------|------------|
| `fastapi` | `>=0.115.0` | 0.141.1 | HTTP API | MIT | Generally yes | No | Actively maintained | Yes (self-hosted API) | No if you keep FastAPI |
| `uvicorn` | `>=0.32.0` | 0.52.3 | ASGI server | BSD-3-Clause | Generally yes | No | Actively maintained | Yes | No |
| `pydantic` | `>=2.0.0` | 2.13.4 | Validation | MIT | Generally yes | No | Actively maintained | Yes | No |
| `httpx` | `>=0.27.0` | 0.28.1 | HTTP client | BSD-3-Clause | Generally yes | No | Actively maintained | Yes | No |
| `requests` | unpinned | 2.34.2 | HTTP (ingest REST) | Apache-2.0 | Generally yes | No | Actively maintained | Yes | No |
| `SQLAlchemy` | unpinned | 2.0.52 | ORM | MIT | Generally yes | No | Actively maintained | Yes | No |
| `python-dotenv` | unpinned | 1.2.3 | `.env` | BSD-3-Clause | Generally yes | No | Actively maintained | Yes | No |
| `python-multipart` | `>=0.0.9` | 0.0.32 | Upload parsing | Apache-2.0 | Generally yes | No | Actively maintained | Yes (`UploadFile`) | No |
| `slowapi` | `>=0.1.9` | 0.1.10 | Rate limit | MIT | Generally yes | No | Lightly maintained; small surface | Yes | Optional |
| `pypdf` | `>=4.0.0` | 6.16.1 | PDF text | BSD-3-Clause | Generally yes | No | Actively maintained | Yes (FastAPI resume parser) | No for FastAPI path |
| `python-docx` | `>=1.1.0` | 1.2.0 | DOCX text | MIT | Generally yes | No | Actively maintained | Yes | No for FastAPI path |
| `spacy` | `>=3.7.0` | 3.8.15 | NER | MIT | Generally yes | No | Actively maintained | Yes (resume parser) | No for FastAPI path |
| `langdetect` | `>=1.0.9` | 1.0.9 | Language detect | MIT | Generally yes | No | **Stale** (1.0.9; last meaningful release years ago) | Yes | Replace later (`lingua`, etc.) |
| `numpy` | unpinned | 2.5.2 | Vectors | BSD-3-Clause (multi) | Generally yes | No | Actively maintained | Yes (embedder/matcher) | No if embeddings stay |
| `scikit-learn` | unpinned | 1.9.0 | `cosine_similarity` | BSD-3-Clause | Generally yes | No | Actively maintained | Yes | Could replace with numpy later |
| `sentence-transformers` | unpinned | 5.7.0 | MiniLM embeddings | Apache-2.0 | Generally yes | No | Actively maintained. Pulls **PyTorch** (BSD) transitively — heavy. | Yes, only when embedding (prod ingest uses `--no-embed`) | Keep as optional ML extra |
| `boto3` | `>=1.34.0` | 1.43.73 | S3/MinIO client | Apache-2.0 | Generally yes | No | Actively maintained | Yes (`storage.py`) | If MinIO is dropped |
| `typesense` (Python **client**) | `>=0.21.0` | 2.0.0 | Search client | **Apache-2.0** | Generally yes | No | Actively maintained | Yes, only if Typesense server is on | Yes with Typesense server |
| `redis` (Python) | `>=5.0.0` | 8.1.0 | Redis client | MIT | Generally yes | No | Actively maintained | **No import found** | Yes (unused) — see REMOVE |

### Models (not npm/PyPI packages, but shipped with the stack)

| Artifact | Source | Purpose | License | SaaS OK? | Copyleft? | Used? | Removable? |
|----------|--------|---------|---------|----------|-----------|-------|------------|
| `en_core_web_sm` | `python -m spacy download` in API Docker | Resume NER | MIT (Explosion) | Generally yes | No | FastAPI resume parse | With spaCy path |
| `sentence-transformers/all-MiniLM-L6-v2` | Hugging Face, downloaded at embed time | 384-d embeddings | Apache-2.0 | Generally yes | No | Only if embed job runs | With embeddings |
| Ollama `deepseek-r1:1.5b` | Ollama library | Local LLM | Model cards vary (DeepSeek R1 family often MIT; confirm the exact tag you pull) | Generally yes if the card is MIT/Apache | No (if MIT/Apache) | Optional compose profile | Yes if you stay on Groq |

### Docker images with permissive licenses

| Image | Purpose | License (upstream) | SaaS OK? | Copyleft? | Used in prod? | Removable? |
|-------|---------|--------------------|----------|-----------|---------------|------------|
| `pgvector/pgvector:pg16` | Postgres + vectors | PostgreSQL License + pgvector (PostgreSQL-style / Apache-adjacent) | Generally yes | No | No (Supabase hosts Postgres) | Optional self-host |
| `python:3.12-slim-bookworm` | API image base | PSF | Generally yes | No | CI/API image | N/A |
| `node:20-alpine` | Web image | MIT (Node) / Alpine mix | Generally yes | No | Docker web | N/A |
| `ollama/ollama` | Local LLM runtime | MIT | Generally yes | No | No | Optional |
| `prom/prometheus` | Metrics | Apache-2.0 | Generally yes | No | No | Optional |
| `louislam/uptime-kuma:1` | Uptime probes | MIT | Generally yes | No | No | Optional |
| SuperTokens `supertokens-postgresql` | Auth core | Apache-2.0 | Generally yes | No | No | Optional |

---

## NEEDS_LEGAL_REVIEW

These are **not automatically forbidden**. They are the items a commercial SaaS should not enable, pin, or distribute without counsel. This audit does **not** claim they make WorkGraph illegal.

### 1. `psycopg2-binary` — LGPL-3.0 (with OpenSSL linking exception)

| Field | Detail |
|-------|--------|
| Package | `psycopg2-binary` |
| Version | Unpinned; PyPI 2.9.12 when audited |
| Purpose | PostgreSQL driver for ingest/API |
| License | **LGPL-3.0-or-later** plus a documented OpenSSL linking exception |
| SaaS generally permitted? | **Often yes** for unmodified use as a dynamically linked driver in a service you operate. LGPL is about the library, not your Next.js app. |
| Copyleft? | **Yes, weak copyleft** on *modifications to psycopg2 itself*. Distributing a modified psycopg2 requires LGPL compliance (source of the library). It does **not** typically force you to open-source WorkGraph. |
| Security / maintenance | Actively maintained. Prefer `psycopg` v3 long-term. |
| Used? | Yes (SQLAlchemy ingest / FastAPI) |
| Removable? | Not without another driver (`psycopg` 3, asyncpg). Do not remove now. |

**Counsel question:** confirm LGPL obligations if you ever **ship** a desktop/on-prem binary that statically links psycopg2.

### 2. Typesense **server** — GPL-3.0

| Field | Detail |
|-------|--------|
| Component | Docker `typesense/typesense:27.1` |
| Purpose | Typo-tolerant job search |
| License | **GPL-3.0** (server). Official **clients are Apache-2.0** (confirmed for `typesense` on PyPI). |
| SaaS generally permitted? | Typesense’s own FAQ: GPL on the **daemon** is aimed at people who **distribute modified server binaries**, not at Apache-licensed clients. GPL is **not** AGPL: network use of an unmodified separate process usually does **not** require you to GPL WorkGraph. |
| Copyleft? | **Yes, for the server software** if you convey modified Typesense. |
| Used? | Code exists; **production Jobs tab uses Supabase/PostgREST, not Typesense.** |
| Removable? | Yes from compose until you need it. |

**Counsel question:** shipping a self-hosted WorkGraph appliance that includes Typesense binaries.

### 3. MinIO — AGPL-3.0 (and community repo status)

| Field | Detail |
|-------|--------|
| Image | `minio/minio:latest`, `minio/mc:latest` |
| Client | `boto3` talking S3 API (Apache-2.0 — the **client** is fine) |
| Purpose | Self-hosted resume object storage |
| License | **GNU AGPL v3** |
| SaaS generally permitted? | AGPL **allows** commercial use but can require offering corresponding source of **MinIO (and modifications)** to network users. MinIO’s `COMPLIANCE.md` tells you to get counsel; they also sell a commercial license. Community GitHub README (2026) states the **public repo is no longer maintained**, with AIStor as the commercial path. |
| Copyleft? | **Yes — network copyleft** on MinIO itself. Whether your proprietary app is a combined work is the classic AGPL debate; do not DIY that call. |
| Used in production? | **No.** Vercel uses **Supabase Storage**. |
| Removable? | **Yes — prefer never enabling MinIO for paid SaaS.** See REMOVE_OR_REPLACE. |

### 4. Grafana OSS — AGPL-3.0

| Field | Detail |
|-------|--------|
| Image | `grafana/grafana:latest` (unpinned) |
| Purpose | Dashboards (`--profile monitoring`) |
| License | AGPL-3.0 since Grafana 8 |
| SaaS generally permitted? | Unmodified Grafana for **internal ops** is commonly treated as acceptable; exposing modified Grafana to customers triggers AGPL source obligations. Grafana Labs also offers a proprietary OSS-feature binary. |
| Copyleft? | **Yes (AGPL)** |
| Used? | Compose only; not production |
| Removable? | Yes if you do not need it |

### 5. Redis Docker tag `redis:7-alpine` — RSALv2 / SSPLv1 (not BSD)

| Field | Detail |
|-------|--------|
| Image | `redis:7-alpine` **unpinned** |
| Purpose | BullMQ / cache (self-host) |
| License | Docker Hub currently maps `7-alpine` → Redis **7.4.x**, dual **RSALv2 or SSPLv1**. Redis **≤7.2** remains BSD-3-Clause. Redis **8+** adds AGPLv3 as a third option. **SSPL and RSAL are not OSI “open source.”** |
| SaaS generally permitted? | RSALv2 is meant to allow using Redis in your application while blocking offering **Redis-as-a-service**. Using Redis as WorkGraph’s private queue is the intended allowed case — **still not a lawyer sign-off.** SSPL is a “service copyleft” if you offer Redis to third parties as a service. |
| Copyleft? | SSPL: **yes, if you offer Redis as a service**. RSAL: source-available with commercialization limits. |
| Used in production? | **No** (no Redis on Vercel) |
| Removable / replace? | Pin `redis:7.2.15-alpine` (BSD-3) **or** switch to **Valkey** (BSD) before enabling compose Redis. |

### 6. n8n — Sustainable Use License (source-available, not OSI)

| Field | Detail |
|-------|--------|
| Image | `n8nio/n8n:latest` |
| Purpose | Automation (`--profile automation`). **No workflows in repo.** |
| License | **n8n Sustainable Use License** (fair-code). Files marked `.ee.` are a separate Enterprise license. |
| SaaS generally permitted? | **Internal** company automation is generally what SUL allows. **Embedding n8n as the backend of a product you sell**, white-labeling, or giving customers n8n can require a **paid Embed/commercial license**. |
| Copyleft? | Not GPL; **contractual / source-available restrictions** instead. |
| Used? | Unused |
| Removable? | Yes. Ingest already uses GitHub Actions. |

### 7. PostHog self-hosted image — MIT core + `ee/` proprietary

| Field | Detail |
|-------|--------|
| Image | `posthog/posthog:latest` (compose is incomplete vs real PostHog stack) |
| License | MIT for OSS tree; **`ee/` directory is not MIT** |
| SaaS generally permitted? | OSS MIT core: generally yes. Do not assume the Docker `latest` tag is MIT-only. |
| Copyleft? | No on MIT files |
| Used? | No (and `lib/analytics.ts` is a no-op CustomEvent) |
| Removable? | Yes |

### 8. Hosted processors (not OSS — still review for a commercial SaaS)

These are **not** copyleft, but they are **not** “the MIT license covers Groq/Supabase.”

| Service | How used | Review for |
|---------|----------|------------|
| Groq | Resume parse, ATS, Talent Intelligence | DPA, subprocessors, training-on-inputs policy, data region |
| Supabase (hosted) | Auth, Postgres, Storage | DPA, EU/US region, Storage public buckets (product issue, not license) |
| Resend | Employer email | DPA |
| Adzuna / Reddit / GitHub | Job ingest | API ToS, attribution, scraping vs official API |
| Vercel | Hosting | DPA, subprocessors |

A DPA is independent of whether `groq-sdk` is Apache-2.0.

---

## REMOVE_OR_REPLACE

Do **not** uninstall in this change-set. These are recommendations for a later, explicit cleanup PR.

### Unused npm direct dependencies (MIT/Apache — license-safe, still dead weight)

| Package | Version | License | Why remove | Replace with |
|---------|---------|---------|------------|--------------|
| `react-window` | 2.2.7 | MIT | **No imports.** Declared for large job lists; UI does not use it. | Nothing, or add later if lists get huge |
| `@dnd-kit/sortable` | 10.0.0 | MIT | Kanban uses `@dnd-kit/core` only. **No `SortableContext`.** | Keep `@dnd-kit/core` |
| `@radix-ui/react-slot` | 1.2.4 | MIT | UI imports `Slot` from `"radix-ui"`, not this package | `radix-ui` (already present) |
| `@radix-ui/react-tabs` | 1.1.13 | MIT | Tabs use `"radix-ui"` | `radix-ui` |
| `supertokens-web-js` | 0.16.0 | Apache-2.0 | Direct dep **never imported**. `supertokens-auth-react` already depends on it. | Let it be transitive only |

### Unused / high-risk self-host infra (do not turn on for paid SaaS)

| Component | License issue | Why remove or replace | Prefer |
|-----------|---------------|----------------------|--------|
| **MinIO** (`minio/minio:latest`) | AGPL-3.0; community repo unmaintained; vendor commercial pressure | Unused; production already has Supabase Storage | Stay on **Supabase Storage** (private bucket). If self-hosting later: Garage, SeaweedFS, or cloud S3 — with counsel |
| **n8n** | Sustainable Use License | Unused; ingest already scheduled in GitHub Actions | Keep GH Actions / Vercel cron |
| **Typesense server** | GPL-3.0 | Unused in production search | Postgres `ilike` (current) or later pgvector/OpenSearch with counsel |
| **Python `redis`** | MIT (license OK) | **Never imported**; Node worker uses `ioredis` | Delete from `requirements-ml.txt` |
| **PostHog compose service** | MIT + EE mix; incomplete compose | Unused; analytics is a stub | PostHog **cloud** snippet later, or nothing |
| **Grafana `latest`** | AGPL-3.0 | Unused; unpinned tag | Skip, or official proprietary OSS binary for internal-only, after counsel |
| **Redis `7-alpine` unpinned** | RSALv2/SSPL | Unused today; dangerous default if you `compose up` later | `redis:7.2.15-alpine` **or Valkey** |

### Optional product-path replacements (not “delete now”)

| Current | Why consider later | Do not do yet |
|---------|-------------------|---------------|
| `pdf-parse` 1.1.x | Old major; 2.x rewrite exists | Do not break `/api/parse-resume` without a test plan |
| `langdetect` 1.0.9 | Stale | Only if FastAPI language detection matters |
| SuperTokens trio | Dormant vs Supabase | Keep until you formally abandon self-host auth |
| `shadcn` as runtime | CLI in `node_modules` | Copy CSS if you want a thinner prod graph |

---

## Copyleft / source-available map (quick)

| License family | In this repo | Typical SaaS note (not advice) |
|----------------|--------------|--------------------------------|
| MIT / ISC / BSD / Apache-2.0 | Almost all app libraries | Permissive |
| LGPL | `psycopg2-binary` | Weak copyleft on the driver |
| GPL-3.0 | Typesense **server** | Separate process; clients Apache |
| AGPL-3.0 | MinIO, Grafana OSS | Network copyleft on **that** software |
| SSPL / RSAL | Redis 7.4+ via `redis:7-alpine` | Source-available; not OSI |
| n8n SUL | n8n image | Internal use vs embed-in-product |
| Elastic / BSL | **Not found** as a direct dep | — |
| Unknown / no license | **Not found** among direct declared packages | — |

No Elastic License or BSL packages were declared as direct dependencies.

---

## Transitive and supply-chain notes (not a full scan)

- npm lockfile exists for the **web** app; the **worker** has no lockfile in-repo — versions float.
- Python requirements are **unpinned**. A future `pip install` can change license *and* CVEs without a PR.
- `sentence-transformers` pulls **PyTorch** (large; BSD). Fine on license; costly on CI/RAM (prod ingest already uses `--no-embed`).
- `pdf-parse` 1.x depends on an older `pdfjs` stack; Next already lists `pdf-parse` as `serverExternalPackages`.
- `shadcn` 4.x can talk to a component registry if you run the CLI — keep it off production start scripts.

A later pass should run `npx license-checker --production` and `pip-licenses` (or equivalent) on a frozen lockfile and commit an SBOM. That is **not** done here because it would not change application code, but it was also not requested as a generated artifact beyond this markdown file.

---

## Hosted SDK vs software license

| SDK license | Hosted product |
|-------------|----------------|
| `groq-sdk` Apache-2.0 | Groq inference: proprietary ToS |
| `@supabase/*` MIT | Supabase Cloud: proprietary ToS |
| `boto3` Apache-2.0 | AWS S3 or MinIO (MinIO AGPL) |

You can be Apache-clean on the **client** and still have AGPL or ToS issues on the **server you run** or the **API you call**.

---

## Recommended order (still no uninstalls in this task)

1. Treat **MinIO, n8n, unpinned Redis 7, Typesense server, Grafana OSS** as **do not enable** on a paid SaaS until counsel agrees. Production already avoids them.
2. When you next touch `package.json`, drop unused MIT packages: `react-window`, `@dnd-kit/sortable`, duplicate Radix packages, direct `supertokens-web-js`.
3. Pin Python (`requirements.lock`) so licenses cannot silently change.
4. If you ever run Redis in compose, pin BSD Redis 7.2 or Valkey **before** `latest` 7.4/8.
5. Keep using MIT/Apache app libraries (Next, React, Supabase clients, Groq SDK, TipTap, dnd-kit, etc.).
6. Upgrade `pdf-parse` 1.x → 2.x in a dedicated, tested PR — license stays MIT.

---

## Appendix — category membership lists

### SAFE_TO_REVIEW (keep)

`next`, `react`, `react-dom`, `@supabase/supabase-js`, `@supabase/ssr`, `groq-sdk`, `lucide-react`, `framer-motion`, `@tanstack/react-query`, `zustand`, `clsx`, `tailwind-merge`, `class-variance-authority`, `date-fns`, `radix-ui`, `@dnd-kit/core`, `@tiptap/react`, `@tiptap/starter-kit`, `react-dropzone`, `react-hook-form`, `recharts`, `mammoth`, `pdf-parse` (MIT; upgrade later), `shadcn`, `tw-animate-css`, SuperTokens packages (Apache; optional), all listed TypeScript/ESLint/Tailwind/PostCSS/tsx/sharp/`@types/*` devDependencies, `bullmq`, `ioredis`, FastAPI stack (except psycopg2), `requests`, SQLAlchemy, httpx, pydantic, pypdf, python-docx, spaCy, numpy, scikit-learn, sentence-transformers, boto3, typesense **client**, python-multipart, slowapi, python-dotenv, uvicorn, langdetect (stale but MIT), `en_core_web_sm`, MiniLM Apache weights, Ollama runtime (MIT), Prometheus, Uptime Kuma, pgvector/Postgres, Node/Python base images.

### NEEDS_LEGAL_REVIEW (do not “just enable”)

`psycopg2-binary` (LGPL), Typesense **server** (GPL-3.0), MinIO (AGPL), Grafana OSS (AGPL), `redis:7-alpine` as currently tagged (RSAL/SSPL), n8n (SUL), PostHog `ee/` bits, Groq/Supabase/Resend **hosted ToS/DPAs**.

### REMOVE_OR_REPLACE (later PR)

`react-window`, `@dnd-kit/sortable`, `@radix-ui/react-slot`, `@radix-ui/react-tabs`, direct `supertokens-web-js`, Python `redis` (unused), MinIO images, n8n image, Typesense server (until needed), PostHog stub compose, unpinned Redis 7.4+ tag, optional Grafana if unused.

---

*Generated from repository inspection on 18 August 2026. Re-audit after adding dependencies or pinning Docker digests.*
