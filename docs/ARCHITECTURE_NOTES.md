# Architecture notes (production truth)

Read this before changing the product. It describes what runs for users today.
`docs/WORKGRAPH_ARCHITECTURE.md` and the root `WORKGRAPH_ARCHITECTURE.md` describe an **unused self-hosted target** (FastAPI, Ollama, MinIO, Typesense, BullMQ, SuperTokens, Docker). Do not follow them for new work. `docs/SETUP.md` is the same unused target. `docs/WORKGRAPH_ARCHITECTURE_AUDIT.md` is a dated snapshot; where it still calls the `resumes` bucket public, the later migration wins (the bucket is private).

## 1. Production path

Browser → **Next.js 16 App Router** (React 19, TypeScript, Tailwind 4, `output: "standalone"`) on **Vercel**, deployed from `main`. Canonical site: `https://getworkgraph.com` (`lib/site-url.ts`).

- **Supabase Auth** (cookies). Middleware (`middleware.ts`) calls `supabase.auth.getUser()` to refresh the session. SuperTokens runs only when Supabase env is missing and `AUTH_PROVIDER=supertokens`. That is not production.
- **Supabase Postgres + RLS.** Schema lives in `supabase/migrations/`. Vercel and GitHub Actions do not apply those files.
- **Supabase Storage.** Bucket `resumes` is **private** (owner folder only). Bucket `avatars` is public-read.
- **Groq** `llama-3.3-70b-versatile` via `lib/groq.ts` (`GROQ_API_KEY`). Groq is the only AI processor. Resume text already goes there for parse, ATS, Talent Intelligence, and cover letters.
- **GitHub Actions** `supabase-jobs-ingest.yml` runs `job_aggregator` as a **CLI** every 6 hours (`0 */6 * * *`) and upserts `public.jobs`. `community-jobs-ingest.yml` runs at `30 */6 * * *`. The FastAPI HTTP server in `job_aggregator/app/api` is not the public API.
- **Vercel Cron** (`vercel.json`): `GET /api/sync-community-jobs` daily at `0 6 * * *`, authorized with `CRON_SECRET`.

`/api/v2/*` forwards to FastAPI only if `WORKGRAPH_API_URL` is set. Leave it unset. Keyword matching always scores `public.jobs` in `lib/job-match.ts`.

Do not add or wire FastAPI, Ollama, MinIO, Typesense, BullMQ, SuperTokens, a separate pgvector service, Docker, `services/worker`, `infrastructure/`, or `migrations/postgres/`. `public.workgraph_embeddings` is an in-Supabase table (local hash vectors). It is not that unused stack.

## 2. Feature map

