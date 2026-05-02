-- Allow reading aggregated ATS listings with the anon key (same key shipped in NEXT_PUBLIC_*).
-- Fixes dashboards when SSR cookie/session attachment uses the anon PostgREST role.
-- Listing content is already vendor-public job posts; apply stricter policies if you add PII.

DROP POLICY IF EXISTS jobs_select_anon ON public.jobs;
CREATE POLICY jobs_select_anon ON public.jobs FOR SELECT TO anon USING (true);
