-- Server-side saved job alerts (Prompt 9). Idempotent.
-- Owner-only RLS. Max 10 alerts per user is enforced in the API, not here.
-- Unique (user_id, name). Daily frequency is a WorkGraph Pass entitlement (API).

create table if not exists public.job_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  query text not null,
  min_match integer not null default 40,
  frequency text not null default 'weekly',
  discreet boolean not null default true,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_alerts drop constraint if exists job_alerts_name_len;
alter table public.job_alerts
  add constraint job_alerts_name_len
  check (char_length(name) >= 1 and char_length(name) <= 80);

alter table public.job_alerts drop constraint if exists job_alerts_query_len;
alter table public.job_alerts
  add constraint job_alerts_query_len
  check (char_length(query) >= 0 and char_length(query) <= 500);

alter table public.job_alerts drop constraint if exists job_alerts_min_match_range;
alter table public.job_alerts
  add constraint job_alerts_min_match_range
  check (min_match >= 0 and min_match <= 100);

alter table public.job_alerts drop constraint if exists job_alerts_frequency_check;
alter table public.job_alerts
  add constraint job_alerts_frequency_check
  check (frequency in ('daily', 'weekly', 'off'));

create unique index if not exists job_alerts_user_id_name_key
  on public.job_alerts (user_id, name);

create index if not exists job_alerts_user_id_created_idx
  on public.job_alerts (user_id, created_at desc);

comment on table public.job_alerts is
  'Saved /jobs search alerts per user. query is the /jobs query string. discreet defaults true. Prompt 9.';

create or replace function public.set_job_alerts_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists job_alerts_updated_at on public.job_alerts;
create trigger job_alerts_updated_at
  before update on public.job_alerts
  for each row
  execute function public.set_job_alerts_updated_at();

alter table public.job_alerts enable row level security;

drop policy if exists job_alerts_select_own on public.job_alerts;
create policy job_alerts_select_own
  on public.job_alerts for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists job_alerts_insert_own on public.job_alerts;
create policy job_alerts_insert_own
  on public.job_alerts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists job_alerts_update_own on public.job_alerts;
create policy job_alerts_update_own
  on public.job_alerts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists job_alerts_delete_own on public.job_alerts;
create policy job_alerts_delete_own
  on public.job_alerts for delete
  to authenticated
  using (auth.uid() = user_id);

revoke all on table public.job_alerts from public, anon;
grant select, insert, update, delete on table public.job_alerts to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on table public.job_alerts to service_role;
  end if;
end $$;
