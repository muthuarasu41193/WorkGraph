# P0 Security Hardening Report

**Date:** 19 August 2026  
**Scope:** Eliminate the audit P0 vulnerabilities only. No new features, no stack migration, no payment-provider implementation.  
**Plan:** [`docs/P0_SECURITY_HARDENING_PLAN.md`](./P0_SECURITY_HARDENING_PLAN.md)

---

## Vulnerabilities fixed

| ID | Finding | Fix |
|----|---------|-----|
| P0-1 | `resumes` Storage bucket world-readable | Bucket set private. Owner-only storage policies. Profile URLs are `/api/resume/file`. Short-lived signed URLs (60s). Employer access only via authenticated `?connectionId=` after signal ownership check. |
| P0-2 | ATS routes accepted client `user_id` (IDOR) | Session identity only (`resolveAuthenticatedUserId`). Client `user_id` ignored. Profile load/write uses the session user. Unauthenticated → 401. Callers no longer send `user_id`. |
| P0-3 | `/api/resume/analyze` unauthenticated Groq sink | Session required (already present; locked in with logging + tests). Unauthenticated → 401. Existing 4 MB / type validation kept. |
| P0-4 | `/api/v2/match-jobs` unauthenticated FastAPI forward | Session required first. Client user id and `resume_text` ignored. Resume text loaded from the authenticated user’s profile. 503 preserved when `WORKGRAPH_API_URL` is unset. Keyword ranking (`lib/job-match.ts`) unchanged. |
| P0-5 | Vault purchase row = unpaid unlock; full HTML leaked to locked clients | Intent (`pending`) vs verified payment vs entitlement. Paid unlock requires `payment_status = 'verified'`. No provider is implemented, so paid listings cannot be unlocked by a client POST. Free listings (`price_inr <= 0`) remain accessible. Full HTML omitted unless entitled. RLS insert is intent-only. |

---

## Files changed

### New

- `docs/P0_SECURITY_HARDENING_PLAN.md`
- `docs/P0_SECURITY_HARDENING_REPORT.md`
- `supabase/migrations/20260819100000_p0_security_hardening.sql`
- `lib/security/session-identity.ts`
- `lib/security/resume-access.ts`
- `lib/security/vault-entitlement.ts`
- `lib/security/log.ts`
- `lib/security/__tests__/p0-security.test.ts`

### API routes

- `app/api/resume/file/route.ts` — owner + employer-authorized signed URL
- `app/api/ats-score/route.ts`
- `app/api/v2/ats-score/route.ts`
- `app/api/resume/analyze/route.ts`
- `app/api/v2/match-jobs/route.ts`
- `app/api/vault/experiences/[id]/purchase/route.ts`
- `app/api/vault/experiences/[id]/route.ts`
- `app/api/vault/experiences/route.ts`

### Libraries / validation

- `lib/vault.ts`
- `lib/vault-server.ts`
- `lib/validation/resume.ts`
- `lib/resume-intelligence/schema.ts`
- `lib/resume-intelligence/persist.ts`
- `package.json` (`test` glob includes `lib/security/__tests__`)

### Frontend (minimal, required for the fixes)

- `components/profile/ATSScoreCard.tsx` — stop sending `user_id`
- `components/resume/ResumeUploader.tsx` — stop sending `user_id`
- `app/create-profile/page.tsx` — stop sending `user_id`
- `components/employer/PulseInbox.tsx` — connection-scoped resume href
- `components/employer/ApplicantApplicationPanel.tsx` — same
- `components/vault/VaultExperienceDetail.tsx` — unlock only if `unlocked: true`; no leaked HTML
- `components/vault/VaultExperienceCard.tsx` — server `preview` only

Historical migrations were **not** edited.

---

## Migrations created

**`supabase/migrations/20260819100000_p0_security_hardening.sql`**

Idempotent. Does not drop user rows or files.

1. `storage.buckets` `resumes.public = false`
2. Drop `resumes_read_public`
3. Recreate owner SELECT / INSERT / DELETE on `storage.objects` for `resumes` (`folder[1] = auth.uid()`)
4. Rewrite leftover `profiles.resume_url` values containing `/object/public/resumes/` to `/api/resume/file` and backfill `resume_storage_path` when parseable
5. Add `vault_purchases.payment_status` (`pending` \| `verified` \| `failed`, default `pending`), `payment_provider`, `payment_reference`
6. Existing purchase rows remain, with `payment_status = pending` (they were never payment-verified)
7. Replace client INSERT policy with intent-only (`buyer_id = auth.uid()` AND `payment_status = 'pending'`). No authenticated UPDATE on purchases.
8. Tighten `vault_reviews` INSERT: free listing **or** a **verified** purchase

