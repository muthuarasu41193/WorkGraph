# P0 Security Hardening Plan

**Date:** 19 August 2026  
**Status:** Binding for this change set. No feature work, no stack migration.  
**Evidence:** `docs/WORKGRAPH_ARCHITECTURE_AUDIT.md` P0 items 1–4 plus live inspection of the current tree.

This document records what exists today, what will change, and what will not. Code changes follow this plan only.

---

## Inspection summary

Production remains Next.js + Vercel + Supabase + Groq. FastAPI is optional behind `WORKGRAPH_API_URL` and must stay a server-side BFF target.

| Area | Current finding |
|------|-----------------|
| Resume Storage | Historical migration `20260519120000_profiles_auth.sql` creates `resumes` as **public** with `resumes_read_public`. Unapplied working-tree migration `20260818120000_resume_intelligence_normalized.sql` already sets the bucket private and rewrites `profiles.resume_url` to `/api/resume/file`. Owner download route exists. Client upload still writes `{userId}/…`. Avatars remain public. Employer inbox still treats `application_snapshot.resume_url` as a world-open href. |
| `/api/ats-score` | Session is resolved server-side today. Client `user_id` is accepted by `atsScoreBodySchema` and still sent by several callers, but **not used** to load/write profiles. Residual risk: schema + callers still advertise a client identity. |
| `/api/v2/ats-score` | Same session pattern. Forwards to v1 when FastAPI is off. Uses session id for profile load/write. Client `user_id` still in the body schema. |
| `/api/resume/analyze` | Already calls `getSupabaseSessionUser` and returns 401. Input + 4 MB upload limits already applied. Tests missing. |
| `/api/v2/match-jobs` | **No authentication.** Accepts arbitrary `resume_text` and forwards it to FastAPI when configured. Returns 503 when `WORKGRAPH_API_URL` is unset. Keyword ranking on the Jobs tab (`lib/job-match.ts`) is a separate path and does not use this route. |
| Interview Vault | `POST /api/vault/experiences/:id/purchase` inserts `vault_purchases` with no payment provider. RLS `vault_purchases_insert_own` lets any authenticated user insert their own row. `userHasPurchased` treats any row as entitlement. GET/SSR send `full_content`, `questions_html`, `tips_html`, and `rounds_data` to locked viewers. Marketplace list select includes those fields. Stripe/Razorpay env keys are unused. `price_inr >= 0`, so free listings (`0`) are possible. |
| Auth utilities | `lib/route-auth.ts` (`getSupabaseSessionUser`, bearer JWT + SSR cookies). `lib/auth/session-server.ts` (`getSessionUser`). Service role is server-only (`lib/supabase-admin.ts`). |
| Tests | `node --import tsx --test` over `lib/**/__tests__/*.test.ts`. CI (`verify-build.yml`) runs typecheck + build, **not** tests. Do not change CI. |

---

## P0-1 — Make resume storage private

### Vulnerability

Anyone with a Storage public object URL can download a resume. Bucket `public = true` plus `resumes_read_public`.

### Affected files / routes

- `supabase/migrations/20260519120000_profiles_auth.sql` (historical; do not edit)
- `supabase/migrations/20260818120000_resume_intelligence_normalized.sql` (already privatizes; keep, do not rewrite)
- New: `supabase/migrations/20260819100000_p0_security_hardening.sql` (idempotent production-safe assertion)
- `app/api/resume/file/route.ts`
- `app/api/parse-resume/route.ts`, `app/api/v2/parse-resume/route.ts` (already persist `/api/resume/file`)
- `components/resume/ResumeUploader.tsx` (authenticated owner upload; keep)
- `components/employer/seeker/ApplicationConnectDialog.tsx`
- `components/employer/PulseInbox.tsx`, `components/employer/ApplicantApplicationPanel.tsx`
- `components/profile/premium/ProfileHero.tsx` (owner open of `resume_url`)
- `lib/resume-intelligence/schema.ts` (`OWNER_RESUME_FILE_PATH`)

### Current behavior

- Resumes land at `resumes/{userId}/{timestamp}-{filename}`.
- Historical rows / deployed DBs may still have `/object/public/resumes/…` URLs.
- Owner viewing goes through `/api/resume/file` → 60s signed URL (working-tree).
- Employer “View resume” uses the snapshot URL directly.

### Intended secure behavior

- `storage.buckets.resumes.public = false`.
- No public SELECT policy on `resumes`.
- Authenticated owners may INSERT/SELECT/DELETE only objects whose first folder is `auth.uid()`.
- File URLs stored on profiles are the owner route `/api/resume/file`, never a permanent public URL.
- `/api/resume/file` requires a session. It signs a short-lived URL for:
  1. the owner’s `resume_storage_path` (or latest `resume_versions.storage_path`), or
  2. an employer who owns the hiring signal for `?connectionId=` (authorized server-side read of that seeker’s stored resume).
- Avatars stay public. Upload UX stays the same. Service role stays server-only.

### Migration required

Yes. New timestamped migration (do not edit historical files):

