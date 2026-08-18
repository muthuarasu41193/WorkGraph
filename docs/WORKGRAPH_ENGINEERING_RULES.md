# WorkGraph Engineering Rules

**Date:** 18 August 2026  
**Status:** Binding. Applies to all product and engineering work on this repository, including Cursor agent sessions.  
**Scope:** Application code, APIs, workers, ingest, schema, tests, dependencies, logging, and AI pipelines.  
**This document does not authorize application-code changes by itself.** Follow the change protocol below before editing a major subsystem.

Related documents:

- [`docs/WORKGRAPH_ARCHITECTURE_AUDIT.md`](./WORKGRAPH_ARCHITECTURE_AUDIT.md) — what exists and works today
- [`docs/WORKGRAPH_ARCHITECTURE.md`](./WORKGRAPH_ARCHITECTURE.md) — target self-hosted layout
- [`docs/DEPENDENCY_LICENSE_AUDIT.md`](./DEPENDENCY_LICENSE_AUDIT.md) — current license inventory

When this document conflicts with convenience, a rewrite impulse, or an unused self-hosted path, **these rules win**. Preserve working production paths (Vercel + Next.js + Supabase + Groq) unless there is evidence they are broken and a safer fix is specified.

---

## Change protocol (required)

**Before modifying a major subsystem, Cursor (and any engineer) must:**

1. **Inspect** the existing implementation: entry points, data flow, auth, storage, tests, and call sites.
2. **Explain** the intended changes in the conversation *before* editing: what will change, why, what will not change, and what evidence justifies the work.
3. **Preserve** working behavior unless the inspection produced evidence of a defect, security issue, or explicit product requirement.
4. **Implement** only the scoped change. Do not opportunistically rewrite adjacent code.

Do not start a rewrite, extract a new service, or swap a library in a major subsystem without completing steps 1–2.

### Major subsystems

Treat at least these as major subsystems:

| Subsystem | Typical locations |
|-----------|-------------------|
| Auth and session | `lib/auth/`, `lib/supabase-*.ts`, `app/api/auth/`, SuperTokens paths |
| Profile and resume parse/storage | `app/api/parse-resume/`, `app/api/profile/`, `utils/resumeParser.ts`, Storage bucket `resumes` |
| Jobs catalog and matching | `lib/job-match.ts`, jobs API/pages, `public.jobs` |
| Hidden Jobs Discovery | `app/api/hidden-jobs/` and related fetchers |
| ATS scoring | `app/api/ats-score/`, `app/api/v2/ats-score/` |
| Talent Intelligence | `app/api/talent-intelligence/`, `lib/talent-intelligence/`, related UI |
| Applications Kanban | applications API/UI, `@dnd-kit` board |
| Interview Vault | vault API/UI, TipTap editors |
| Employer Hiring Signals | `lib/employer/`, `app/employer/` |
| Community | community jobs/posts APIs and UI |
| Job ingest | `job_aggregator/`, GitHub Actions ingest |
| Background worker | `services/worker/` |
| Self-hosted API / data plane | FastAPI, MinIO, Typesense, Ollama, pgvector — **migration target, not a license to replace working Vercel flows** |

If unsure whether a change is “major,” treat it as major and run the protocol.

---

## 1. Never rewrite working functionality without evidence

Working product surfaces must be hardened and connected, not rebuilt.

**Evidence** means at least one of:

- A failing test, reproduction, or production error that names the broken behavior
- A security or correctness defect found in the existing implementation
- An explicit product requirement that the current path cannot meet
- A measured performance or cost problem (not a preference)

**Not evidence:** unused self-hosted code existing in-repo, a newer library, stylistic dislike, or “this would be cleaner.”

If a path works in production, keep it. Prefer the smallest fix.

---

## 2. Never introduce a new dependency when existing functionality can solve the problem

Search this repo first: existing packages, utilities, API routes, and patterns.

Do not add a library for date formatting, HTTP, class names, state, parsing, or UI primitives if `date-fns`, `fetch`, `clsx` / `tailwind-merge`, Zustand, React Query, `pdf-parse` / `mammoth`, Radix, or other already-present tools can do the job.

Do not add a second LLM client, auth SDK, or database client “for the new feature” if the production stack already has one.

---

## 3. Every dependency must be justified

A new dependency requires a written justification in the change (PR description or the same session), covering:

| Question | Required answer |
|----------|-----------------|
| Problem | What cannot be done with code and libraries already in the repo? |
| Why this package | Specific capability, not popularity |
| License | SPDX id; must pass rules 4–5 |
| Runtime impact | Browser vs server; bundle size; native binaries |
| Data | Does it send user data anywhere? (rule 6) |
| Maintenance | Maintained, pinned, not a one-off GitHub tarball |
| Removal plan | How we would replace it |