| Feature | Routes / pages | Lib | Supabase |
|---|---|---|---|
| Resume upload / parse | `/upload`, `/create-profile`, `POST /api/parse-resume`, `GET /api/resume/file` | `lib/resume-intelligence/`, `lib/groq.ts`, `lib/upload-limits.ts` (4 MB), `lib/security/resume-access.ts` | `profiles` (text, `resume_storage_path`), Storage `resumes`, `resume_versions` |
| Jobs + matching | `/jobs`, `/jobs/[id]`, `/profile?view=jobs`, `/profile?view=home`, `/home` | `lib/job-match.ts`, `lib/job-feed.ts`, `lib/job-freshness.ts`, `lib/jobs-catalog.ts` | `jobs` (public catalog, no user id) |
| Resume / Talent Intelligence | `/profile?view=resume-intelligence`, `/insights` (links only), `/api/resume/analyze`, `/api/talent-intelligence/analyze`, `/api/talent-intelligence/reports` | `lib/talent-intelligence/`, `lib/resume-intelligence/` | `resume_intelligence_reports`, `resume_intelligence_feedback`, `resume_versions`, `profiles.resume_intelligence` |
| ATS score | Profile card `#ats-score`; `POST /api/ats-score` | `lib/talent-intelligence/services/ats-analyzer.ts`, `lib/groq.ts` | `profiles.ats_score`, `profiles.ats_feedback` |
| Applications Kanban | `/tracker` (server board), `/applications` (client board), `/profile?view=applications`; `/api/applications` | `lib/applications-server.ts`, `lib/applications.ts` | `applications`. `job_tracker_entries` is a separate counter read by `lib/job-dashboard.ts` |
| Hidden Jobs | Live discovery: `/profile?view=job-discovery`, `/api/hidden-jobs`. Dismissed catalog rows: `/profile?view=hidden-jobs` (browser storage, not the live feed) | `lib/hidden-opportunities/`, `lib/hidden-jobs-storage.ts`, `lib/dismissed-jobs.ts` | `hidden_job_analytics`, `hidden_job_saves`. Dismissed catalog ids are not a table |
| WorkGraph Direct | `/profile?view=workgraph-direct`, `/employer/*`, `/company/[slug]`; `/api/hiring-signals`, `/api/employer/*` | `lib/employer/` | `employer_profiles`, `hiring_signals`, `signal_connections` |
| Cover letters | `/profile?view=cover-letters`; `/api/cover-letters/generate`, `list`, `save`, `[id]` | `lib/cover-letters/service.ts`, `lib/cover-letters/session.ts` | `cover_letters` |
| Interview Vault | Marketplace: `/interview-vault`, `/interview-vault/[id]`, `/sell`, `/dashboard`; `/api/vault/*`. `/profile?view=vault` is **local prep notes**, not the marketplace | `lib/vault-server.ts`, `lib/vault.ts`, `lib/security/vault-entitlement.ts` | `vault_experiences`, `vault_purchases`, `vault_reviews` |
| Subscriptions | `/pricing`, homepage pricing block | `lib/subscription/index.ts` (`LIMITS` only; see gaps) | `profiles.subscription_tier`, `profiles.subscription_expires_at` |
| Consent | Cookie banner; `POST /api/consent` | `lib/consent.ts`, `lib/consent-log.ts`, `lib/consent-log-server.ts` | `consent_log` (service role insert) |
| Legal | `/legal/privacy`, `/terms`, `/cookies`, `/acceptable-use`, `/dpa` | `lib/legal.ts` | none (`testimonials` is marketing copy, not a legal store) |

Transactional email, when configured, is Resend over HTTP in `lib/email/workgraph-mail.ts` (`RESEND_API_KEY`, `WORKGRAPH_EMAIL_FROM`). It is not a second AI processor.

## 3. Auth, session, service role

Use these on the server. Never trust `user_id` from the client body, query, or headers.

| Helper | File | Use |
|---|---|---|
| `getSessionUser` / `requireSessionUser` | `lib/auth/session-server.ts` | Server Components and route handlers. Supabase user when env is set |
| `getSupabaseSessionUser` | `lib/route-auth.ts` | Cookie session, or `Authorization: Bearer` checked with `auth.getUser` |
| `resolveAuthenticatedUserId` | `lib/security/session-identity.ts` | Session id wins. The client id argument is ignored |
| `createServerSupabaseClient` | `lib/supabase.ts` | Anon key + cookies. RLS applies |
| `createSupabaseAdminClient` | `lib/supabase-admin.ts` | `SUPABASE_SERVICE_ROLE_KEY`. **Bypasses RLS.** Server only |

Service-role code must still `.eq` the session user id (or a relationship the server already checked, such as an employer connection the caller owns). Cron ingest and consent inserts are the exceptions: cron uses `CRON_SECRET`, and `consent_log` has no client policies. Do not log resume text, emails, phones, tokens, or the service-role key. Do not put that key in `NEXT_PUBLIC_*`.

## 4. Tables (after every migration in `supabase/migrations/`)

Service role bypasses all of these policies. “Own” means `auth.uid()` matches the owner column.