- `update storage.buckets set public = false where id = 'resumes'`
- drop `resumes_read_public` if present
- ensure owner SELECT/DELETE policies
- rewrite leftover `profiles.resume_url` values that contain `/object/public/resumes/` to `/api/resume/file` and backfill `resume_storage_path` when parseable
- do not drop rows or files

`20260818120000_…` already performs part of this. The P0 migration is idempotent so production is private even if that earlier file is applied first, second, or both.

### Frontend changes required

- Stop using snapshot/public resume URLs as employer hrefs. Use `/api/resume/file?connectionId={connection.id}`.
- Owner “Resume” button keeps `/api/resume/file` (cookie session).
- Do not call `getPublicUrl` on `resumes`. Avatars unchanged.

### Tests required

- Resume object URLs that look like public Storage paths are treated as unsafe.
- Owner path `/api/resume/file` is the stored profile URL.
- Cross-user storage path (`otherUserId/file.pdf`) is rejected for the session user.
- Employer connection URL is distinct from the owner URL and still not a public object URL.

### Rollback considerations

- Re-setting `public = true` would restore world-readable files. Do not roll back Storage privacy.
- If the P0 migration must be reverted, keep the bucket private and only revert Vault columns (separate section).
- Historical employer snapshots that stored public URLs will stop working after privacy; new employer hrefs use `connectionId`.

---

## P0-2 — Fix ATS user IDOR

### Vulnerability

Audit: `POST /api/ats-score` and `POST /api/v2/ats-score` accepted client `user_id` and used the service role to read/write that profile.

Live code already resolves the session user and queries `profiles.id = sessionUserId`. Residual IDOR surface: body schema + callers still send `user_id`, which invites a future regression.

### Affected files / routes

- `app/api/ats-score/route.ts`
- `app/api/v2/ats-score/route.ts`
- `lib/validation/resume.ts` (`atsScoreBodySchema`)
- `components/profile/ATSScoreCard.tsx`
- `components/resume/ResumeUploader.tsx`
- `app/create-profile/page.tsx`

### Current behavior

- 401 if no session.
- Profile load/write uses session id.
- Body may include `user_id` / `email`; `user_id` is ignored today.

### Intended secure behavior

- Authenticated identity comes only from `getSupabaseSessionUser` (bearer JWT and/or cookies).
- Client `user_id` is ignored (stripped or unused). Never used as a query/update key.
- ATS results are written only to the session user’s profile.
- Unauthenticated → 401.
- Missing **own** profile → 404 with a generic message (this does not disclose another user’s existence because the other id is never queried).
- Legitimate analyze-after-upload flow is unchanged (credentials included; empty or `{ email }` body is enough).

### Migration required

None.

### Frontend changes required

- Stop sending `user_id` in ATS POST bodies. Keep `credentials: "include"` / auth headers.
- Do not redesign the ATS card.

### Tests required

1. Unauthenticated ATS decision → 401.
2. Authenticated ATS decision → target id is the session user.
3. Client `user_id` substitution is ignored.

### Rollback considerations

- Reverting only the frontend body shape is safe; old clients that still send `user_id` continue to work because the server ignores it.

---

## P0-3 — Protect `/api/resume/analyze`

### Vulnerability

Audit: unauthenticated Groq usage. Live route already requires a session. Residual: no tests; keep auth + validation locked in.

### Affected files / routes

- `app/api/resume/analyze/route.ts`
- `app/(dashboard)/profile/components/ResumeAnalyzer.tsx` (already sends auth headers)
- `lib/validation/resume.ts`, `lib/upload-limits.ts`

### Current behavior

- 401 without session.
- PDF or pasted text; 4 MB / type checks; Groq analysis JSON; no profile write of another user.

### Intended secure behavior

- Same, explicitly: session required, 401 otherwise, existing upload limits, no cross-user storage, no pipeline redesign.
- Safe generic errors via `publicErrorResponse`.

### Migration required

None.

### Frontend changes required

None beyond keeping auth headers (already present).

### Tests required

4. Unauthenticated analyze → 401.

### Rollback considerations

None beyond re-opening an unauthenticated Groq sink (do not).

---

## P0-4 — Protect `/api/v2/match-jobs`

### Vulnerability

No auth. Any client can POST `resume_text` to the Next BFF, which forwards it to FastAPI when `WORKGRAPH_API_URL` is set (cost / DoS / data egress).

### Affected files / routes

- `app/api/v2/match-jobs/route.ts`
- `lib/workgraph-api.ts` (`matchJobsViaApi`)
- `lib/validation/resume.ts` (`matchJobsBodySchema`)
- Jobs tab keyword scoring: `lib/job-match.ts` (unchanged)
- Server dashboard semantic match: `lib/workgraph-dashboard.ts` (already uses the signed-in profile; not the public HTTP route)

### Current behavior

- If API URL unset → 503 `{ error: "WORKGRAPH_API_URL is not configured" }`.
- If set → parse body, forward `resume_text` + `top_k`, no session check.
- Keyword fallback on the Jobs UI does not call this route.

### Intended secure behavior

