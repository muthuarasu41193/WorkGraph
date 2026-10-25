-- WorkGraph Pass payments (Razorpay) and the subscription-column lock.
-- Idempotent. Safe to run in the Supabase SQL Editor.
--
-- payments: the service role inserts and updates after the server has checked
-- the session (order/verify) or the webhook signature. Authenticated users may
-- SELECT their own rows. There is no insert, update, or delete policy.
-- ON DELETE SET NULL keeps an anonymised accounting row when the auth user is
-- removed. lib/account/ does not exist yet. When account delete and export are
-- added, export this table and keep the row (do not delete it with the account).
--
-- The trigger below is the same lock as
-- supabase/migrations/20261024183000_subscription_guard_and_usage.sql.
-- Creating it here means a pass cannot be self-assigned if that file has not
-- been applied yet. Running both replaces the same function.

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

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  provider text not null default 'razorpay',
  plan_id text not null,
  amount_paise integer not null,
  currency text not null,
  provider_order_id text not null,
  provider_payment_id text,
  status text not null default 'created',
  granted_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments
  add constraint payments_status_check
  check (status in ('created', 'paid', 'failed'));

alter table public.payments drop constraint if exists payments_amount_paise_check;
alter table public.payments
  add constraint payments_amount_paise_check
  check (amount_paise > 0);

create unique index if not exists payments_provider_order_id_key
  on public.payments (provider_order_id);

create unique index if not exists payments_provider_payment_id_key
  on public.payments (provider_payment_id);

create index if not exists payments_user_id_idx
  on public.payments (user_id);

comment on table public.payments is
  'One-time WorkGraph Pass charges. user_id becomes null when the account is deleted so the accounting row remains. No card or UPI data is stored. Prompt: include in account export; do not delete the row on account delete. lib/account/ does not exist yet.';

alter table public.payments enable row level security;

drop policy if exists payments_select_own on public.payments;
create policy payments_select_own
  on public.payments for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists payments_insert_own on public.payments;
drop policy if exists payments_update_own on public.payments;
drop policy if exists payments_delete_own on public.payments;

revoke all on table public.payments from public, anon, authenticated;
grant select on table public.payments to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on table public.payments to service_role;
  end if;
end $$;
