-- WorkGraph Talent Intelligence: resume versions, analysis reports, feedback.

create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null default 'profile' check (source in ('profile', 'upload', 'parse')),
  content_hash text not null,
  storage_path text,
  parsed_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists resume_versions_user_created_idx
  on public.resume_versions (user_id, created_at desc);

create unique index if not exists resume_versions_user_hash_idx
  on public.resume_versions (user_id, content_hash);

alter table public.resume_versions enable row level security;

drop policy if exists "resume_versions_select_own" on public.resume_versions;
create policy "resume_versions_select_own"
  on public.resume_versions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "resume_versions_insert_own" on public.resume_versions;
create policy "resume_versions_insert_own"
  on public.resume_versions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "resume_versions_delete_own" on public.resume_versions;
create policy "resume_versions_delete_own"
  on public.resume_versions for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.resume_versions to authenticated;

create table if not exists public.resume_intelligence_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resume_version_id uuid references public.resume_versions (id) on delete set null,
  job_id text,
  job_title text,
  company text,
  job_description_text text not null,
  job_description_hash text not null,
  cache_key text not null,
  status text not null default 'completed' check (status in ('pending', 'processing', 'completed', 'failed')),
  overall_score integer,
  report jsonb not null default '{}'::jsonb,
  prompt_version text not null default 'v1',
  llm_model text,
  llm_metadata jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resume_intelligence_reports_user_created_idx
  on public.resume_intelligence_reports (user_id, created_at desc);

create unique index if not exists resume_intelligence_reports_cache_key_idx
  on public.resume_intelligence_reports (user_id, cache_key);

alter table public.resume_intelligence_reports enable row level security;

drop policy if exists "resume_intelligence_reports_select_own" on public.resume_intelligence_reports;
create policy "resume_intelligence_reports_select_own"
  on public.resume_intelligence_reports for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "resume_intelligence_reports_insert_own" on public.resume_intelligence_reports;
create policy "resume_intelligence_reports_insert_own"
  on public.resume_intelligence_reports for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "resume_intelligence_reports_update_own" on public.resume_intelligence_reports;
create policy "resume_intelligence_reports_update_own"
  on public.resume_intelligence_reports for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "resume_intelligence_reports_delete_own" on public.resume_intelligence_reports;
create policy "resume_intelligence_reports_delete_own"
  on public.resume_intelligence_reports for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.resume_intelligence_reports to authenticated;

create table if not exists public.resume_intelligence_feedback (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.resume_intelligence_reports (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists resume_intelligence_feedback_report_idx
  on public.resume_intelligence_feedback (report_id);

alter table public.resume_intelligence_feedback enable row level security;

drop policy if exists "resume_intelligence_feedback_select_own" on public.resume_intelligence_feedback;
create policy "resume_intelligence_feedback_select_own"
  on public.resume_intelligence_feedback for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "resume_intelligence_feedback_insert_own" on public.resume_intelligence_feedback;
create policy "resume_intelligence_feedback_insert_own"
  on public.resume_intelligence_feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.resume_intelligence_feedback to authenticated;