| Table | Stores | PII | RLS |
|---|---|---|---|
| `jobs` | Public ATS and community listings. No salary column. No user id | No account PII | SELECT for `anon` and `authenticated` (`using true`). No client write policy. Ingest uses the service role |
| `job_tracker_entries` | Per-user status tallies | User id only | SELECT, INSERT, DELETE own. No UPDATE |
| `profiles` | Jobseeker profile, resume text, skills, ATS fields, subscription columns, embedding JSON | **Yes** (name, email, phone, resume) | SELECT, INSERT, UPDATE own (`id = auth.uid()`). No DELETE. `anon` has table GRANT but no policy, so anon reads no rows. UPDATE is not column-limited |
| `hidden_job_analytics` | view / click / save events | Optional user id | INSERT and SELECT when `user_id` is null or own. No UPDATE/DELETE |
| `hidden_job_saves` | Saved discovery opportunities | User id | SELECT, INSERT, UPDATE, DELETE own |
| `applications` | Kanban cards (company, role, notes, contact, salary text, timeline) | **Yes** | SELECT, INSERT, UPDATE, DELETE own. Realtime enabled |
| `vault_experiences` | Interview guides. `price_inr`. HTML and `rounds_data` on the row | Seller account id; narrative may be personal | SELECT for anon and authenticated if `published` or seller. INSERT, UPDATE, DELETE seller. RLS does **not** hide HTML; the API must omit it |
| `vault_purchases` | Buyer, `amount_inr`, `payment_status` (`pending` / `verified` / `failed`), provider, reference | Buyer id | SELECT as buyer or as the experience’s seller. INSERT only when buyer is self **and** `payment_status = 'pending'`. No UPDATE policy |
| `vault_reviews` | Rating and comment | User id; comment may be personal | SELECT all (anon and authenticated). INSERT own user and (free listing or **verified** purchase). UPDATE own |
| `employer_profiles` | Company identity, slug, verification status and domain | Business contact / domain | Authenticated SELECT all rows. Anon SELECT only `verification_status = verified`. INSERT, UPDATE own. No DELETE |
| `hiring_signals` | Employer intent (not scraped ATS jobs) | Employer content | Authenticated SELECT if `live` or owner. Anon SELECT if `live` and employer is verified. INSERT, UPDATE, DELETE owner |
| `signal_connections` | Seeker connection, note, `fit_snapshot`, `application_snapshot` | **Yes** (snapshot is a resume package; phone excluded by comment) | SELECT and UPDATE for seeker or that signal’s employer. INSERT as seeker |
| `resume_versions` | Content-hashed parse snapshot | **Yes** | SELECT, INSERT, DELETE own. No UPDATE |
| `resume_intelligence_reports` | Cached AI report plus job-description text | **Yes** (resume-derived) | SELECT, INSERT, UPDATE, DELETE own |
| `resume_intelligence_feedback` | Rating and comment on a report | User id; comment | SELECT, INSERT own. No UPDATE/DELETE |
| `workgraph_embeddings` | 256-d hash vectors and content hashes. Not raw resume text | Resume-derived for user-owned rows | SELECT if `owner_user_id` is null or own. INSERT, UPDATE, DELETE only as owner (cannot insert a null owner) |
| `cover_letters` | Saved letter, job title, company, job description | **Yes** | SELECT, INSERT, DELETE own. No UPDATE |
| `testimonials` | Consented marketing quotes | Author name and title | SELECT for anon and authenticated where `consent_given_at` is not null. No client write policy |
| `consent_log` | Consent categories, anonymous id, optional user id, ISO country. No full IP | Quasi-identifier | RLS on. `REVOKE ALL` from `anon` and `authenticated`. No policies. Service role only |

Storage (not `public` tables): `resumes` is private; authenticated SELECT, INSERT, DELETE only when the first folder is `auth.uid()`. `avatars` is public SELECT; authenticated INSERT and UPDATE in the owner folder.

`auth.users` is Supabase Auth, not created by these migrations. Most user tables cascade on delete from it. There is no app-level account-delete path that calls that delete (see gaps).

## 5. Migrations

Add `supabase/migrations/YYYYMMDDHHMMSS_short_name.sql`. Make it idempotent (`create table if not exists`, `add column if not exists`, `drop policy if exists` before `create policy`). Enable RLS. Default to owner-only policies. Do not edit an old migration file. Nothing in CI applies the folder: run the new file yourself in the **Supabase Dashboard → SQL Editor**. When `lib/account/` exists, also add the table to its delete and export paths.

## 6. Commands

