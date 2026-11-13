-- Milestone V2: current company email confirmation challenges (additive).
-- Depends on V1 tables/enums from 20261113120000_vault_evidence_labels.sql.
-- Stores hashed one-time codes and email digests only — never plaintext work emails.
-- After successful confirmation the challenge row is deleted; the durable claim
-- lives in contributor_verifications (status/method/dates only).
--
-- Apply: supabase db push / migrate (or your usual migration runner).
-- Do not run against production from agents.
--
-- Rollback (manual):
--   1) drop policy / trigger / table / function introduced below
--   2) revoke any verified current_company_email rows created via this flow if needed
--   3) remove contributor_company_email_challenges from lib/account/data-map.ts

create table if not exists public.contributor_company_email_challenges (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references auth.users (id) on delete cascade,
  -- SHA-256 hex of normalized email (lowercased trimmed). Never store plaintext.
  email_hash text not null check (char_length(email_hash) = 64),
  -- Random salt + SHA-256 hex of salt||code. Invalidate on use and on resend.
  code_salt text not null check (char_length(code_salt) >= 16),
  code_hash text not null check (char_length(code_hash) = 64),
  expires_at timestamptz not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts > 0),
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.contributor_company_email_challenges is
  'Pending one-time codes for company-email confirmation. Hashes and attempt metadata only — never plaintext email or code.';

comment on column public.contributor_company_email_challenges.email_hash is
  'Digest of the work email used for this challenge. Used to match confirm/resend without retaining the address after verification.';

comment on column public.contributor_company_email_challenges.code_hash is
  'Salted hash of the one-time code. Cleared by deleting the row on success, expiry sweep, or resend.';

-- One active (unconsumed) challenge per contributor.
create unique index if not exists ux_company_email_challenge_active_contributor
  on public.contributor_company_email_challenges (contributor_id)
  where consumed_at is null;

create index if not exists ix_company_email_challenges_contributor
  on public.contributor_company_email_challenges (contributor_id, created_at desc);

create index if not exists ix_company_email_challenges_expires
  on public.contributor_company_email_challenges (expires_at)
  where consumed_at is null;

create or replace function public.set_company_email_challenges_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists company_email_challenges_updated_at on public.contributor_company_email_challenges;
create trigger company_email_challenges_updated_at
  before update on public.contributor_company_email_challenges
  for each row
  execute function public.set_company_email_challenges_updated_at();

-- RLS: owners can read their own challenge metadata; clients cannot insert/update/delete.
alter table public.contributor_company_email_challenges enable row level security;

drop policy if exists company_email_challenges_select_own on public.contributor_company_email_challenges;
create policy company_email_challenges_select_own
  on public.contributor_company_email_challenges for select
  to authenticated
  using (auth.uid() = contributor_id);

-- No authenticated INSERT / UPDATE / DELETE — service role only.

grant select on public.contributor_company_email_challenges to authenticated;
