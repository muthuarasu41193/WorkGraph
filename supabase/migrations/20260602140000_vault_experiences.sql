-- Interview Vault marketplace: experiences, purchases, and reviews.

create type public.vault_difficulty as enum ('easy', 'medium', 'hard');
create type public.vault_result as enum ('offer', 'rejected', 'ongoing', 'withdrawn');
create type public.vault_experience_status as enum ('draft', 'published', 'archived');

create table if not exists public.vault_experiences (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users (id) on delete cascade,
  company text not null default '',
  role text not null default '',
  level text,
  difficulty public.vault_difficulty,
  rounds int,
  result public.vault_result,
  interview_date date,
  rounds_data jsonb not null default '[]'::jsonb,
  questions_html text not null default '',
  tips_html text not null default '',
  price_inr int not null default 499 check (price_inr >= 0),
  status public.vault_experience_status not null default 'draft',
  draft_step int not null default 0,
  view_count int not null default 0,
  sales_count int not null default 0,
  avg_rating numeric(3, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists ix_vault_experiences_seller
  on public.vault_experiences (seller_id, status);

create index if not exists ix_vault_experiences_published
  on public.vault_experiences (status, published_at desc nulls last)
  where status = 'published';

create index if not exists ix_vault_experiences_company_role
  on public.vault_experiences (lower(company), lower(role))
  where status = 'published';

comment on table public.vault_experiences is 'Interview experience guides sold on the Interview Vault marketplace.';

create table if not exists public.vault_purchases (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.vault_experiences (id) on delete cascade,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  amount_inr int not null check (amount_inr >= 0),
  created_at timestamptz not null default now(),
  unique (experience_id, buyer_id)
);

create index if not exists ix_vault_purchases_buyer
  on public.vault_purchases (buyer_id, created_at desc);

create index if not exists ix_vault_purchases_experience
  on public.vault_purchases (experience_id, created_at desc);

comment on table public.vault_purchases is 'Buyer unlock records for vault experiences.';

create table if not exists public.vault_reviews (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.vault_experiences (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (experience_id, user_id)
);

create index if not exists ix_vault_reviews_experience
  on public.vault_reviews (experience_id, created_at desc);

comment on table public.vault_reviews is 'Ratings and reviews for purchased vault experiences.';

-- RLS
alter table public.vault_experiences enable row level security;
alter table public.vault_purchases enable row level security;
alter table public.vault_reviews enable row level security;

-- Published experiences visible to everyone; sellers see their own drafts too.
drop policy if exists vault_experiences_select on public.vault_experiences;
create policy vault_experiences_select
  on public.vault_experiences for select
  to anon, authenticated
  using (
    status = 'published'
    or (auth.uid() is not null and auth.uid() = seller_id)
  );

drop policy if exists vault_experiences_insert_own on public.vault_experiences;
create policy vault_experiences_insert_own
  on public.vault_experiences for insert
  to authenticated
  with check (auth.uid() = seller_id);

drop policy if exists vault_experiences_update_own on public.vault_experiences;
create policy vault_experiences_update_own
  on public.vault_experiences for update
  to authenticated
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

drop policy if exists vault_experiences_delete_own on public.vault_experiences;
create policy vault_experiences_delete_own
  on public.vault_experiences for delete
  to authenticated
  using (auth.uid() = seller_id);

drop policy if exists vault_purchases_select_own on public.vault_purchases;
create policy vault_purchases_select_own
  on public.vault_purchases for select
  to authenticated
  using (auth.uid() = buyer_id);

drop policy if exists vault_purchases_select_seller on public.vault_purchases;
create policy vault_purchases_select_seller
  on public.vault_purchases for select
  to authenticated
  using (
    exists (
      select 1 from public.vault_experiences e
      where e.id = experience_id and e.seller_id = auth.uid()
    )
  );

drop policy if exists vault_purchases_insert_own on public.vault_purchases;
create policy vault_purchases_insert_own
  on public.vault_purchases for insert
  to authenticated
  with check (auth.uid() = buyer_id);

drop policy if exists vault_reviews_select_all on public.vault_reviews;
create policy vault_reviews_select_all
  on public.vault_reviews for select
  to anon, authenticated
  using (true);

drop policy if exists vault_reviews_insert_purchaser on public.vault_reviews;
create policy vault_reviews_insert_purchaser
  on public.vault_reviews for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.vault_purchases p
      where p.experience_id = vault_reviews.experience_id
        and p.buyer_id = auth.uid()
    )
  );

drop policy if exists vault_reviews_update_own on public.vault_reviews;
create policy vault_reviews_update_own
  on public.vault_reviews for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select on public.vault_experiences to anon, authenticated;
grant insert, update, delete on public.vault_experiences to authenticated;
grant select, insert on public.vault_purchases to authenticated;
grant select, insert, update on public.vault_reviews to authenticated;

create or replace function public.set_vault_experiences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vault_experiences_updated_at on public.vault_experiences;
create trigger vault_experiences_updated_at
  before update on public.vault_experiences
  for each row
  execute function public.set_vault_experiences_updated_at();

create or replace function public.refresh_vault_experience_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.vault_experiences
  set avg_rating = (
    select round(avg(rating)::numeric, 2)
    from public.vault_reviews
    where experience_id = coalesce(new.experience_id, old.experience_id)
  )
  where id = coalesce(new.experience_id, old.experience_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists vault_reviews_refresh_rating on public.vault_reviews;
create trigger vault_reviews_refresh_rating
  after insert or update or delete on public.vault_reviews
  for each row
  execute function public.refresh_vault_experience_rating();

create or replace function public.increment_vault_sales_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.vault_experiences
  set sales_count = sales_count + 1
  where id = new.experience_id;
  return new;
end;
$$;

drop trigger if exists vault_purchases_increment_sales on public.vault_purchases;
create trigger vault_purchases_increment_sales
  after insert on public.vault_purchases
  for each row
  execute function public.increment_vault_sales_count();
