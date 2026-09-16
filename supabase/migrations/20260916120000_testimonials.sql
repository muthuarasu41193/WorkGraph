-- Consented public testimonials for the marketing site. Never seed fabricated quotes.

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_title text,
  quote text not null,
  consent_given_at timestamptz,
  is_employee boolean not null default false,
  verified_outcome text,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists ix_testimonials_consented
  on public.testimonials (consent_given_at desc)
  where consent_given_at is not null;

comment on table public.testimonials is
  'Marketing quotes. Render only when consent_given_at is set. Disclose is_employee as WorkGraph team member.';

alter table public.testimonials enable row level security;

drop policy if exists testimonials_select_consented on public.testimonials;
create policy testimonials_select_consented
  on public.testimonials for select
  to anon, authenticated
  using (consent_given_at is not null);

grant select on public.testimonials to anon, authenticated;
