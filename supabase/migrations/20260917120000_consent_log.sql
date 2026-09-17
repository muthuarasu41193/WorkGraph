-- First-party consent audit trail. Never store a full IP address.

create table if not exists public.consent_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  anonymous_id text not null,
  categories jsonb not null,
  policy_version text not null,
  created_at timestamptz not null default now(),
  ip_country char(2)
);

create index if not exists ix_consent_log_anonymous_created
  on public.consent_log (anonymous_id, created_at desc);

create index if not exists ix_consent_log_user_created
  on public.consent_log (user_id, created_at desc)
  where user_id is not null;

comment on table public.consent_log is
  'Cookie/consent audit events. ip_country is ISO 3166-1 alpha-2 only; never persist a full IP.';
comment on column public.consent_log.ip_country is
  'ISO country from edge headers (x-vercel-ip-country / cf-ipcountry). Null when unknown.';
comment on column public.consent_log.categories is
  'Exact categories granted: strictlyNecessary, analytics, marketing.';

alter table public.consent_log enable row level security;

revoke all on table public.consent_log from anon, authenticated;
