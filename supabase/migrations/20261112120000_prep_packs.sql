-- Free interview prep packs (Milestone A).
-- Stores derived pack output only (skills, matched guides, checklist).
-- Does NOT store raw pasted job descriptions.
-- Owner-only RLS. Additive and reversible (drop table).

create table if not exists public.prep_packs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role_id text,
  role_label text,
  skills jsonb not null default '[]'::jsonb,
  guides jsonb not null default '[]'::jsonb,
  checklist jsonb not null default '[]'::jsonb,
  estimate_notice text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prep_packs drop constraint if exists prep_packs_role_id_len;
alter table public.prep_packs
  add constraint prep_packs_role_id_len
  check (role_id is null or char_length(role_id) <= 80);

alter table public.prep_packs drop constraint if exists prep_packs_role_label_len;
alter table public.prep_packs
  add constraint prep_packs_role_label_len
  check (role_label is null or char_length(role_label) <= 120);

alter table public.prep_packs drop constraint if exists prep_packs_estimate_notice_len;
alter table public.prep_packs
  add constraint prep_packs_estimate_notice_len
  check (char_length(estimate_notice) >= 1 and char_length(estimate_notice) <= 400);

-- Bound stored JSON payload size (characters of serialized jsonb).
alter table public.prep_packs drop constraint if exists prep_packs_skills_size;
alter table public.prep_packs
  add constraint prep_packs_skills_size
  check (char_length(skills::text) <= 8000);

alter table public.prep_packs drop constraint if exists prep_packs_guides_size;
alter table public.prep_packs
  add constraint prep_packs_guides_size
  check (char_length(guides::text) <= 16000);

alter table public.prep_packs drop constraint if exists prep_packs_checklist_size;
alter table public.prep_packs
  add constraint prep_packs_checklist_size
  check (char_length(checklist::text) <= 12000);

create index if not exists prep_packs_user_id_created_idx
  on public.prep_packs (user_id, created_at desc);

comment on table public.prep_packs is
  'Saved interview prep packs for signed-in users. Derived skills/guides/checklist only; no raw JD.';

create or replace function public.set_prep_packs_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists prep_packs_updated_at on public.prep_packs;
create trigger prep_packs_updated_at
  before update on public.prep_packs
  for each row
  execute function public.set_prep_packs_updated_at();

alter table public.prep_packs enable row level security;

drop policy if exists prep_packs_select_own on public.prep_packs;
create policy prep_packs_select_own
  on public.prep_packs for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists prep_packs_insert_own on public.prep_packs;
create policy prep_packs_insert_own
  on public.prep_packs for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists prep_packs_update_own on public.prep_packs;
create policy prep_packs_update_own
  on public.prep_packs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists prep_packs_delete_own on public.prep_packs;
create policy prep_packs_delete_own
  on public.prep_packs for delete
  to authenticated
  using (auth.uid() = user_id);

revoke all on table public.prep_packs from public, anon;
grant select, insert, update, delete on table public.prep_packs to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on table public.prep_packs to service_role;
  end if;
end $$;

-- Rollback:
--   drop trigger if exists prep_packs_updated_at on public.prep_packs;
--   drop function if exists public.set_prep_packs_updated_at();
--   drop table if exists public.prep_packs;
