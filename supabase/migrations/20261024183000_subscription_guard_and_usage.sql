-- Lock plan columns and record paid-feature usage.
--
-- profiles.subscription_tier and profiles.subscription_expires_at were owner-writable
-- through profiles_update_own. This trigger rejects a change to either column unless
-- the request JWT role is service_role (auth.role() or request.jwt.claims).
-- Other profile columns are unchanged, so existing profile edits keep working.
-- INSERT is included so a first profile row cannot self-assign a paid plan.
-- Inserts that leave the default tier (free) and a null expiry still succeed.
--
-- The Supabase SQL editor has no JWT, so a dashboard UPDATE of these columns
-- raises subscription_columns_locked. To set a plan as an operator, run in one
-- transaction:
--   select set_config('request.jwt.claims', '{"role":"service_role"}', true);
--   update public.profiles set subscription_tier = 'premium', ... where id = '<uuid>';
--
-- feature_usage is personal (user id, feature, time). Authenticated users may
-- read their own rows. They cannot insert, update, or delete. The server writes
-- with the service role after it has authenticated the session user, and every
-- write is filtered to that session id. Prompt 4 must add this table to account
-- delete and export. lib/account/ does not exist yet.

create or replace function public.guard_profile_subscription_columns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  role_name text;
  claims text;
  claims_role text;
  is_service boolean := false;
  locked boolean := false;
begin
  begin
    role_name := auth.role();
  exception
    when undefined_function then
      role_name := null;
  end;

  if coalesce(role_name, '') = 'service_role' then
    is_service := true;
  else
    claims := current_setting('request.jwt.claims', true);
    if claims is not null and btrim(claims) <> '' then
      begin
        claims_role := claims::jsonb ->> 'role';
      exception
        when others then
          claims_role := null;
      end;
      if coalesce(claims_role, '') = 'service_role' then
        is_service := true;
      end if;
    end if;
  end if;

  if tg_op = 'UPDATE' then
    locked := new.subscription_tier is distinct from old.subscription_tier
      or new.subscription_expires_at is distinct from old.subscription_expires_at;
  elsif tg_op = 'INSERT' then
    -- A missing tier is the column default (free). Only an explicit paid
    -- tier or a non-null expiry is a self-assigned plan.
    locked := coalesce(new.subscription_tier, 'free') is distinct from 'free'
      or new.subscription_expires_at is not null;
  end if;

  if locked and not is_service then
    raise exception 'subscription_columns_locked'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_subscription_columns on public.profiles;
create trigger profiles_guard_subscription_columns
  before insert or update on public.profiles
  for each row
  execute function public.guard_profile_subscription_columns();

revoke all on function public.guard_profile_subscription_columns() from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function public.guard_profile_subscription_columns() to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.guard_profile_subscription_columns() to service_role;
  end if;
end $$;

create table if not exists public.feature_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null,
  created_at timestamptz not null default now(),
  constraint feature_usage_feature_check check (
    feature in ('cover_letter', 'tailoring', 'talent_intelligence', 'ats_score')
  )
);

alter table public.feature_usage drop constraint if exists feature_usage_feature_check;
alter table public.feature_usage
  add constraint feature_usage_feature_check
  check (feature in ('cover_letter', 'tailoring', 'talent_intelligence', 'ats_score'));

create index if not exists idx_feature_usage_user_feature_created
  on public.feature_usage (user_id, feature, created_at desc);

comment on table public.feature_usage is
  'Paid-feature usage for the session user. Prompt 4: include in account delete and export.';

alter table public.feature_usage enable row level security;

drop policy if exists feature_usage_select_own on public.feature_usage;
create policy feature_usage_select_own
  on public.feature_usage for select
  to authenticated
  using (auth.uid() = user_id);

revoke all on table public.feature_usage from public, anon, authenticated;
grant select on table public.feature_usage to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on table public.feature_usage to service_role;
  end if;
end $$;