`20260818120000_resume_intelligence_normalized.sql` (already in the working tree from prior resume-intelligence work) also privatizes the bucket. The P0 migration is independently sufficient if applied to production.

---

## Tests executed

Existing runner: `node --import tsx --test` (no new framework). CI was **not** changed.

P0 cases in `lib/security/__tests__/p0-security.test.ts`:

1. Unauthenticated ATS → 401
2. Authenticated ATS → session user only
3. Client `user_id` substitution ignored
4. Unauthenticated resume analysis → 401
5. Unauthenticated match-jobs → 401
6. Cross-user id / foreign resume text rejected
7. Public resume object URLs treated as unsafe
8. Owner path + owned storage key still valid; employer href is not public
9. Unpaid / pending purchase is not entitled to paid content; HTML redacted
10. Verified purchase, owner, and free listing are entitled

**Result:** 102 tests, 0 failed.

---

## Commands executed

```text
npm test
npm run typecheck
npm run build
```

All three succeeded (`tsc --noEmit` exit 0; Next.js 16.2.4 production build compiled).

CI (`verify-build.yml`) still runs typecheck + build only. Tests were not added to CI.

---

## Assumptions

- `price_inr <= 0` is legitimate free Vault content.
- There is no working Stripe/Razorpay checkout; this change does not add one. Paid Vault content stays locked until a **server-side** verifier sets `payment_status = 'verified'` with a payment reference.
- Previously inserted `vault_purchases` rows were not payment-verified, so they become `pending` and no longer unlock paid content.
- Keyword job ranking on the Jobs tab does not use `/api/v2/match-jobs` and is unchanged.
- SuperTokens-only sessions already did not satisfy these Supabase-backed routes; that auth split was not redesigned.
- 60-second signed URLs are short-lived enough for owner and employer downloads.
- Employer resume access is allowed only when the signed-in user is `hiring_signals.employer_id` for that `signal_connections` row.

---

## Remaining risks

- **No payment provider.** Paid Interview Vault listings cannot be legitimately purchased in-app until a verifier exists. Do not let the client write `verified`.
- **Preview snippets.** Marketplace/detail preview is still derived server-side from about 20% of stripped HTML. Full question/tip HTML is no longer sent to locked clients.
- **Historical public URLs.** After the bucket is private, raw `/object/public/resumes/…` links die. Owner and employer UIs use `/api/resume/file`. Old snapshot URLs are remapped in the employer UI via `connectionId`.
- **`resume_raw_text` in Postgres** remains (audit P1/privacy). Not in this P0 scope.
- **Avatars bucket stays public** (not resume storage).
- **FastAPI `X-User-Id`** is still not authentication if FastAPI is ever exposed on a public network. This BFF does not treat that header as login. Bind FastAPI privately in deploy (audit item, not implemented here).
- **`NEXT_PUBLIC_WORKGRAPH_API_URL`** would still let a browser call FastAPI directly if that env is set. Prefer server-only `WORKGRAPH_API_URL`.
- **Signed URL window.** Anyone who intercepts a live signed URL has ~60 seconds of access.
- **Client owner upload** to `resumes/{auth.uid()}/…` remains (needed for existing upload UX). Public read is removed.
- **Tests are policy/unit tests** of the same functions the routes call, not a full Next.js HTTP harness. Route wiring is thin.

---

## Manual Supabase dashboard configuration

Required after deploy (SQL editor or `supabase db push`):

1. Apply `20260819100000_p0_security_hardening.sql` (and `20260818120000_…` if that resume-intelligence migration is also being shipped).
2. **Storage → Buckets → `resumes` → Public = off (Private).**
3. Confirm **no** policy named `resumes_read_public` on `storage.objects`.
4. Confirm authenticated policies: `resumes_select_own`, `resumes_insert_own`, `resumes_delete_own` (first path segment = `auth.uid()`).
5. Confirm `vault_purchases.payment_status` exists and INSERT policy is `vault_purchases_insert_intent` (`payment_status = 'pending'` only).
6. Do **not** turn the resumes bucket public again to “make links work.” Use `/api/resume/file`.
7. Avatars bucket may remain public.

No new npm packages. No GitHub repositories. No FastAPI production dependency. Groq and Supabase remain the production path.
