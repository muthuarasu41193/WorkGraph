-- P0 security hardening (19 August 2026)
-- Safe to run against production. Idempotent. Does not drop user data.
--
-- 1) Resume Storage: bucket private, owner-only object policies, rewrite leftover public URLs.
-- 2) Interview Vault: separate purchase intent from verified entitlement.

-- ---------------------------------------------------------------------------
-- Resume files must not be world-readable
-- ---------------------------------------------------------------------------

update storage.buckets
set public = false
where id = 'resumes';

drop policy if exists "resumes_read_public" on storage.objects;

drop policy if exists "resumes_select_own" on storage.objects;
create policy "resumes_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "resumes_insert_own" on storage.objects;
create policy "resumes_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "resumes_delete_own" on storage.objects;
create policy "resumes_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

-- Point leftover public object URLs at the authenticated owner download route.
-- Avatars are unchanged.
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
  and resume_url like '%/object/public/resumes/%';

-- ---------------------------------------------------------------------------
-- Vault: purchase intent vs verified payment vs entitlement
-- ---------------------------------------------------------------------------

alter table public.vault_purchases
  add column if not exists payment_status text not null default 'pending',
  add column if not exists payment_provider text,
  add column if not exists payment_reference text;

update public.vault_purchases
set payment_status = 'pending'
where payment_status is null
   or payment_status not in ('pending', 'verified', 'failed');

alter table public.vault_purchases
  drop constraint if exists vault_purchases_payment_status_check;

alter table public.vault_purchases
  add constraint vault_purchases_payment_status_check
  check (payment_status in ('pending', 'verified', 'failed'));

comment on column public.vault_purchases.payment_status is
  'pending = purchase intent only. verified = payment confirmed. failed = declined. Entitlement requires verified (or a free listing).';

-- Clients may record intent. They cannot grant themselves verified entitlement.
drop policy if exists vault_purchases_insert_own on public.vault_purchases;
drop policy if exists vault_purchases_insert_intent on public.vault_purchases;
create policy vault_purchases_insert_intent
  on public.vault_purchases for insert
  to authenticated
  with check (
    auth.uid() = buyer_id
    and payment_status = 'pending'
  );

-- Buyers must not update a pending row into verified.
drop policy if exists vault_purchases_update_own on public.vault_purchases;
-- No authenticated UPDATE policy: verified status is not client-writable.

drop policy if exists vault_reviews_insert_purchaser on public.vault_reviews;
create policy vault_reviews_insert_purchaser
  on public.vault_reviews for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (
      exists (
        select 1 from public.vault_experiences e
        where e.id = vault_reviews.experience_id
          and e.price_inr <= 0
      )
      or exists (
        select 1 from public.vault_purchases p
        where p.experience_id = vault_reviews.experience_id
          and p.buyer_id = auth.uid()
          and p.payment_status = 'verified'
      )
    )
  );
