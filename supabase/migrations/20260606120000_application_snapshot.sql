-- Job application package: profile links + snapshot sent to employers on connect.

alter table public.profiles
  add column if not exists stackoverflow_url text;

comment on column public.profiles.stackoverflow_url is 'Public Stack Overflow profile URL for job applications.';

alter table public.signal_connections
  add column if not exists application_snapshot jsonb not null default '{}'::jsonb;

comment on column public.signal_connections.application_snapshot is
  'Point-in-time applicant package (resume, links, experience) shared with the employer — excludes phone.';
