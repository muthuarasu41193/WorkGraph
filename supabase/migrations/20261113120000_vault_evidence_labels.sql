-- Milestone V1: Interview Vault evidence labels (additive).
-- Safe to run against empty or existing vault data. Does not drop user data.
-- Does not store evidence contents, work emails, or reviewer notes.
--
-- Apply: supabase db push / migrate (or your usual migration runner).
-- Rollback notes (manual; do not run against production from agents):
--   1) drop policy / table / types introduced below
--   2) drop check constraint additions on vault_result usage are enum values —
--      Postgres cannot easily remove enum values; leave no_outcome / prefer_not_to_say unused
--   3) remove contributor_verifications from account export/delete map in app code
-- Existing guides remain valid: derivation defaults to not_independently_verified.

-- ---------------------------------------------------------------------------
-- Self-reported outcome: extend existing vault_result enum additively
-- ---------------------------------------------------------------------------

alter type public.vault_result add value if not exists 'no_outcome';
alter type public.vault_result add value if not exists 'prefer_not_to_say';

comment on type public.vault_result is
  'Self-reported interview outcome on vault guides. Not independently confirmed.';

-- ---------------------------------------------------------------------------
-- Contributor verification records (status/method/dates only — no evidence)
-- ---------------------------------------------------------------------------

create type public.contributor_verification_claim_type as enum (
  'current_company_email',
  'past_employment_reviewed',
  'interview_evidence_reviewed'
);

create type public.contributor_verification_status as enum (
  'pending',
  'verified',
  'rejected',
  'revoked'
);

create type public.contributor_verification_method as enum (
  'company_email_challenge',
  'manual_review',
  'authorized_provider'
);

create table if not exists public.contributor_verifications (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references auth.users (id) on delete cascade,
  -- Null = contributor-scoped claim; set for guide-scoped claims (e.g. interview evidence).
  experience_id uuid references public.vault_experiences (id) on delete cascade,
  claim_type public.contributor_verification_claim_type not null,
  status public.contributor_verification_status not null default 'pending',
  method public.contributor_verification_method,
  verified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.contributor_verifications is
  'Evidence claim status for Interview Vault contributors. Stores status, method, and dates only — never evidence contents or email addresses.';

comment on column public.contributor_verifications.method is
  'How the claim was assessed (code only). Never store evidence payloads or contact details.';

comment on column public.contributor_verifications.verified_at is
  'When status became verified. Display dates may use this; expiry uses expires_at.';

create unique index if not exists ux_contributor_verifications_contributor_claim
  on public.contributor_verifications (contributor_id, claim_type)
  where experience_id is null;

create unique index if not exists ux_contributor_verifications_guide_claim
  on public.contributor_verifications (contributor_id, experience_id, claim_type)
  where experience_id is not null;

create index if not exists ix_contributor_verifications_contributor
  on public.contributor_verifications (contributor_id, status);

create index if not exists ix_contributor_verifications_experience
  on public.contributor_verifications (experience_id)
  where experience_id is not null;

-- Audit trail: actor, action, claim type, timestamp, outcome only.
create table if not exists public.contributor_verification_audit (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references auth.users (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  verification_id uuid references public.contributor_verifications (id) on delete set null,
  claim_type public.contributor_verification_claim_type not null,
  action text not null check (action in ('created', 'status_changed', 'expired', 'revoked')),
  outcome public.contributor_verification_status not null,
  created_at timestamptz not null default now()
);

comment on table public.contributor_verification_audit is
  'Audit of verification claim changes. Actor, action, claim type, timestamp, outcome only — never evidence contents or personal data.';

create index if not exists ix_contributor_verification_audit_contributor
  on public.contributor_verification_audit (contributor_id, created_at desc);

create or replace function public.set_contributor_verifications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contributor_verifications_updated_at on public.contributor_verifications;
create trigger contributor_verifications_updated_at
  before update on public.contributor_verifications
  for each row
  execute function public.set_contributor_verifications_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: owners can read their own rows; clients cannot insert or upgrade status
-- ---------------------------------------------------------------------------

alter table public.contributor_verifications enable row level security;
alter table public.contributor_verification_audit enable row level security;

drop policy if exists contributor_verifications_select_own on public.contributor_verifications;
create policy contributor_verifications_select_own
  on public.contributor_verifications for select
  to authenticated
  using (auth.uid() = contributor_id);

-- No authenticated INSERT / UPDATE / DELETE policies:
-- verified status is never client-writable (same pattern as vault_purchases payment_status).

drop policy if exists contributor_verification_audit_select_own on public.contributor_verification_audit;
create policy contributor_verification_audit_select_own
  on public.contributor_verification_audit for select
  to authenticated
  using (auth.uid() = contributor_id);

-- No authenticated INSERT / UPDATE / DELETE on audit.

grant select on public.contributor_verifications to authenticated;
grant select on public.contributor_verification_audit to authenticated;
-- Writes require service role (bypasses RLS). App routes must never accept client status upgrades.