Unjustified additions must be rejected. Prefer copying a small utility over adding a package for a few lines.

---

## 4. Prefer MIT, Apache-2.0, BSD, and ISC licenses

Default allow-list for new dependencies: **MIT**, **Apache-2.0**, **BSD-2-Clause**, **BSD-3-Clause**, **ISC**.

Keep license notices and attribution where those licenses require them. Consult [`docs/DEPENDENCY_LICENSE_AUDIT.md`](./DEPENDENCY_LICENSE_AUDIT.md) before treating a current package as “already approved forever.”

Permissive licenses are not a GDPR, privacy, or hosted-API substitute. Hosted vendors (Groq, Supabase, Resend, job boards) are contracts and processors, not OSS licenses.

---

## 5. Do not use AGPL / GPL / SSPL / source-available dependencies without explicit review

Do not add or enable:

- AGPL, GPL, LGPL (without review), SSPL
- “Source-available,” BUSL, Commons Clause, or other non-OSI proprietary OSS
- Dual-licensed packages that require a paid commercial license for SaaS

**Explicit review** means a documented decision (and legal review when the package would ship in a paid product or on-prem distribution). Existing copyleft or source-available items already flagged in the license audit stay in **NEEDS_LEGAL_REVIEW**; do not expand their use.

Do not enable unused high-risk infra from the audit as a shortcut to a feature.

---

## 6. Do not send personally identifiable resume data to external services unless the architecture explicitly requires it and the user has been informed appropriately

Resume files, `resume_raw_text`, emails, phone numbers, addresses, and other profile PII must stay in our controlled stores (today: Supabase Postgres and Storage) unless:

1. The **documented architecture** requires that processor for the feature (for example, Groq on the current Talent Intelligence / parse / ATS path), **and**
2. The **user has been informed** through product UX and privacy copy appropriate to that transfer.

Do not add new third-party destinations for resume PII (analytics, extra LLM vendors, CDNs that log bodies, “helpful” SaaS parsers) without an architecture change and user-facing notice.

Prefer local/self-hosted processing when a feature does not already depend on an external AI path. Do not send full resumes to new vendors “to try it.”

---

## 7. Never log resumes, emails, phone numbers, addresses, tokens, passwords, or authentication secrets

Logs, error reporters, analytics, and traces must not contain:

- Resume text, files, or storage URLs that expose resume content
- Email, phone, physical address, government IDs
- Access tokens, refresh tokens, session cookies, API keys
- Passwords, service-role keys, webhook secrets

Log stable identifiers (`user_id`, request id, error code) and non-PII metadata. Redact request bodies and headers on any path that may carry credentials or resume payloads.

Never print env secrets in server logs, CI, or client bundles.

---

## 8. All user input must be validated server-side

Client validation is UX only. Every mutation and query that accepts input must validate on the server (App Router route handlers, FastAPI, workers):

- Types, length, required fields, enums, file type and size
- Authn before authz
- Reject unknown fields where a strict schema is appropriate

Do not trust `content-type`, filenames, or client-side parse results as safety guarantees. Re-validate after AI extraction (rule 11).

---

## 9. All database queries must be scoped to the authenticated user

Reads of user-owned rows must be constrained by the authenticated user id (or a documented, authorized exception such as a public job listing).

Do not query `profiles`, applications, vault items, or similar by id alone. Use the session user (or RLS that enforces the same). Service-role / admin clients must still apply an explicit `user_id` (or equivalent) filter in application code; RLS is not an excuse to skip scoping.

Public catalog data (`jobs`, public company pages) is the exception — still avoid leaking other users’ PII through joins or embeddings.

---

## 10. Every database mutation must enforce authorization

Inserts, updates, deletes, and storage writes must verify that the caller may change that row or object.

- Ownership: user may only mutate their own profile, applications, vault entries, and uploads
- Role: employer vs seeker vs admin checks on privileged tables
- IDOR: never accept a client-supplied `user_id` as authority

Service-role keys bypass RLS. Code that uses them **must** re-check authorization in the handler. Missing authz is a ship-blocker, not a follow-up.

---

## 11. Every AI output must be treated as untrusted data

LLM and extractor output is untrusted, including Groq, Ollama, spaCy, and sentence-transformers side effects.

- Do not execute model output as code or HTML without sanitization
- Do not concatenate model output into prompts, SQL, shell, or logs without bounds and redaction
- Validate JSON against a schema; drop unknown keys; cap string lengths
- Persist only fields the product needs
- Render with the same XSS discipline as any user-generated content

Model claims are not facts. Do not write AI text into other users’ records without an authorization path.

