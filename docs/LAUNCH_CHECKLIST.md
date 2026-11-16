# WorkGraph launch checklist

Founder-facing checklist before charging customers on `https://getworkgraph.com`.
Keep decisions in this file (or link out). Do not put secrets here.

## 1. Payments (Razorpay)

- [ ] Create a **live** Razorpay account and generate live API keys  
  (Dashboard → Account & Settings → API Keys).
- [ ] Set on Vercel **Production** (server-only, never `NEXT_PUBLIC_*`):
  - `RAZORPAY_KEY_ID` — live key id from the Razorpay dashboard
  - `RAZORPAY_KEY_SECRET` — live key secret from the same screen
  - `RAZORPAY_WEBHOOK_SECRET` — secret you choose when creating the webhook
- [ ] Webhook URL (live mode):  
  `https://getworkgraph.com/api/billing/razorpay/webhook`  
  Subscribe at least to `payment.captured` and `order.paid`.
- [ ] Confirm Preview still uses **test** keys; Production uses **live** keys only after a Preview payment succeeds.
- [ ] Fill the refund policy TODO in `app/legal/terms/page.tsx` (`payments-and-refunds`) before the first live charge.
- [ ] Note the GST decision (inclusive / exclusive / not registered yet) in `lib/billing/plans.ts` (`PASS_TAX_WORDING_TODO`) and on `/pricing`.

## 2. Vercel plan

- [ ] Hobby is **non-commercial**. Upgrade to **Pro** (or higher) before taking payments or running a commercial product.
- [ ] Confirm Production domain, env vars, and cron (`vercel.json` → `/api/sync-community-jobs`).

## 3. Environment variables (all prompts)

Set in **Vercel → Project → Settings → Environment Variables**. Never commit values.

| Variable | Where to get it | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same → service_role | Server only |
| `GROQ_API_KEY` | console.groq.com | AI parse / ATS / TI / cover / tailoring |
| `NEXT_PUBLIC_SITE_URL` | Fixed production origin | `https://getworkgraph.com` |
| `NEXT_PUBLIC_APP_URL` | Same origin (or preview URL locally) | Email and app links |
| `RESEND_API_KEY` | resend.com → API Keys | Transactional email |
| `WORKGRAPH_EMAIL_FROM` | Resend verified domain sender | e.g. `WorkGraph <hello@yourdomain>` |
| `CRON_SECRET` | Long random secret you generate | Authorizes Vercel cron |
| `COMMUNITY_JOBS_ADMIN_EMAILS` | Your email(s) | Manual community sync |
| `EMPLOYER_ADMIN_SECRET` | Long random secret you generate | Employer verify approve/reject |
| `RAZORPAY_KEY_ID` | Razorpay dashboard | Server only |
| `RAZORPAY_KEY_SECRET` | Razorpay dashboard | Server only |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook config | Server only |
| `ADMIN_EMAILS` | Founder email(s), comma-separated | Gates `/admin/metrics` |
| `INGEST_PRUNE_MISSING` | Founder decision (`true` / unset) | See §6 |
| `GITHUB_TOKEN` (optional) | GitHub PAT | Higher Hidden Jobs GitHub rate limits |

Leave `WORKGRAPH_API_URL` / `NEXT_PUBLIC_WORKGRAPH_API_URL` **unset** in production.

## 4. Supabase migrations

Nothing in CI applies SQL. For each new file under `supabase/migrations/`, run it in  
**Supabase Dashboard → SQL Editor** (production project), newest last.

Required for launch (if not already applied), including:

- [ ] `…_payments.sql` — WorkGraph Pass rows
- [ ] `…_job_alerts.sql` — saved alerts
- [ ] `20261103210000_product_events.sql` — founder metrics events  
  (RLS on, no client policies; service role only)

Confirm `lib/account/data-map.ts` lists every user-owned table (including `product_events`).

## 5. Email (Resend)

- [ ] Verify the sending domain in Resend (DNS: SPF / DKIM / optional DMARC).
- [ ] Set `WORKGRAPH_EMAIL_FROM` to an address on that domain (not `onboarding@resend.dev` in production).
- [ ] Send a test employer connection or stage-update email from a staging account.

## 6. Job ingest prune decision

`INGEST_PRUNE_MISSING` (job aggregator / GitHub Actions ingest): when enabled, Greenhouse / Lever / Ashby URLs missing from a full board fetch are pruned as stale. Adzuna rows are not pruned by this flag.

Founder decision (pick one and note the date):

- [ ] **Enable** (`INGEST_PRUNE_MISSING=true`) — prefer a fresher catalog; accept occasional false removals if a board fetch is partial.
- [ ] **Leave unset / false** — keep listings until another process removes them; catalog may show more stale posts.

Decision: __________________ Date: __________

## 7. Legal and tax

- [ ] Refund policy filled in (`/legal/terms` → Payments and refunds).
- [ ] GST / tax wording decided and reflected on pricing and Pass checkout copy.
- [ ] Privacy policy still matches account export / delete and first-party metrics (no third-party analytics SDKs).

## 8. Founder metrics

- [ ] `ADMIN_EMAILS` set to your login email(s).
- [ ] `product_events` migration applied.
- [ ] Open `https://getworkgraph.com/admin/metrics` while signed in as an admin email — funnel and ₹ revenue load.
- [ ] Open the same URL while signed out or as a non-admin — must be **404**, not a soft deny.
- [ ] Page is **not** linked from public navigation.

## 9. Manual test script — paid flows

Use a real browser on the Vercel **Preview** URL first (test Razorpay keys), then repeat on Production with live keys only after Preview passes.

### A. WorkGraph Pass (Razorpay)

1. Sign in as a free user.
2. Open `/pricing` → start Pass checkout.
3. Complete payment with a Razorpay test card (Preview) or a small live charge (Production).
4. Confirm: profile shows an active Pass; `/admin/metrics` shows `pass_checkout_started` and `pass_purchased`; `payments` row is `paid`.
5. Trigger the webhook (or wait for Razorpay) and confirm a second verify call does **not** double-extend days.
6. (Optional) Request a refund in Razorpay and note the outcome against your published refund policy.

### B. Interview Vault purchase

1. Publish a free guide and a paid guide (seller account).
2. As a buyer, unlock the free guide — content unlocks; metrics may show `vault_purchased` with `free`.
3. As a buyer, attempt the paid guide — expect payment-required until Vault live checkout is wired; do not claim a paid Vault unlock works until that path exists.

### C. Entitled product usage after Pass

1. With an active Pass, run cover-letter generate and job tailoring once each.
2. Confirm success responses and that `/admin/metrics` increments `cover_letter` and `tailoring_run`.
3. Turn an alert frequency to **off** and confirm `digest_unsubscribed` increments (digest email cron may still be separate).

### D. Account safety

1. Settings → Your data → Download my data — JSON downloads without error.
2. On a disposable test account only: Delete my account — user cannot sign in; `product_events.user_id` for that account is null (anonymised).

## 10. Sign-off

| Check | Owner | Date |
|---|---|---|
| Razorpay live + webhook | | |
| Vercel Pro (commercial) | | |
| Env vars complete | | |
| Migrations applied | | |
| Refund + GST noted | | |
| Resend domain verified | | |
| INGEST_PRUNE_MISSING decision | | |
| Paid flows tested | | |
| `/admin/metrics` works for founder only | | |
