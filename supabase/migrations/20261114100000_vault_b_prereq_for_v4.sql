-- Milestone V4 prerequisite: Interview Vault freshness + guide reports (Milestone B subset).
-- Additive and idempotent. Safe when Milestone B already applied.
-- Does NOT include prep-pack tables (Milestone A).
-- Do not run against production from this agent environment.
--
-- Apply: supabase db push OR paste into Supabase SQL Editor
--
-- Rollback (destructive to new columns/table only; skip drops if B owns them):
--   drop policy if exists vault_guide_reports_insert_own on public.vault_guide_reports;
--   drop policy if exists vault_guide_reports_select_own on public.vault_guide_reports;
--   drop table if exists public.vault_guide_reports;
--   -- enum types left in place (Postgres cannot easily drop used values)
--   alter table public.vault_experiences
--     drop column if exists skills,
--     drop column if exists interview_round,
--     drop column if exists content_confirmed_at,
--     drop column if exists attestation_accepted_at,
--     drop column if exists attestation_version,
--     drop column if exists removed_at;

alter table public.vault_experiences
  add column if not exists skills text[] not null default '{}'::text[];

alter table public.vault_experiences
  add column if not exists interview_round text;

alter table public.vault_experiences
  add column if not exists content_confirmed_at timestamptz;

alter table public.vault_experiences
  add column if not exists attestation_accepted_at timestamptz;

alter table public.vault_experiences
  add column if not exists attestation_version text;

alter table public.vault_experiences
  add column if not exists removed_at timestamptz;

comment on column public.vault_experiences.interview_round is
  'Primary interview round label (e.g. Phone screen, System design).';
comment on column public.vault_experiences.content_confirmed_at is
  'When the contributor last confirmed the guide content is still accurate. Display as last confirmed — never as verified.';
comment on column public.vault_experiences.removed_at is
  'Set when moderation removes the guide from marketplace browse. Purchaser access policy is an open product decision.';

alter table public.vault_experiences drop constraint if exists vault_experiences_interview_round_len;
alter table public.vault_experiences
  add constraint vault_experiences_interview_round_len
  check (interview_round is null or char_length(interview_round) <= 120);

alter table public.vault_experiences drop constraint if exists vault_experiences_attestation_version_len;
alter table public.vault_experiences
  add constraint vault_experiences_attestation_version_len
  check (attestation_version is null or char_length(attestation_version) <= 80);

alter table public.vault_experiences drop constraint if exists vault_experiences_skills_len;
alter table public.vault_experiences
  add constraint vault_experiences_skills_len
  check (cardinality(skills) <= 40);

update public.vault_experiences
set content_confirmed_at = coalesce(content_confirmed_at, published_at, updated_at, created_at)
where content_confirmed_at is null
  and status = 'published';

update public.vault_experiences
set interview_round = nullif(trim(rounds_data->0->>'name'), '')
where interview_round is null
  and jsonb_typeof(rounds_data) = 'array'
  and jsonb_array_length(rounds_data) > 0
  and coalesce(rounds_data->0->>'name', '') <> '';

create index if not exists ix_vault_experiences_published_not_removed
  on public.vault_experiences (status, published_at desc nulls last)
  where status = 'published' and removed_at is null;

create index if not exists ix_vault_experiences_interview_round
  on public.vault_experiences (lower(interview_round))
  where status = 'published' and removed_at is null and interview_round is not null;

create index if not exists ix_vault_experiences_content_confirmed
  on public.vault_experiences (content_confirmed_at desc nulls last)
  where status = 'published' and removed_at is null;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'vault_guide_report_reason') then
    create type public.vault_guide_report_reason as enum (
      'inaccurate_or_outdated',
      'confidential_or_personal',
      'copied_from_third_party',
      'spam_or_abuse',
      'other',
      'inaccessible_after_purchase',
      'materially_misrepresented'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'vault_guide_report_status') then
    create type public.vault_guide_report_status as enum (
      'open',
      'under_review',
      'removed',
      'dismissed'
    );
  end if;
end $$;

create table if not exists public.vault_guide_reports (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.vault_experiences (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason public.vault_guide_report_reason not null,
  details text,
  status public.vault_guide_report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  constraint vault_guide_reports_details_len check (
    details is null or char_length(details) <= 2000
  )
);

create index if not exists ix_vault_guide_reports_experience
  on public.vault_guide_reports (experience_id, created_at desc);

create index if not exists ix_vault_guide_reports_status
  on public.vault_guide_reports (status, created_at desc);

create index if not exists ix_vault_guide_reports_reporter
  on public.vault_guide_reports (reporter_id, created_at desc);

comment on table public.vault_guide_reports is
  'Signed-in reports about Interview Vault guides. Reporters read only their own rows. Admin status updates go through service role / server routes.';

alter table public.vault_guide_reports enable row level security;

revoke all on table public.vault_guide_reports from public, anon;

drop policy if exists vault_guide_reports_insert_own on public.vault_guide_reports;
create policy vault_guide_reports_insert_own
  on public.vault_guide_reports for insert
  to authenticated
  with check (
    auth.uid() = reporter_id
    and status = 'open'
  );

drop policy if exists vault_guide_reports_select_own on public.vault_guide_reports;
create policy vault_guide_reports_select_own
  on public.vault_guide_reports for select
  to authenticated
  using (auth.uid() = reporter_id);

grant select, insert on table public.vault_guide_reports to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on table public.vault_guide_reports to service_role;
  end if;
end $$;

alter table public.product_events drop constraint if exists product_events_event_check;
alter table public.product_events
  add constraint product_events_event_check
  check (event in (
    'signup',
    'resume_uploaded',
    'match_viewed',
    'tailoring_run',
    'cover_letter',
    'pass_checkout_started',
    'pass_purchased',
    'vault_purchased',
    'digest_sent',
    'digest_unsubscribed',
    'application_added',
    'follow_up_marked',
    'vault_report_submitted',
    'vault_refund_requested',
    'vault_review_reported'
  ));
