-- Job application tracker (Kanban) per authenticated user.

create type public.application_status as enum (
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected'
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company text not null,
  role text not null,
  status public.application_status not null default 'applied',
  applied_date date not null default current_date,
  job_url text,
  notes text,
  salary_offered text,
  contact_person text,
  next_step text,
  next_step_date date,
  timeline jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_applications_user_status
  on public.applications (user_id, status);

create index if not exists ix_applications_user_updated
  on public.applications (user_id, updated_at desc);

comment on table public.applications is 'User job application pipeline for the Kanban tracker.';

alter table public.applications enable row level security;

drop policy if exists applications_select_own on public.applications;
create policy applications_select_own
  on public.applications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists applications_insert_own on public.applications;
create policy applications_insert_own
  on public.applications for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists applications_update_own on public.applications;
create policy applications_update_own
  on public.applications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists applications_delete_own on public.applications;
create policy applications_delete_own
  on public.applications for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.applications to authenticated;

create or replace function public.set_applications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists applications_updated_at on public.applications;
create trigger applications_updated_at
  before update on public.applications
  for each row
  execute function public.set_applications_updated_at();

alter table public.applications replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.applications;
  end if;
exception
  when duplicate_object then null;
end $$;
