-- WorkGraph Resume Intelligence: normalized snapshot columns, private resume files.

alter table public.profiles
  add column if not exists resume_intelligence jsonb not null default '{}'::jsonb,
  add column if not exists resume_storage_path text,
  add column if not exists resume_embedding jsonb,
  add column if not exists resume_embedding_model text;

alter table public.resume_versions
  add column if not exists embedding jsonb,
  add column if not exists embedding_model text;

comment on column public.profiles.resume_intelligence is
  'Normalized resume snapshot (no raw file bytes). Estimates only; no protected-characteristic inference.';
comment on column public.profiles.resume_embedding is
  'Local hashed n-gram vector for matching. Do not log.';
comment on column public.profiles.resume_storage_path is
  'Owner-scoped Storage object path. Never a public URL.';

-- Stop serving resume files to anyone with the URL.
update storage.buckets
set public = false
where id = 'resumes';

drop policy if exists "resumes_read_public" on storage.objects;

drop policy if exists "resumes_select_own" on storage.objects;
create policy "resumes_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "resumes_delete_own" on storage.objects;
create policy "resumes_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

-- Point existing public resume URLs at the authenticated owner download route.
-- Object path is preserved in resume_storage_path when it can be parsed.
update public.profiles
set
  resume_storage_path = coalesce(
    resume_storage_path,
    nullif(
      split_part(
        split_part(resume_url, '/object/public/resumes/', 2),
        '?',
        1
      ),
      ''
    )
  ),
  resume_url = '/api/resume/file'
where resume_url is not null
  and resume_url <> ''
  and resume_url not like '/api/resume/file%';
