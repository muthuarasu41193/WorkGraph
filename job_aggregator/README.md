# Job aggregator — ATS ingestion + local resume matching

Production-oriented Python service that:

1. Pulls **public** job listings from **Greenhouse**, **Lever**, and **Ashby** (official ATS JSON endpoints — no scraping marketplaces, no paid SERP APIs).
2. Persists normalized rows to **PostgreSQL** (recommended) or **SQLite** (default file `./jobs.db`).
3. **Dedupes** by canonical `apply_url` (unique) and skips unchanged bodies to avoid pointless re-embedding.
4. Embeds postings locally with **`sentence-transformers/all-MiniLM-L6-v2`** (384-d vectors, stored as JSON arrays).
5. Matches plain-text resumes with **cosine similarity** via **scikit-learn** (top 20 by default).

### ATS endpoints implemented

| ATS        | Source URL pattern |
|-----------|---------------------|
| Greenhouse | `https://boards-api.greenhouse.io/v1/boards/{token}/jobs` |
| Lever      | `https://api.lever.co/v0/postings/{site}?mode=json` |
| Ashby      | `https://api.ashbyhq.com/posting-api/job-board/{slug}` (public posting API — **no API key**) |

> **Ashby note:** The slug is the hosted board name (`jobs.ashbyhq.com/Ashby` → `Ashby`). An older hypothetical `jobs.ashbyhq.com/api/non-search-paths/{company}` path is **not** used because it does not align with Ashby’s documented public posting feed.

---

## Quick start

### 1. Create a virtualenv (recommended)

```bash
cd job_aggregator
python -m venv .venv
```

**Windows PowerShell**

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**macOS / Linux**

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

The first embedding run downloads `all-MiniLM-L6-v2` weights (hundreds of MB). Plan disk + bandwidth accordingly.

### 2. Configure database (optional)

By default SQLite writes `jobs.db` beside `job_aggregator/`.

For Postgres set:

```bash
cp .env.example .env
# edit .env — easiest when passwords contain @:
DATABASE_HOST=db.<project-ref>.supabase.co
DATABASE_PASSWORD=...
# optional: DATABASE_USER DATABASE_NAME DATABASE_PORT
```

Or a single `DATABASE_URL` (must URL-encode `@` in passwords). If `db.*.supabase.co` fails DNS on Windows (direct connections are IPv6-only), set **`DATABASE_PASSWORD`** and run **`python -m app.main probe-db`** — it prints **`DATABASE_POOLER_REGION`** for the IPv4 Session pooler; paste that into `job_aggregator/.env`. Optional **`DATABASE_HOSTADDR`** (AAAA record from `nslookup`) only helps if your PC has working IPv6 routing.

### Supabase + Next.js profile dashboard

The Next app reads aggregated rows from **`public.jobs`** using the logged-in user’s Supabase session.

1. Apply the SQL migration in the web repo:  
   `supabase/migrations/20260202120000_jobs_board.sql`  
   (Supabase Dashboard → SQL Editor, or `supabase db push` if you use the CLI.)

2. Point **`DATABASE_HOST` + `DATABASE_PASSWORD`** or **`DATABASE_URL`** at the **same Postgres** instance (Supabase → Project Settings → Database). Use the DB password, not the anon REST key. Prefer split vars if your password contains `@`.

3. Run `python -m app.main ingest` on a schedule. The profile page will show **live listing counts** and **recommended roles** ranked against the user’s skills/headline.

### 3. Tune company tokens

Edit `companies.json`:

```json
{
  "greenhouse": ["stripe", "airbnb", "figma"],
  "lever": ["netflix", "palantir"],
  "ashby": ["Ashby"]
}
```

- **Greenhouse** tokens are board slugs from `boards.greenhouse.io/{token}`.
- **Lever** sites match `jobs.lever.co/{site}` segments.
- **Ashby** strings are **case-sensitive** board names from `jobs.ashbyhq.com/{slug}`.

Invalid slugs simply yield zero rows — ingestion logs warnings and continues.

---

## CLI usage

From `job_aggregator/`:

```bash
python -m app.main ingest
python -m app.main match --resume ./samples/resume.txt
python -m app.main match --resume ./samples/resume.txt --top-k 20
```

Equivalent shim:

```bash
python main.py ingest
python main.py match --resume ./samples/resume.txt
```

### `ingest`

1. Loads `companies.json` (override path with `COMPANIES_JSON`).
2. Fetches + normalizes postings.
3. Upserts rows — duplicates ignored when `apply_url` matches **and** `content_hash` unchanged.
4. Batch-embeds any rows missing `embedding_json` (includes rows whose description changed).

### `match`

Reads UTF-8 resume text, embeds locally, prints sorted JSON matches.

---

## Scheduling with cron

Run ingestion nightly (adjust paths):

```cron
15 2 * * * cd /opt/job_aggregator && /opt/job_aggregator/.venv/bin/python -m app.main ingest >> /var/log/job_aggregator_ingest.log 2>&1
```

Tips:

- Keep a single writer process if you observe SQLite locks; Postgres handles concurrent reads/writes better.
- Stagger retries are built into HTTP GET logic — still respect ATS rate limits (`HTTP_TIMEOUT_SECONDS`, `HTTP_MAX_RETRIES`).

---

## Deploying on free-ish hosts

| Target | Notes |
|--------|------|
| **Local / VPS** | systemd timer instead of cron; same CLI. |
| **Render background worker** | Run `python -m app.main ingest` as the start command on a worker dyno; attach managed Postgres; persist SQLite **not** recommended on ephemeral disks unless you sync externally. |
| **Railway** | Similar to Render — use Postgres plugin + cron-like scheduler or GitHub Actions hitting a tiny webhook runner. |
| **Fly.io Machines** | Lightweight VM + cron supervisor; mount volume if SQLite. |

sentence-transformers **requires CPU RAM** (~2 GB comfortable for batch encode). GPU optional.

---

## Schema highlights (`jobs` table)

| Column | Purpose |
|--------|---------|
| `external_id` | Stable ATS identifier (`greenhouse:123`, …), unique |
| `apply_url` | Canonical apply URL — dedupe master key, unique |
| `content_hash` | SHA-256 of canonical text — skip embedding when unchanged |
| `embedding_json` | Serialized float vector (`json.dumps`) |
| `embedding_model_version` | Lets you invalidate embeddings after model swaps |

---

## Operational logging

Modules log via the standard library (`logging`). Adjust levels inside `app/utils.configure_logging()` if you need DEBUG traces.

---

## Extending safely

- Swap embedding model → bump `EMBEDDING_MODEL_VERSION` and wipe `embedding_json` for recomputation SQL:

  ```sql
  UPDATE jobs SET embedding_json = NULL;
  ```

- Plug additional ATS adapters beside `app/ingest/*.py`, register them inside `runner.run_full_ingestion`.

---

## License / compliance

Only interact with vendor-documented **public** endpoints. Respect each vendor’s Terms of Use and rate limits. This tool does **not** automate browsing LinkedIn, Indeed, or other non-ATS sources.
