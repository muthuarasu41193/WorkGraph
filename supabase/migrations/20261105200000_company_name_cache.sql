-- Cache for company display-name normalization (ingest). Service role writes; no client policies.

create table if not exists public.company_name_cache (
  raw_key text primary key,
  raw_name text not null,
  display_name text not null,
  source text not null check (source in ('rules', 'groq', 'manual')),
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists company_name_cache_updated_idx
  on public.company_name_cache (updated_at desc);

alter table public.company_name_cache enable row level security;

-- No policies: only the service role (bypasses RLS) reads and writes this table.

comment on table public.company_name_cache is
  'Normalized company display names. Each raw_key is lower(trim(raw)). Written during ingest.';