- Require a valid session first. Unauthenticated → 401 (even if FastAPI is configured).
- If API URL unset → keep 503 (graceful current behavior).
- Never trust a client user id. Do not treat `X-User-Id` as authentication.
- Load resume/profile text for **the session user** (prefer `profiles.resume_raw_text`; otherwise the same profile-derived text the dashboard already builds). Ignore client `resume_text` if sent.
- FastAPI is called only from this Next.js BFF after auth. Browser does not call FastAPI as an auth mechanism.
- `top_k` remains validated (1–50).
- Keyword ranking (`lib/job-match.ts`) is untouched.

### Migration required

None.

### Frontend changes required

None required for the Jobs tab. No browser caller of `/api/v2/match-jobs` was found.

### Tests required

5. Unauthenticated match-jobs → 401.
6. Cross-user: client-supplied user id / foreign resume text is not used; matching uses the session user’s profile text.

### Rollback considerations

- Restoring unauthenticated forwarding would re-open the cost/DoS sink.

---

## P0-5 — Interview Vault purchase / unlock

### Vulnerability

Authenticated users can insert `vault_purchases` (API + RLS) and immediately receive full paid content. GET/SSR also leak full HTML to locked clients (CSS blur is not access control). No Stripe/Razorpay verification exists. Do **not** invent a payment provider.

### Affected files / routes

- `app/api/vault/experiences/[id]/purchase/route.ts`
- `app/api/vault/experiences/[id]/route.ts` (GET payload)
- `app/api/vault/experiences/route.ts` (list)
- `lib/vault-server.ts`, `lib/vault.ts`
- `components/vault/VaultExperienceDetail.tsx`, `VaultExperienceCard.tsx`
- `app/interview-vault/[id]/page.tsx`
- `supabase/migrations/20260602140000_vault_experiences.sql` (historical; do not edit)
- New P0 migration for purchase status + tighter INSERT policy

### Current behavior

1. Client POST purchase → insert row `{ experience_id, buyer_id, amount_inr }` → `{ ok: true }`.
2. `userHasPurchased` = row exists.
3. `unlocked = is_owner || purchased`.
4. Full content is returned either way.
5. Frontend sets `unlocked` whenever `data.ok`.

### Intended secure behavior

Separate three states:

| State | Meaning |
|-------|---------|
| Purchase intent | Authenticated buyer may record a **pending** row. Does not unlock paid content. |
| Verified payment | `payment_status = 'verified'` with a provider reference. **No provider is implemented in this change.** Nothing in-app promotes paid rows to verified. |
| Content entitlement | Owner, **or** free listing (`price_inr = 0`), **or** a **verified** purchase. |

Server rules:

- Free content (`price_inr <= 0`): entitled without payment. Preserve this.
- Paid content: POST purchase inserts `payment_status = 'pending'` only. Response `unlocked: false`. Do not pretend payment succeeded.
- RLS: clients may INSERT only `payment_status = 'pending'` for themselves. They cannot INSERT `verified`.
- GET/SSR: if not entitled, omit `questions_html`, `tips_html`, `rounds_data`, and `full_content`. Return preview text only.
- Marketplace list: compute preview server-side; do not send full HTML fields.
- Reviews require entitlement (verified purchase or free listing), not a pending row.

### Migration required

Yes, in the same P0 migration:

```text
vault_purchases.payment_status  text not null default 'pending'
  check (payment_status in ('pending', 'verified', 'failed'))
vault_purchases.payment_provider  text
vault_purchases.payment_reference text
```

Existing purchase rows default to `pending` (they were never payment-verified). That revokes unpaid unlocks. Data is not deleted.

Replace `vault_purchases_insert_own` with an intent-only INSERT policy (`buyer_id = auth.uid()` AND `payment_status = 'pending'`).

Do not weaken other Vault RLS.

### Frontend changes required

- Unlock only when the server returns `unlocked: true`.
- Pending paid purchase: keep the lock and show that payment verification is required (no new checkout UI, no pricing change).
- Locked view must not render leaked HTML (there will be none).
- Cards use server `preview`.

### Tests required

9. Unpaid / pending purchase is not entitled to paid content.
10. Verified entitlement (and free listings, and owners) can access paid/full content.
    Plus: redacted payload contains no question/tip HTML.

### Rollback considerations

- Dropping `payment_status` would require a new migration; do not edit this one after deploy.
- Restoring “insert row = unlock” re-opens free unlocks.
- After apply, previously “purchased” unpaid users lose paid access until a real verifier exists. That is intended.

---

## General API rules (every modified route)

- Authenticate server-side.
- Validate input with existing Zod helpers.
- Use session identity; never trust client user ids.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`.
- Return generic public errors (`publicErrorResponse` / equivalent). Log route + error name only — no resumes, emails, tokens, keys.

## Out of scope

New features, UI redesign, pricing, model changes, FastAPI as a production dependency, GitHub repo installs, editing historical migrations, changing CI to run tests, avatar bucket privacy, implementing Stripe/Razorpay.

## Manual Supabase steps

Apply new migrations to the hosted project (`supabase db push` or Dashboard SQL). Confirm in Dashboard: Storage → `resumes` → **Private**. Policies listed in the P0 migration should be present. No anon read on `storage.objects` for `bucket_id = 'resumes'`.
