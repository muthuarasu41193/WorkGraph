-- Milestone C: shareable links for saved prep packs.
-- Stores only a token hash + metadata. Public readers never see raw JDs or profile PII.
-- Additive. Depends on public.prep_packs (Milestone A).

create table if not exists public.prep_pack_shares (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.prep_packs (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz
);

alter table public.prep_pack_shares drop constraint if exists prep_pack_shares_token_hash_len;
alter table public.prep_pack_shares
  add constraint prep_pack_shares_token_hash_len
  check (char_length(token_hash) = 64);

alter table public.prep_pack_shares drop constraint if exists prep_pack_shares_token_hash_hex;
alter table public.prep_pack_shares
  add constraint prep_pack_shares_token_hash_hex
  check (token_hash ~ '^[0-9a-f]{64}$');

create unique index if not exists prep_pack_shares_token_hash_uidx
  on public.prep_pack_shares (token_hash);

create index if not exists prep_pack_shares_owner_created_idx
  on public.prep_pack_shares (owner_id, created_at desc);

create index if not exists prep_pack_shares_pack_id_idx
  on public.prep_pack_shares (pack_id);

comment on table public.prep_pack_shares is
  'Share links for saved prep packs. Token stored as SHA-256 hex only; raw token never persisted.';

alter table public.prep_pack_shares enable row level security;

drop policy if exists prep_pack_shares_select_own on public.prep_pack_shares;
create policy prep_pack_shares_select_own
  on public.prep_pack_shares for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists prep_pack_shares_insert_own on public.prep_pack_shares;
create policy prep_pack_shares_insert_own
  on public.prep_pack_shares for insert
  to authenticated
  with check (
    auth.uid() = owner_id
    and exists (
      select 1
      from public.prep_packs p
      where p.id = pack_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists prep_pack_shares_update_own on public.prep_pack_shares;
create policy prep_pack_shares_update_own
  on public.prep_pack_shares for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists prep_pack_shares_delete_own on public.prep_pack_shares;
create policy prep_pack_shares_delete_own
  on public.prep_pack_shares for delete
  to authenticated
  using (auth.uid() = owner_id);

revoke all on table public.prep_pack_shares from public, anon;
grant select, insert, update, delete on table public.prep_pack_shares to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on table public.prep_pack_shares to service_role;
  end if;
end $$;

-- Rollback:
--   drop policy if exists prep_pack_shares_select_own on public.prep_pack_shares;
--   drop policy if exists prep_pack_shares_insert_own on public.prep_pack_shares;
--   drop policy if exists prep_pack_shares_update_own on public.prep_pack_shares;
--   drop policy if exists prep_pack_shares_delete_own on public.prep_pack_shares;
--   drop table if exists public.prep_pack_shares;
