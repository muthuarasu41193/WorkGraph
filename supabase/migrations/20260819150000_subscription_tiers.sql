-- Subscription tiers on existing profiles. Additive only; no new tables.

alter table public.profiles
  add column if not exists subscription_tier text not null default 'free',
  add column if not exists subscription_expires_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_subscription_tier_check;

alter table public.profiles
  add constraint profiles_subscription_tier_check
  check (subscription_tier in ('free', 'premium', 'pro'));

create index if not exists idx_profiles_subscription
  on public.profiles (subscription_tier, subscription_expires_at);

comment on column public.profiles.subscription_tier is
  'Plan: free, premium, or pro. Existing rows default to free.';
comment on column public.profiles.subscription_expires_at is
  'When the paid plan ends. Null for free or non-expiring access.';
