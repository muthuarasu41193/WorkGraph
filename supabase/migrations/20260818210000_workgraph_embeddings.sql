-- WorkGraph semantic embeddings: pgvector storage, versioning, ANN search.
-- Local hash-ngram-v1 (256-d). No external embedding provider. No raw resume text.

create extension if not exists vector;

create table if not exists public.workgraph_embeddings (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete cascade,
  owner_scope uuid generated always as (
    coalesce(owner_user_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) stored,
  entity_type text not null check (
    entity_type in (
      'profile',
      'resume',
      'skill',
      'job_description',
      'job_requirements',
      'experience',
      'project'
    )
  ),
  entity_id text not null,
  model_version text not null default 'hash-ngram-v1',
  content_hash text not null,
  embedding vector(256) not null,
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed', 'skipped')),
  attempts integer not null default 1 check (attempts >= 0 and attempts <= 20),
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workgraph_embeddings_entity_len check (char_length(entity_id) between 1 and 240),
  constraint workgraph_embeddings_hash_len check (char_length(content_hash) <= 64),
  constraint workgraph_embeddings_error_len check (error_code is null or char_length(error_code) <= 80)
);

comment on table public.workgraph_embeddings is
  'Semantic embeddings for profiles, resumes, skills, jobs, experience, and projects. Stores vectors and hashes only — never raw resume text.';

create unique index if not exists workgraph_embeddings_scope_entity_version_idx
  on public.workgraph_embeddings (owner_scope, entity_type, entity_id, model_version);

create index if not exists workgraph_embeddings_owner_idx
  on public.workgraph_embeddings (owner_user_id, entity_type);

create index if not exists workgraph_embeddings_type_status_idx
  on public.workgraph_embeddings (entity_type, status)
  where status = 'completed';

create index if not exists workgraph_embeddings_hnsw_idx
  on public.workgraph_embeddings
  using hnsw (embedding vector_cosine_ops);

alter table public.workgraph_embeddings enable row level security;

drop policy if exists "workgraph_embeddings_select_visible" on public.workgraph_embeddings;
create policy "workgraph_embeddings_select_visible"
  on public.workgraph_embeddings for select
  to authenticated
  using (owner_user_id is null or owner_user_id = auth.uid());

drop policy if exists "workgraph_embeddings_insert_own" on public.workgraph_embeddings;
create policy "workgraph_embeddings_insert_own"
  on public.workgraph_embeddings for insert
  to authenticated
  with check (owner_user_id = auth.uid());

drop policy if exists "workgraph_embeddings_update_own" on public.workgraph_embeddings;
create policy "workgraph_embeddings_update_own"
  on public.workgraph_embeddings for update
  to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists "workgraph_embeddings_delete_own" on public.workgraph_embeddings;
create policy "workgraph_embeddings_delete_own"
  on public.workgraph_embeddings for delete
  to authenticated
  using (owner_user_id = auth.uid());

grant select, insert, update, delete on public.workgraph_embeddings to authenticated;

create or replace function public.match_workgraph_embeddings(
  query_embedding text,
  match_count integer default 10,
  filter_entity_types text[] default null,
  filter_user_id uuid default null,
  filter_model_version text default 'hash-ngram-v1'
)
returns table (
  id uuid,
  entity_type text,
  entity_id text,
  owner_user_id uuid,
  model_version text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    e.id,
    e.entity_type,
    e.entity_id,
    e.owner_user_id,
    e.model_version,
    (1 - (e.embedding <=> query_embedding::vector(256)))::double precision as similarity
  from public.workgraph_embeddings e
  where e.status = 'completed'
    and e.model_version = filter_model_version
    and (filter_entity_types is null or e.entity_type = any (filter_entity_types))
    and (
      e.owner_user_id is null
      or (filter_user_id is not null and e.owner_user_id = filter_user_id)
    )
  order by e.embedding <=> query_embedding::vector(256)
  limit greatest(1, least(coalesce(match_count, 10), 100));
$$;

comment on function public.match_workgraph_embeddings is
  'Cosine similarity search. Invoker RLS applies. Public job rows (owner_user_id is null) are visible; user-owned rows require filter_user_id = caller.';

grant execute on function public.match_workgraph_embeddings(text, integer, text[], uuid, text) to authenticated;
