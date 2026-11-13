-- Milestone V4: verified-purchaser reviews, review reports, refund requests.
-- Additive. Do not run against production from this agent environment.
--
-- Apply: supabase db push OR paste into Supabase SQL Editor
--
-- Rollback:
--   drop policy if exists vault_refund_requests_* on public.vault_refund_requests;
--   drop policy if exists vault_review_reports_* on public.vault_review_reports;
--   drop table if exists public.vault_refund_requests;
--   drop table if exists public.vault_review_reports;
--   drop type if exists public.vault_refund_request_status;
--   drop type if exists public.vault_refund_request_reason;
--   drop type if exists public.vault_review_report_reason;
--   alter table public.vault_reviews
--     drop column if exists purchase_id,
--     drop column if exists updated_at,
--     drop column if exists hidden_at,
--     drop column if exists hidden_by;
--   -- restore prior vault_reviews select/insert policies if needed

-- ---------------------------------------------------------------------------
-- Reviews: purchase link, edit timestamp, admin hide
-- ---------------------------------------------------------------------------

alter table public.vault_reviews
  add column if not exists purchase_id uuid references public.vault_purchases (id) on delete set null;

alter table public.vault_reviews
  add column if not exists updated_at timestamptz not null default now();

alter table public.vault_reviews
  add column if not exists hidden_at timestamptz;

alter table public.vault_reviews
  add column if not exists hidden_by uuid references auth.users (id) on delete set null;

comment on column public.vault_reviews.purchase_id is
  'Purchase that entitles this verified-purchaser review. One review per purchase.';
comment on column public.vault_reviews.hidden_at is
  'When an admin hid this review from public listing. Author can still read own row.';

create unique index if not exists ux_vault_reviews_purchase_id
  on public.vault_reviews (purchase_id)
  where purchase_id is not null;

create index if not exists ix_vault_reviews_hidden
  on public.vault_reviews (experience_id, created_at desc)
  where hidden_at is null;

create or replace function public.set_vault_reviews_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vault_reviews_updated_at on public.vault_reviews;
create trigger vault_reviews_updated_at
  before update on public.vault_reviews
  for each row
  execute function public.set_vault_reviews_updated_at();

-- Public readers see non-hidden reviews; authors always see their own.
drop policy if exists vault_reviews_select_all on public.vault_reviews;
drop policy if exists vault_reviews_select_visible on public.vault_reviews;
create policy vault_reviews_select_visible
  on public.vault_reviews for select
  to anon, authenticated
  using (
    hidden_at is null
    or (auth.uid() is not null and auth.uid() = user_id)
  );

-- Insert only for verified purchasers (payment_status = verified), not owner self-reviews.
drop policy if exists vault_reviews_insert_purchaser on public.vault_reviews;
create policy vault_reviews_insert_purchaser
  on public.vault_reviews for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.vault_purchases p
      where p.id = vault_reviews.purchase_id
        and p.experience_id = vault_reviews.experience_id
        and p.buyer_id = auth.uid()
        and p.payment_status = 'verified'
    )
  );

drop policy if exists vault_reviews_update_own on public.vault_reviews;
create policy vault_reviews_update_own
  on public.vault_reviews for update
  to authenticated
  using (auth.uid() = user_id and hidden_at is null)
  with check (auth.uid() = user_id);

drop policy if exists vault_reviews_delete_own on public.vault_reviews;
create policy vault_reviews_delete_own
  on public.vault_reviews for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.vault_reviews to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on table public.vault_reviews to service_role;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Review reports (signed-in; admin hide via service role)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'vault_review_report_reason') then
    create type public.vault_review_report_reason as enum (
      'abuse_or_harassment',
      'spam',
      'off_topic',
      'personal_data',
      'other'
    );
  end if;
end $$;

create table if not exists public.vault_review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.vault_reviews (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason public.vault_review_report_reason not null,
  details text,
  created_at timestamptz not null default now(),
  constraint vault_review_reports_details_len check (
    details is null or char_length(details) <= 1000
  ),
  unique (review_id, reporter_id)
);

create index if not exists ix_vault_review_reports_review
  on public.vault_review_reports (review_id, created_at desc);

comment on table public.vault_review_reports is
  'Reports against Interview Vault reviews. No review body stored here beyond reason/details. Admin hide uses service role.';

