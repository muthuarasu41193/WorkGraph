-- Aggregated ATS job postings (synced by Python job_aggregator into the same Postgres instance).
-- Column layout matches job_aggregator/app/models.py Job model.

CREATE TABLE IF NOT EXISTS public.jobs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  external_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  apply_url text NOT NULL,
  posted_at timestamptz,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  embedding_json text,
  embedding_model_version text,
  content_hash text,
  CONSTRAINT uq_jobs_apply_url UNIQUE (apply_url),
  CONSTRAINT uq_jobs_external_id UNIQUE (external_id)
);

CREATE INDEX IF NOT EXISTS ix_jobs_source_posted_at ON public.jobs (source, posted_at DESC NULLS LAST);

COMMENT ON TABLE public.jobs IS 'Public ATS listings ingested via Greenhouse/Lever/Ashby JSON APIs (job_aggregator).';

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Logged-in users can read the shared job corpus for dashboards (no scraping — vendor APIs only).
DROP POLICY IF EXISTS jobs_select_authenticated ON public.jobs;
CREATE POLICY jobs_select_authenticated ON public.jobs FOR SELECT TO authenticated USING (true);

-- ---- Personal pipeline counters for the dashboard (optional; populate via future UI/API) ----

CREATE TABLE IF NOT EXISTS public.job_tracker_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('applied', 'interview', 'offers', 'saved')),
  created_at timestamptz NOT NULL DEFAULT now ()
);

CREATE INDEX IF NOT EXISTS ix_job_tracker_user ON public.job_tracker_entries (user_id);

COMMENT ON TABLE public.job_tracker_entries IS 'Per-user tallies for Applied / Interviews / Offers / Saved on profile dashboard.';

ALTER TABLE public.job_tracker_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_tracker_select_own ON public.job_tracker_entries;
CREATE POLICY job_tracker_select_own ON public.job_tracker_entries FOR SELECT TO authenticated USING (auth.uid () = user_id);

DROP POLICY IF EXISTS job_tracker_insert_own ON public.job_tracker_entries;
CREATE POLICY job_tracker_insert_own ON public.job_tracker_entries FOR INSERT TO authenticated WITH CHECK (auth.uid () = user_id);

DROP POLICY IF EXISTS job_tracker_delete_own ON public.job_tracker_entries;
CREATE POLICY job_tracker_delete_own ON public.job_tracker_entries FOR DELETE TO authenticated USING (auth.uid () = user_id);
