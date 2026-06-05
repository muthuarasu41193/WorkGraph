-- Employer verification + public company discovery (anon read for verified employers).

create type public.employer_verification_status as enum (
  'unverified',
  'pending',
  'verified',
  'rejected'
);

alter table public.employer_profiles
  add column if not exists verification_status public.employer_verification_status not null default 'unverified',
  add column if not exists verified_at timestamptz,
  add column if not exists verified_domain text,
  add column if not exists verification_requested_at timestamptz,
  add column if not exists verification_note text;

comment on column public.employer_profiles.verified_domain is 'Email or website domain used for verification match.';

-- Anon/authenticated can view verified employer profiles on public company pages.
drop policy if exists employer_profiles_select_anon_verified on public.employer_profiles;
create policy employer_profiles_select_anon_verified
  on public.employer_profiles for select
  to anon, authenticated
  using (verification_status = 'verified');

-- Live signals from verified employers are public on company pages.
drop policy if exists hiring_signals_select_anon_public on public.hiring_signals;
create policy hiring_signals_select_anon_public
  on public.hiring_signals for select
  to anon, authenticated
  using (
    status = 'live'
    and exists (
      select 1 from public.employer_profiles ep
      where ep.id = hiring_signals.employer_id
        and ep.verification_status = 'verified'
    )
  );

grant select on public.employer_profiles to anon;
grant select on public.hiring_signals to anon;
