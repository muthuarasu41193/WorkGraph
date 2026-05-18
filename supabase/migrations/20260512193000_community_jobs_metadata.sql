-- Community job posts metadata for separate source-specific discovery lanes.
-- Keeps public.jobs as the single ingestion table while allowing the app to
-- distinguish ATS listings from community posts and classify lower-quality discussions.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'listing',
  ADD COLUMN IF NOT EXISTS classification text NOT NULL DEFAULT 'employer_hiring',
  ADD COLUMN IF NOT EXISTS is_community boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS ix_jobs_community_posted_at
  ON public.jobs (is_community, posted_at DESC NULLS LAST);

COMMENT ON COLUMN public.jobs.kind IS 'listing or post; distinguishes structured job listings from community-style posts.';
COMMENT ON COLUMN public.jobs.classification IS 'Community classification such as employer_hiring, candidate_for_hire, freelance, internship, remote, discussion_only.';
COMMENT ON COLUMN public.jobs.is_community IS 'True when the row came from community/public-feed sources like Reddit, Hacker News, RemoteOK, Jobicy, or Arbeitnow.';
