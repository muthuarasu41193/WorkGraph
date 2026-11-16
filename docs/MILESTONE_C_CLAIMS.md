# Milestone C — copy claims changed or flagged

Compared with live marketing strings and unmounted section copy. V1 evidence labels are **not** used because PR #49 is not merged.

| Claim / string | Where | Change |
| --- | --- | --- |
| Hero “Search the live index” as sole H1 | `app/(marketing)/page.tsx` | H1 is now “Interview prep first”; index search is secondary with explicit note that last-checked is not stored. |
| Primary CTA “Get early access” / signup | `components/layout/Navbar.tsx`, `components/landing/LandingNav.tsx` | Primary CTA → “Build a prep pack” (`/prep-pack`). |
| Nav order Features → How it works → Vault | `lib/constants.ts` `NAV_ITEMS` | Prep pack → Interview Vault → Jobs → Pricing → Contact. |
| Footer product links | `lib/constants.ts` `FOOTER_LINKS` | Prep pack and Vault lead; Jobs remains. |
| `HERO` / `FEATURES` / `STEPS` / `CTA` overclaims (LinkedIn-only jobs, sell/earn, win) | `lib/constants.ts` | Rewritten to prep-first, estimate language, no income promise. |
| “Earn $$$” / “earn every time” / “passive income” | `components/sections/Features.tsx`, `HowItWorks.tsx` | Removed income promises; guides do not guarantee offers. |
| “50+ sources”, “SLA guarantee”, money-back FAQ | `components/sections/Pricing.tsx` | Replaced with index/search language and non-invented refund note. |
| “Verified” unqualified on guides | Public share + role pages | Not used. Milestone V1 label chips omitted until V1 merges. |
| Last checked dates on job cards | Schema + UI | **Absent** in Supabase `jobs`. Documented on `/trust#last-checked`. Posted date + apply URL remain. |
| Role acquisition pages with no guides | `/roles/[roleId]` | Empty → noindex; sitemap only includes roles with published guides. |

## Flagged for owner / counsel (not asserted as product promises)

- Any future seller payout percentage or “keep N%” copy (Pricing FAQ previously claimed 80%).
- Whether publishing a guide constitutes a marketplace contract (terms already separate).
- Milestone V1 evidence label buyer text and disclaimer (`lib/vault-evidence-labels.ts` on PR #49) — NEEDS COUNSEL REVIEW when merged.
- Shared prep packs are derived estimates only; they must not be marketed as offer predictors.