---

## 12. AI-generated career scores must be presented as recommendations / estimates, not guaranteed hiring probabilities

ATS scores, Talent Intelligence match scores, skill-gap ratings, and similar numbers are **estimates and recommendations**.

UI, API payloads, emails, and marketing copy must not present them as:

- Guaranteed interview or offer probability
- Official hiring decisions
- Certified assessments of a person’s worth or protected traits

Label scores as estimates. Avoid precision theater (fake decimals, “98.7% hire chance”). Keep human-readable caveats on career-score surfaces.

---

## 13. Never infer or expose protected / sensitive personal characteristics

Do not infer, store, display, or score on protected or sensitive attributes, including (non-exhaustive): race, ethnicity, religion, caste, national origin, citizenship, sex, gender identity, sexual orientation, pregnancy, disability, health, age (except where the user explicitly provided a lawful, necessary field), political opinion, or union membership.

Do not prompt models to guess these from resumes or photos. If a model emits them, strip them before save and display. Do not use them in matching, ranking, or employer-facing views.

---

## 14. Users must be able to delete their data

Account deletion (or an equivalent documented flow) must remove or irreversibly anonymize the user’s major personal data: profile, resume text and files, applications, vault content they own, AI artifacts derived from their resume, and related storage objects, within a defined retention window for backups.

New tables and buckets that store user content must be included in the deletion path. Do not add personal data stores without a delete story.

---

## 15. Users should be able to export their major personal data

Provide a way for a user to export the major personal data we hold about them (profile, resume metadata/text they uploaded, applications, vault entries they created, scores we stored for them).

Exports must be scoped to the authenticated user (rules 9–10), delivered over authenticated channels, and must not include other users’ data or secrets.

---

## 16. Every major feature must include tests

A major feature is not done without tests that cover the behavior just added or changed.

Minimum expectations:

- Server routes: authz failure, validation failure, happy path
- Data access: scoped reads; unauthorized mutation denied
- Parsers and scorers: fixture in, stable shape out (no live network in unit tests)
- UI-critical flows: at least a focused test or existing suite extension where the repo already tests UI

Do not skip tests because a change is “just a prompt” or “just a query.” Prompt and query changes alter product behavior.

---

## 17. Avoid N+1 queries

Do not query the database once per item in a list. Batch, join, or use a single filtered select.

Watch server-rendered lists, Kanban columns, employer signal feeds, and job cards. If a loop contains `await` to the DB, fix it before merge.

---

## 18. Avoid unnecessary API calls

Do not refetch on every render, duplicate the same Groq/Supabase call from client and server, or poll when a single load or cache would suffice.

Reuse existing BFF routes. Deduplicate identical requests (React Query keys, server `cache`, or in-request memoization). Do not call Hidden Jobs, ATS, or Talent Intelligence pipelines speculatively.

---

## 19. Cache expensive computations where appropriate

Cache or persist:

- Job embeddings and catalog-derived scores that do not change every request
- Unchanging reference data
- Idempotent ingest results

Do not cache another user’s PII in a shared, unscoped key. Cache keys must include user id when the value is user-specific. Invalidate on upload, profile update, or catalog refresh as needed.

Prefer storing ATS / Talent Intelligence results for reuse over re-calling Groq on every page view.

---

## 20. Never expose secrets to the browser

The browser may only receive values that are intentionally public.

**Must not appear in client bundles, `NEXT_PUBLIC_*`, HTML, or client logs:**

- `SUPABASE_SERVICE_ROLE_KEY` and any service-role or admin key
- Groq / LLM API keys
- Job-board, GitHub, Reddit, Resend, webhook, and similar secrets
- Database URLs with credentials
- SuperTokens core API keys (except documented public client ids)

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public-by-design; they are not a substitute for RLS and server-side authz. New env vars default to **server-only**. If a value must be public, name it `NEXT_PUBLIC_*` deliberately and assume attackers have it.

---

## Quick checklist for every change

- [ ] Inspected existing implementation; explained the change before editing a major subsystem
- [ ] No rewrite of working behavior without evidence
- [ ] No new dependency unless existing code cannot solve it; justification recorded
- [ ] License is MIT / Apache-2.0 / BSD / ISC, or explicit review is documented
- [ ] No new PII / resume egress except documented architecture + user notice
- [ ] Logs have no resumes, emails, phones, addresses, tokens, or secrets
- [ ] Server-side validation; queries scoped; mutations authorized
- [ ] AI output untrusted; scores labeled as estimates; no protected-characteristic inference
- [ ] Delete (and export) paths considered for new personal data
- [ ] Tests added or updated; no N+1; no extra API calls; cache where it pays
- [ ] No secrets in the browser
