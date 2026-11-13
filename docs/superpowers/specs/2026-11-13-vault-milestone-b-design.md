# Milestone B: Interview Vault relevance and trust — design

**Status:** Implementation design for the scoped product milestone (this document records decisions; product copy marked NEEDS COUNSEL REVIEW is placeholder).

**Depends on:** Milestone A (`prep-pack` matching via `lib/prep-pack/*`, PR #46).

## What changes

1. **Organization** — Expose `role`, `company`, `skills[]`, and `interview_round` as filterable fields. Reuse existing `company`/`role`. Add additive columns `skills text[]` and `interview_round text` with empty/null defaults so existing rows keep working.
2. **Freshness** — Add `content_confirmed_at timestamptz` (backfill from `coalesce(published_at, updated_at)`). Show “Last updated” / “Last confirmed” and a stale indicator using `VAULT_STALE_AFTER_DAYS` (180). Contributor owner-only “Mark guide as current” sets `content_confirmed_at = now()`. Copy never uses the word “verified”.
3. **Attestation** — On publish, require attestation acceptance. Store `attestation_accepted_at` + `attestation_version`. Placeholder legal text marked **NEEDS COUNSEL REVIEW**.
4. **Reporting** — Signed-in-only reports (`vault_guide_reports`) with extensible reason enum, optional details, rate limit via existing `checkRateLimit`. Reporter SELECT own rows only. Admin (`ADMIN_EMAILS`) can set report status `open | under_review | removed | dismissed`. Setting `removed` stamps `vault_experiences.removed_at` so the guide leaves marketplace + prep-pack matches.
5. **Vault UI** — Filters for role/company/round; sort relevance | freshness; empty/error states; report CTA; freshness on cards/detail/prep-pack matches.

## What does not change

- Payment / unlock / entitlement rules (`hasVaultEntitlement`, pending ≠ unlocked).
- Evidence labels, email confirmation, evidence uploads, reviews UX changes, refunds (V1–V4).
- Public sharing of prep packs.
- Self-hosted FastAPI.

## Entitlement invariant

Routes touched (GET experience, list marketplace, prep-pack guide select, report, confirm, admin) must never return `questions_html`, `tips_html`, or `rounds_data` content to non-entitled viewers. Prep-pack matches continue to return metadata only (plus freshness fields).

## Removed guides × purchasers (open decision)

**Implemented interim:** removed guides are excluded from marketplace list and prep-pack matching. Direct GET by ID still applies entitlement: entitled purchasers and the seller can open content; others get 404 as if unpublished. **Refunds / whether purchasers lose access permanently is an open product/legal decision — not decided here.**

## Anonymous reporting

**Not allowed.** Reports require a signed-in user so RLS can scope rows, rate limits can key on `user.id`, and abuse can be moderated. Anonymous reports would need a separate abuse model (IP-only) and are out of scope.

## Approaches considered

| Approach | Trade-off |
|----------|-----------|
| A. Soft-delete via `removed_at` (chosen) | Additive; preserves purchase FK; clear list filters |
| B. New `status = removed` enum value | Needs enum alter; conflates seller archive vs moderation |
| C. Hide only via report join | Complex queries; slower; harder for prep-pack |

## Stack

Next.js App Router, Supabase RLS, existing Zod validation, `checkRateLimit`, `ADMIN_EMAILS` / `isAdminEmail`.
