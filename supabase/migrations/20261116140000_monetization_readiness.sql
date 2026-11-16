-- Milestone D: monetization readiness (additive).
-- 1) Count vault sales only after verified payment.
-- 2) Expand product_events allow-list for validation funnel events.
--
-- Apply (local/staging SQL Editor or supabase db push — NOT against production from agents):
--   psql "$DATABASE_URL" -f supabase/migrations/20261116140000_monetization_readiness.sql
--
-- Rollback:
--   1) Restore sales trigger to insert-only (see 20260602140000_vault_experiences.sql).
--   2) Drop product_events_event_check and recreate with the previous allow-list
--      from 20261103210000_product_events.sql (without the Milestone D names).
--   3) Optionally leave sales_count as recomputed from verified rows (safe).

-- ---------------------------------------------------------------------------
-- Sales count: only verified purchases
-- ---------------------------------------------------------------------------

create or replace function public.increment_vault_sales_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert of an already-verified row (service role / future verifier).
  if tg_op = 'INSERT' and new.payment_status = 'verified' then
    update public.vault_experiences
    set sales_count = sales_count + 1
    where id = new.experience_id;
    return new;
  end if;

  -- Transition pending/failed → verified (idempotent verifier replay).
  if tg_op = 'UPDATE'
     and new.payment_status = 'verified'
     and coalesce(old.payment_status, '') is distinct from 'verified' then
    update public.vault_experiences
    set sales_count = sales_count + 1
    where id = new.experience_id;
  end if;

  return new;
end;
$$;

drop trigger if exists vault_purchases_increment_sales on public.vault_purchases;
create trigger vault_purchases_increment_sales
  after insert or update of payment_status on public.vault_purchases
  for each row
  execute function public.increment_vault_sales_count();

-- Reconcile inflated counts from pending-intent inserts.
update public.vault_experiences e
set sales_count = (
  select count(*)::int
  from public.vault_purchases p
  where p.experience_id = e.id
    and p.payment_status = 'verified'
);

comment on function public.increment_vault_sales_count() is
  'Increments sales_count only when a purchase becomes verified. Pending intents do not count as sales.';

-- ---------------------------------------------------------------------------
-- product_events allow-list expansion (Milestone D validation)
-- ---------------------------------------------------------------------------

alter table public.product_events drop constraint if exists product_events_event_check;
alter table public.product_events
  add constraint product_events_event_check
  check (event in (
    'signup',
    'resume_uploaded',
    'match_viewed',
    'tailoring_run',
    'cover_letter',
    'pass_checkout_started',
    'pass_purchased',
    'vault_purchased',
    'digest_sent',
    'digest_unsubscribed',
    'application_added',
    'follow_up_marked',
    'prep_pack_started',
    'prep_pack_completed',
    'vault_guide_clicked',
    'vault_return_visit',
    'vault_guide_freshness',
    'vault_contributor_earnings'
  ));
