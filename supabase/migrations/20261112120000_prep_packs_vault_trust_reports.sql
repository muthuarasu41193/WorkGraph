-- Prep packs (shareable, no JD/resume text), Vault trust metadata, content reports,
-- and prep-pack product events. Idempotent. Safe to run in the Supabase SQL Editor.
-- Legal/privacy review still required before treating retention as compliance.

-- ---------------------------------------------------------------------------
-- prep_packs: sanitized share payloads only (no pasted JD / resume / email)
-- ---------------------------------------------------------------------------
create table if not exists public.prep_packs (
  id uuid primary key default gen_random_uuid(),
  share_id text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint prep_packs_share_id_format check (char_length(share_id) between 16 and 64),
  constraint prep_packs_payload_object check (jsonb_typeof(payload) = 'object')
);

create index if not exists prep_packs_expires_at_idx on public.prep_packs (expires_at);
create index if not exists prep_packs_user_id_idx on public.prep_packs (user_id) where user_id is not null;

comment on table public.prep_packs is
  'Shareable interview prep packs. payload must not contain pasted job descriptions, resumes, or private profile fields.';
comment on column public.prep_packs.payload is
  'Sanitized pack projection: title/company/skills/checklist/guide refs only. No JD text.';

alter table public.prep_packs enable row level security;

revoke all on table public.prep_packs from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on table public.prep_packs to service_role;
  end if;
end $$;

-- Owners may read their own saved packs (optional personalization after sign-in).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'prep_packs' and policyname = 'prep_packs_select_own'
  ) then
    create policy prep_packs_select_own
      on public.prep_packs
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

grant select on table public.prep_packs to authenticated;

-- ---------------------------------------------------------------------------
-- Vault trust metadata (display-only; defaults remain unverified / self-reported)
-- ---------------------------------------------------------------------------
alter table public.vault_experiences
  add column if not exists trust_statuses text[] not null default '{}'::text[];

alter table public.vault_experiences
  add column if not exists display_name text;

comment on column public.vault_experiences.trust_statuses is
  'Honest trust labels. Empty means UI shows not independently verified (+ outcome self-reported when result is set). Never store work emails or evidence documents here.';
comment on column public.vault_experiences.display_name is
  'Optional public pseudonym for the contributor. Must not be a work email.';

-- ---------------------------------------------------------------------------
-- vault_content_reports: buyer/visitor reports for moderation review
-- ---------------------------------------------------------------------------
create table if not exists public.vault_content_reports (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.vault_experiences (id) on delete cascade,
  reporter_id uuid references auth.users (id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint vault_content_reports_reason_check check (
    reason in (
      'misleading',
      'inaccessible_after_purchase',
      'confidential_or_personal',
      'infringing',
      'other'
    )
  ),
  constraint vault_content_reports_status_check check (
    status in ('open', 'reviewing', 'resolved', 'dismissed')
  ),
  constraint vault_content_reports_details_len check (
    details is null or char_length(details) <= 2000
  )
);

create index if not exists vault_content_reports_experience_idx
  on public.vault_content_reports (experience_id, created_at desc);
create index if not exists vault_content_reports_status_idx
  on public.vault_content_reports (status, created_at desc);

comment on table public.vault_content_reports is
  'Reports about Interview Vault guides. details must not include verification documents or work emails. Retention subject to legal review.';

alter table public.vault_content_reports enable row level security;

revoke all on table public.vault_content_reports from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on table public.vault_content_reports to service_role;
  end if;
end $$;

-- Authenticated users can insert their own reports; they can read their own rows.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vault_content_reports'
      and policyname = 'vault_reports_insert_own'
  ) then
    create policy vault_reports_insert_own
      on public.vault_content_reports
      for insert
      to authenticated
      with check (auth.uid() = reporter_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vault_content_reports'
      and policyname = 'vault_reports_select_own'
  ) then
    create policy vault_reports_select_own
      on public.vault_content_reports
      for select
      to authenticated
      using (auth.uid() = reporter_id);
  end if;
end $$;

grant select, insert on table public.vault_content_reports to authenticated;

-- ---------------------------------------------------------------------------
-- Product events: prep-pack + vault report funnel (no JD/resume in props)
-- ---------------------------------------------------------------------------
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
    'prep_pack_generated',
    'prep_pack_shared',
    'prep_pack_viewed',
    'vault_guide_opened',
    'vault_report_submitted'
  ));
