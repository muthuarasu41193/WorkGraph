-- Hidden Jobs Discovery analytics & saved opportunities

CREATE TABLE IF NOT EXISTS public.hidden_job_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  opportunity_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('view', 'click', 'save')),
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_hidden_job_analytics_user_created
  ON public.hidden_job_analytics (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_hidden_job_analytics_opportunity
  ON public.hidden_job_analytics (opportunity_id, event_type);

COMMENT ON TABLE public.hidden_job_analytics IS 'Events for Hidden Jobs Discovery (views, outbound clicks, saves).';

ALTER TABLE public.hidden_job_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hidden_job_analytics_insert_authenticated ON public.hidden_job_analytics;
CREATE POLICY hidden_job_analytics_insert_authenticated ON public.hidden_job_analytics
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR auth.uid () = user_id);

DROP POLICY IF EXISTS hidden_job_analytics_select_own ON public.hidden_job_analytics;
CREATE POLICY hidden_job_analytics_select_own ON public.hidden_job_analytics
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR auth.uid () = user_id);

CREATE TABLE IF NOT EXISTS public.hidden_job_saves (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  opportunity_id text NOT NULL,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS ix_hidden_job_saves_user_updated
  ON public.hidden_job_saves (user_id, updated_at DESC);

COMMENT ON TABLE public.hidden_job_saves IS 'User-saved Hidden Jobs Discovery opportunities.';

ALTER TABLE public.hidden_job_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hidden_job_saves_select_own ON public.hidden_job_saves;
CREATE POLICY hidden_job_saves_select_own ON public.hidden_job_saves
  FOR SELECT TO authenticated
  USING (auth.uid () = user_id);

DROP POLICY IF EXISTS hidden_job_saves_upsert_own ON public.hidden_job_saves;
CREATE POLICY hidden_job_saves_insert_own ON public.hidden_job_saves
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid () = user_id);

DROP POLICY IF EXISTS hidden_job_saves_update_own ON public.hidden_job_saves;
CREATE POLICY hidden_job_saves_update_own ON public.hidden_job_saves
  FOR UPDATE TO authenticated
  USING (auth.uid () = user_id)
  WITH CHECK (auth.uid () = user_id);

DROP POLICY IF EXISTS hidden_job_saves_delete_own ON public.hidden_job_saves;
CREATE POLICY hidden_job_saves_delete_own ON public.hidden_job_saves
  FOR DELETE TO authenticated
  USING (auth.uid () = user_id);
