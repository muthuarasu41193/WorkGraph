-- User reports against public job listings. Reviewed by operators; not exposed in product UI lists.

CREATE TABLE IF NOT EXISTS public.job_listing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_public_id text NOT NULL,
  job_title text,
  job_company text,
  reason text NOT NULL,
  details text,
  reporter_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  reporter_email text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_listing_reports_reason_check CHECK (
    reason IN (
      'scam_payment',
      'scam_offplatform',
      'closed',
      'wrong_company',
      'duplicate',
      'other'
    )
  ),
  CONSTRAINT job_listing_reports_details_len CHECK (details IS NULL OR char_length(details) <= 2000)
);

CREATE INDEX IF NOT EXISTS ix_job_listing_reports_created
  ON public.job_listing_reports (created_at DESC);

CREATE INDEX IF NOT EXISTS ix_job_listing_reports_job
  ON public.job_listing_reports (job_public_id, created_at DESC);

COMMENT ON TABLE public.job_listing_reports IS
  'Seeker reports of suspicious or wrong job listings. Insert via service role from the Next.js API.';

ALTER TABLE public.job_listing_reports ENABLE ROW LEVEL SECURITY;

-- No direct client policies: inserts go through the authenticated/anonymous API with the service role.
DROP POLICY IF EXISTS job_listing_reports_no_direct ON public.job_listing_reports;

REVOKE ALL ON TABLE public.job_listing_reports FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.job_listing_reports TO service_role;
