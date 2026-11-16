# Milestone D — Monetization readiness

**Date:** 16 November 2026 (Asia/Calcutta)  
**Status:** Inspect-first hardening. Paid Interview Vault checkout is **not** live.

## Step 1 findings (verified from code)

| Surface | Provider | Server-verified payment? | Notes |
|---------|----------|--------------------------|-------|
| WorkGraph Pass | Razorpay (`lib/billing/*`) | Yes — verify signature + webhook → `grantPass` | Working pattern; leave intact |
| Vault guide unlock | **None** | **No** path sets `vault_purchases.payment_status = verified` | Paid `purchaseExperience` inserts `pending` then returns **402** |
| Vault earnings (before this milestone) | N/A | Counted **all** purchase rows | Inflated by unpaid intents |
| Vault withdrawal | None | Stub claimed “submitted” with no DB write | Misleading |
| Refunds (V4) | Manual on PR #52 only | Request recording only | Not on `main`; no provider execution |
| Prep packs | N/A on `main` | Not monetized | Events reserved for A/C merge |

**Entitlements without real payment:** free listings and guide owners only (`hasVaultEntitlement`). Pending rows do **not** unlock content in the app. Operators with `service_role` could set `verified` manually.

## What this milestone changed

1. Seller earnings and sales aggregates use **`payment_status = verified` only**.
2. `sales_count` trigger increments only on verified insert/transition; existing counts reconciled.
3. Fee breakdown helper (`lib/vault/earnings.ts`) with configurable **25% planning** rate; USD display on seller dashboard.
4. Withdrawal CTA is honest: **503 / payouts unavailable** (no fake submission).
5. Validation events added; vault emitters wired on guide view + earnings load.
6. Pure grant decision tests for replay / forged confirmation / price mismatch.

## What is still blocked (needs a product decision)

To wire paid vault unlock + automated refunds you must provide:

1. **Payment account decision:** reuse Razorpay (like Pass) vs another provider.
2. **Credentials:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, webhook secret (or equivalent) scoped for vault orders.
3. **Fee / payout policy:** confirm or replace the 25% planning fee; who pays refunds; payout schedule and KYC.
4. **Counsel review** of fee, refund, and payout language (see below).

Until then: **do not** claim vault payments work; leave refunds manual (V4).

## Event schema (IDs / categories only)

Server-only via `recordEvent` → `product_events`. Props are small enums/numbers; PII keys rejected by `validateEventProps`.

| Event | When | Allowed props (examples) |
|-------|------|---------------------------|
| `prep_pack_started` | Prep pack session begins (emitter when A/C lands) | `pack_id`, `category` |
| `prep_pack_completed` | Prep pack finished (emitter when A/C lands) | `pack_id`, `category` |
| `vault_guide_clicked` | Published guide view | `guide_id` (hyphenless), `category` |
| `vault_purchased` | Free unlock granted (paid path not live) | `guide_id`, `amount_inr`, `free` |
| `vault_return_visit` | Auth viewer with prior purchase or prior views | `guide_id`, `category` |
| `vault_guide_freshness` | On guide view | `guide_id`, `age_bucket` (`fresh_30d` \| `aging_90d` \| `stale_180d` \| `stale_365d` \| `unknown`) |
| `vault_contributor_earnings` | Seller dashboard load | `category`, `gross_inr`, `fee_inr`, `net_inr`, `fee_bps`, `sales_count` |

**Never** put JD text, resumes, emails, phones, names, or guide body HTML in props.

## Step 5 — Recommended smallest paid prep features (do not build yet)

Existing Pass / quota system (`lib/subscription/*`, `PAID_FEATURES`, `canUse`, `feature_usage`) already gates cover letters and tailoring. Smallest add-ons that fit without new billing:

1. **Extra prep-pack generations / month** for Pass holders (mirror `cover_letter` monthly cap via `canUse` + `recordUsage`) once prep packs exist on `main`.
2. **Higher Interview Vault browse filters / saved-guide limit** for Pass (storage already user-scoped; add a numeric free cap).
3. **Priority freshness badge** on Pass (display-only; uses existing `interview_date`) — no new AI spend.

Do **not** invent a second subscription SKU until Pass conversion is measured.

## Step 6 — Privacy / legal statements needing counsel review

Do **not** edit live legal copy in this milestone. Review needed for:

| Location | Topic |
|----------|--------|
| `app/legal/terms/page.tsx` § payments-and-refunds | `TODO(founder)` refund policy; Pass vs Vault |
| `app/legal/terms/page.tsx` § Interview Vault marketplace | “Payouts, refunds, and revenue share will be described in-product” — still incomplete |
| `app/legal/privacy/page.tsx` | Razorpay named for Pass only; Vault payments if/when added |
| `components/marketing/SeekerPricing.tsx` | Unused-days refund marketing language |
| `components/sections/Pricing.tsx` | FAQ “What’s your refund policy?” |
| `lib/vault/earnings.ts` fee rate | 25% planning assumption — not final policy |
| V4 `VAULT_REFUND_POLICY_PLACEHOLDER` (PR #52) | Manual refunds; who bears cost undecided |
| Seller dashboard / withdrawal UX | Must not imply guaranteed payouts or passive income |

## Migration

**File:** `supabase/migrations/20261116140000_monetization_readiness.sql`

**Apply (staging / local only — agents must not run against production):**

```bash
# Example — use your non-production DATABASE_URL
psql "$DATABASE_URL" -f supabase/migrations/20261116140000_monetization_readiness.sql
```

**Rollback:**

1. Restore `increment_vault_sales_count` + insert-only trigger from `20260602140000_vault_experiences.sql`.
2. Recreate `product_events_event_check` with the allow-list from `20261103210000_product_events.sql`.
3. `sales_count` recomputation to verified-only may remain (safer).
