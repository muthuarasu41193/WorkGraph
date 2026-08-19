-- Saved Groq-generated cover letters per authenticated user.

create table if not exists public.cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_title text not null,
  company text not null,
  job_description text,
  generated_letter text not null,
  created_at timestamptz not null default now()
);

create index if not exists ix_cover_letters_user_created
  on public.cover_letters (user_id, created_at desc);

comment on table public.cover_letters is 'User-saved cover letters generated for a specific job and company.';

alter table public.cover_letters enable row level security;

drop policy if exists cover_letters_select_own on public.cover_letters;
create policy cover_letters_select_own
  on public.cover_letters for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists cover_letters_insert_own on public.cover_letters;
create policy cover_letters_insert_own
  on public.cover_letters for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists cover_letters_delete_own on public.cover_letters;
create policy cover_letters_delete_own
  on public.cover_letters for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.cover_letters to authenticated;