alter table public.vault_review_reports enable row level security;

revoke all on table public.vault_review_reports from public, anon;

drop policy if exists vault_review_reports_insert_own on public.vault_review_reports;
create policy vault_review_reports_insert_own
  on public.vault_review_reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists vault_review_reports_select_own on public.vault_review_reports;
create policy vault_review_reports_select_own
  on public.vault_review_reports for select
  to authenticated
  using (auth.uid() = reporter_id);

grant select, insert on table public.vault_review_reports to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on table public.vault_review_reports to service_role;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Refund requests (manual; no payment provider execution in this milestone)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'vault_refund_request_reason') then
    create type public.vault_refund_request_reason as enum (
      'inaccessible_after_purchase',
      'materially_misrepresented'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'vault_refund_request_status') then
    create type public.vault_refund_request_status as enum (
      'open',
      'approved',
      'denied',
      'refunded'
    );
  end if;
end $$;

create table if not exists public.vault_refund_requests (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.vault_experiences (id) on delete cascade,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  purchase_id uuid not null references public.vault_purchases (id) on delete cascade,
  reason public.vault_refund_request_reason not null,
  details text,
  status public.vault_refund_request_status not null default 'open',
  processing_mode text not null default 'manual'
    check (processing_mode in ('manual')),
  contributor_response text,
  contributor_responded_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  constraint vault_refund_requests_details_len check (
    details is null or char_length(details) <= 2000
  ),
  constraint vault_refund_requests_response_len check (
    contributor_response is null or char_length(contributor_response) <= 2000
  ),
  constraint vault_refund_requests_admin_note_len check (
    admin_note is null or char_length(admin_note) <= 1000
  ),
  unique (purchase_id)
);

create index if not exists ix_vault_refund_requests_status
  on public.vault_refund_requests (status, created_at desc);

create index if not exists ix_vault_refund_requests_buyer
  on public.vault_refund_requests (buyer_id, created_at desc);

create index if not exists ix_vault_refund_requests_experience
  on public.vault_refund_requests (experience_id, created_at desc);

comment on table public.vault_refund_requests is
  'Buyer refund requests for vault guides. Status transitions are admin/server only. processing_mode=manual until Milestone D payment-provider refunds exist. Never stores guide body or payment secrets.';

alter table public.vault_refund_requests enable row level security;

revoke all on table public.vault_refund_requests from public, anon;

drop policy if exists vault_refund_requests_insert_own on public.vault_refund_requests;
create policy vault_refund_requests_insert_own
  on public.vault_refund_requests for insert
  to authenticated
  with check (
    auth.uid() = buyer_id
    and status = 'open'
    and processing_mode = 'manual'
    and exists (
      select 1 from public.vault_purchases p
      where p.id = purchase_id
        and p.buyer_id = auth.uid()
        and p.experience_id = experience_id
        and p.payment_status = 'verified'
    )
  );

drop policy if exists vault_refund_requests_select_buyer on public.vault_refund_requests;
create policy vault_refund_requests_select_buyer
  on public.vault_refund_requests for select
  to authenticated
  using (auth.uid() = buyer_id);

drop policy if exists vault_refund_requests_select_seller on public.vault_refund_requests;
create policy vault_refund_requests_select_seller
  on public.vault_refund_requests for select
  to authenticated
  using (
    exists (
      select 1 from public.vault_experiences e
      where e.id = experience_id and e.seller_id = auth.uid()
    )
  );

-- Contributor may only set response fields while status is open (enforced in app;
-- RLS allows update for seller on own-guide rows).
drop policy if exists vault_refund_requests_update_seller_response on public.vault_refund_requests;
create policy vault_refund_requests_update_seller_response
  on public.vault_refund_requests for update
  to authenticated
  using (
    exists (
      select 1 from public.vault_experiences e
      where e.id = experience_id and e.seller_id = auth.uid()
    )
    and status = 'open'
  )
  with check (
    exists (
      select 1 from public.vault_experiences e
      where e.id = experience_id and e.seller_id = auth.uid()
    )
    and status = 'open'
  );

grant select, insert, update on table public.vault_refund_requests to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on table public.vault_refund_requests to service_role;
  end if;
end $$;