| Command | What it runs |
|---|---|
| `npm run dev` | `next dev` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `eslint .` then `npm run check:tokens` |
| `npm run check:tokens` | `node scripts/check-design-tokens.mjs` |
| `npm test` | `node --import tsx --test` on an **explicit** list in `package.json` (`lib/hidden-opportunities/__tests__`, `lib/talent-intelligence/__tests__`, `lib/__tests__`, `lib/validation/__tests__`, `lib/resume-intelligence/__tests__`, `lib/embeddings/__tests__`, `lib/security/__tests__`). A new `__tests__` folder does not run until that script lists it |
| `npm run build` | `next build` |

Node `>=20.16.0`. CI (`.github/workflows/verify-build.yml`) runs config check, tokens, typecheck, test, and build on pushes and PRs to `main`.

## 7. Known gaps (checked in code)

- `checkSubscription()` in `lib/subscription/index.ts` is never called. `/pricing` only imports `LIMITS` and the tier type. Tiers are profile flags, not a checkout.
- `profiles_update_own` lets the owner update every column, including `subscription_tier` and `subscription_expires_at`. The subscription migration adds a check constraint (`free` / `premium` / `pro`) and does not lock those columns.
- `lib/cover-letters/service.ts` asks Groq for a “compelling” letter and has **no** anti-invention instruction. Parse and Talent Intelligence prompts do.
- No account deletion or data export. There is no `lib/account/` and no `deleteUser` call. `app/legal/privacy/page.tsx` tells people to use “account deletion in settings.” `components/settings/SettingsSection.tsx` has theme, a note that alerts are not stored, and “Export is not available from here.”
- `lib/saved-searches.ts` is `localStorage` key `wg-saved-searches` only. Settings states that match, hidden-job, and application alerts are not stored and are not sent.
- `jobCardView()` in `lib/job-feed.ts` always returns `salary: { kind: "undisclosed" }`. `public.jobs` has no salary column, so this is not hiding a stored figure.
- Freshness thresholds differ. `lib/job-feed.ts` `STALE_AFTER_DAYS` is **60** (`days >= 60`). `lib/job-match.ts` uses a private `STALE_AFTER_DAYS` of **30** (`ageDays > 30`). `lib/job-freshness.ts` has **no** `STALE_AFTER_DAYS` constant; `formatJobFreshness` says “may no longer be open” when `days > 30`.
- Paid Interview Vault unlock records `payment_status = 'pending'` and returns **402**. No payment provider is called. `price_inr <= 0` unlocks without payment.
- `components/marketing/PricingTiers.tsx`, `lib/legal.ts`, and `app/legal/terms/page.tsx` name Stripe. Vault prices are `price_inr` (rupee symbol in the vault UI). There is no Stripe package and no checkout. Pricing cards say “No public price.”

## 8. Rules for future changes

- Production stack only: Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Supabase (Auth, Postgres, RLS, Storage), Groq via `lib/groq.ts`, Vercel from `main`.
- Inspect the live path before editing a major subsystem. Smallest change that keeps current behavior. Do not rewrite a working feature without a failing repro, a security defect, or an explicit requirement.
- No new dependency unless the repo cannot do the job. Justify it (problem, SPDX license, what data leaves, bundle). MIT, Apache-2.0, BSD, ISC only. No AGPL, GPL, SSPL, or source-available licenses.
- No new third party may receive resume files, resume text, or resume-derived data.
- AI must not invent experience, employers, titles, dates, numbers, skills, or credentials. Validate output with Zod, cap length, drop unknown keys, never render it as raw HTML. Scores are estimates, not hiring probabilities.
- Resume upload cap stays 4 MB (`lib/upload-limits.ts`).
- Scope every user-data read and write to the session user. Service role does not skip that filter.
- New tables: migration as in section 5, RLS on, owner-only, and included in account delete/export once `lib/account/` exists.
- Additive only. Do not delete, rename, or rewrite existing features, routes, tables, or columns. Never log resume text, emails, phones, tokens, or secrets.
- UI reuses `components/ui`, `components/product`, and `components/design-system` and the design tokens (`npm run check:tokens`). The brand accent is red; do not use red or amber except for real warnings and errors.
