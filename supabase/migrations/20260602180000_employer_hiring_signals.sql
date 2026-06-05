-- WorkGraph Employer: Hiring Signals (not ATS job posts) + direct graph applications.

-- Employer company profile (separate from jobseeker profiles).
create table if not exists public.employer_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  company_name text not null,
  company_slug text not null,
  tagline text,
  website_url text,
  logo_url text,
  hiring_philosophy text,
  team_size text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_employer_profiles_slug unique (company_slug)
);

create index if not exists ix_employer_profiles_slug on public.employer_profiles (company_slug);

comment on table public.employer_profiles is 'Employer identity on WorkGraph — distinct from jobseeker profiles.';

alter table public.employer_profiles enable row level security;

drop policy if exists employer_profiles_select_public on public.employer_profiles;
create policy employer_profiles_select_public
  on public.employer_profiles for select
  to authenticated
  using (true);

drop policy if exists employer_profiles_insert_own on public.employer_profiles;
create policy employer_profiles_insert_own
  on public.employer_profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists employer_profiles_update_own on public.employer_profiles;
create policy employer_profiles_update_own
  on public.employer_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant select, insert, update on public.employer_profiles to authenticated;

-- Hiring intent: why the role exists now (WorkGraph-specific, not a JD clone).
create type public.hiring_intent as enum (
  'exploring',
  'actively_hiring',
  'backfill',
  'stealth'
);

create type public.work_mode as enum ('remote', 'hybrid', 'onsite', 'flexible');

create type public.hiring_signal_status as enum ('draft', 'live', 'paused', 'closed');

-- A "Hiring Signal" — employer intent + fit signals, not a scraped ATS listing.
create table if not exists public.hiring_signals (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employer_profiles (id) on delete cascade,
  title text not null,
  location text not null default '',
  work_mode public.work_mode not null default 'flexible',
  hiring_intent public.hiring_intent not null default 'actively_hiring',
  why_now text not null default '',
  description text not null default '',
  fit_signals jsonb not null default '[]'::jsonb,
  comp_hint text,
  status public.hiring_signal_status not null default 'draft',
  applies_count integer not null default 0,
  published_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_hiring_signals_employer on public.hiring_signals (employer_id, status);
create index if not exists ix_hiring_signals_live on public.hiring_signals (status, published_at desc nulls last)
  where status = 'live';

comment on table public.hiring_signals is 'Employer-posted hiring signals with fit_signals JSON — WorkGraph Direct, not ATS ingest.';

alter table public.hiring_signals enable row level security;

drop policy if exists hiring_signals_select_live on public.hiring_signals;
create policy hiring_signals_select_live
  on public.hiring_signals for select
  to authenticated
  using (
    status = 'live'
    or employer_id = auth.uid()
  );

drop policy if exists hiring_signals_insert_own on public.hiring_signals;
create policy hiring_signals_insert_own
  on public.hiring_signals for insert
  to authenticated
  with check (employer_id = auth.uid());

drop policy if exists hiring_signals_update_own on public.hiring_signals;
create policy hiring_signals_update_own
  on public.hiring_signals for update
  to authenticated
  using (employer_id = auth.uid())
  with check (employer_id = auth.uid());

drop policy if exists hiring_signals_delete_own on public.hiring_signals;
create policy hiring_signals_delete_own
  on public.hiring_signals for delete
  to authenticated
  using (employer_id = auth.uid());

grant select, insert, update, delete on public.hiring_signals to authenticated;

-- Connection stages — intentionally not ATS pipeline names.
create type public.connection_stage as enum (
  'incoming',
  'reviewing',
  'dialogue',
  'aligned',
  'passed'
);

create table if not exists public.signal_connections (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references public.hiring_signals (id) on delete cascade,
  seeker_id uuid not null references auth.users (id) on delete cascade,
  connection_note text not null default '',
  fit_snapshot jsonb not null default '{}'::jsonb,
  stage public.connection_stage not null default 'incoming',
  employer_reply text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_signal_connections_seeker unique (signal_id, seeker_id)
);

create index if not exists ix_signal_connections_signal on public.signal_connections (signal_id, stage);
create index if not exists ix_signal_connections_seeker on public.signal_connections (seeker_id, created_at desc);

comment on table public.signal_connections is 'Jobseeker connection to a hiring signal — profile fit snapshot, not a resume upload portal.';

alter table public.signal_connections enable row level security;

drop policy if exists signal_connections_select_parties on public.signal_connections;
create policy signal_connections_select_parties
  on public.signal_connections for select
  to authenticated
  using (
    seeker_id = auth.uid()
    or exists (
      select 1 from public.hiring_signals hs
      where hs.id = signal_id and hs.employer_id = auth.uid()
    )
  );

drop policy if exists signal_connections_insert_seeker on public.signal_connections;
create policy signal_connections_insert_seeker
  on public.signal_connections for insert
  to authenticated
  with check (seeker_id = auth.uid());

drop policy if exists signal_connections_update_parties on public.signal_connections;
create policy signal_connections_update_parties
  on public.signal_connections for update
  to authenticated
  using (
    seeker_id = auth.uid()
    or exists (
      select 1 from public.hiring_signals hs
      where hs.id = signal_id and hs.employer_id = auth.uid()
    )
  );

grant select, insert, update on public.signal_connections to authenticated;

-- Seekers can read employer profiles for live signals (limited fields via API).
-- Employers can read seeker profiles only when connected (enforced in API, not RLS on profiles).

create or replace function public.bump_hiring_signal_applies()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.hiring_signals
  set applies_count = applies_count + 1
  where id = new.signal_id;
  return new;
end;
$$;

drop trigger if exists signal_connections_bump_applies on public.signal_connections;
create trigger signal_connections_bump_applies
  after insert on public.signal_connections
  for each row
  execute function public.bump_hiring_signal_applies();

create or replace function public.set_employer_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists employer_profiles_updated_at on public.employer_profiles;
create trigger employer_profiles_updated_at
  before update on public.employer_profiles
  for each row
  execute function public.set_employer_updated_at();

drop trigger if exists hiring_signals_updated_at on public.hiring_signals;
create trigger hiring_signals_updated_at
  before update on public.hiring_signals
  for each row
  execute function public.set_employer_updated_at();

drop trigger if exists signal_connections_updated_at on public.signal_connections;
create trigger signal_connections_updated_at
  before update on public.signal_connections
  for each row
  execute function public.set_employer_updated_at();
