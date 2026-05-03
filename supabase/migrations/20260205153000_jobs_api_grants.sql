-- PostgREST checks table privileges before RLS. Policies alone are not enough: without
-- SELECT on public.jobs, anon/authenticated clients get permission errors and the
-- profile dashboard shows zero listings even after ingest.

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.jobs TO anon, authenticated;
