# Interview Vault Milestone B Implementation Plan

> **For agentic workers:** Implemented inline in the Milestone B cloud agent run (branch `cursor/vault-milestone-b-relevance-trust-80c5`), stacked on Milestone A prep-pack.

**Goal:** Relevance and trust for Interview Vault: structured fields, freshness, attestation, reporting/removal, Vault filters — without weakening paid unlock entitlement.

**Architecture:** Additive Supabase migration + pure helpers in `lib/vault/*`, server mutations in `lib/vault-server.ts`, prep-pack matching continues to return metadata-only projections via `projectPublicVaultGuide`.

**Tech Stack:** Next.js App Router, Supabase RLS, Zod, existing `checkRateLimit`, `ADMIN_EMAILS`.

## Global Constraints

- No word “verified” in new product copy.
- No evidence labels / refunds / public sharing.
- Preserve `hasVaultEntitlement` / pending ≠ unlocked.
- Attestation legal text is placeholder marked NEEDS COUNSEL REVIEW.
- Anonymous reporting not allowed.
