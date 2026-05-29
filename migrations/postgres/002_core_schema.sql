-- WorkGraph core tables (self-hosted PostgreSQL)

CREATE TABLE IF NOT EXISTS wg_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  display_name TEXT,
  auth_provider TEXT DEFAULT 'email',
  external_auth_id TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wg_profiles (
  id UUID PRIMARY KEY REFERENCES wg_users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  headline TEXT,
  summary TEXT,
  photo_url TEXT,
  years_of_experience INTEGER DEFAULT 0,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  work_experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  linkedin_url TEXT,
  github_url TEXT,
  website_url TEXT,
  resume_url TEXT,
  resume_raw_text TEXT,
  resume_embedding vector(384),
  ats_score INTEGER,
  ats_feedback JSONB,
  profile_completeness INTEGER NOT NULL DEFAULT 0,
  trust_score INTEGER NOT NULL DEFAULT 0,
  contribution_score INTEGER NOT NULL DEFAULT 0,
  credibility_badge TEXT,
  verification JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(512) NOT NULL UNIQUE,
  title VARCHAR(512) NOT NULL DEFAULT '',
  company VARCHAR(512) NOT NULL DEFAULT '',
  location VARCHAR(512) NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  apply_url VARCHAR(4096) NOT NULL UNIQUE,
  posted_at TIMESTAMPTZ,
  source VARCHAR(32) NOT NULL,
  kind VARCHAR(24) NOT NULL DEFAULT 'listing',
  classification VARCHAR(32) NOT NULL DEFAULT 'employer_hiring',
  is_community BOOLEAN NOT NULL DEFAULT false,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency VARCHAR(8) DEFAULT 'USD',
  remote_type VARCHAR(24),
  is_expired BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  embedding_json TEXT,
  embedding vector(384),
  embedding_model_version VARCHAR(128),
  content_hash VARCHAR(64),
  search_document JSONB
);

CREATE INDEX IF NOT EXISTS ix_jobs_source_posted_at ON jobs (source, posted_at DESC);
CREATE INDEX IF NOT EXISTS ix_jobs_remote_type ON jobs (remote_type) WHERE remote_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_jobs_embedding ON jobs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE IF NOT EXISTS wg_ats_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES wg_users(id) ON DELETE CASCADE,
  job_description TEXT,
  resume_text TEXT,
  score INTEGER NOT NULL,
  grade CHAR(1),
  feedback JSONB NOT NULL DEFAULT '{}'::jsonb,
  missing_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  weak_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_wg_ats_scores_user ON wg_ats_scores (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS wg_saved_jobs (
  user_id UUID NOT NULL REFERENCES wg_users(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, job_id)
);

CREATE TABLE IF NOT EXISTS wg_job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES wg_users(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'applied',
  notes TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);

CREATE TABLE IF NOT EXISTS wg_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES wg_users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  usage_limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  usage_counters JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wg_wallets (
  user_id UUID PRIMARY KEY REFERENCES wg_users(id) ON DELETE CASCADE,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  pending_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wg_community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES wg_users(id) ON DELETE SET NULL,
  post_type TEXT NOT NULL CHECK (post_type IN (
    'interview', 'review', 'salary', 'template', 'discussion', 'referral'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  company_name TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  reputation_delta INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  moderation_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wg_scraper_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  jobs_fetched INTEGER NOT NULL DEFAULT 0,
  jobs_upserted INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION wg_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wg_profiles_updated ON wg_profiles;
CREATE TRIGGER wg_profiles_updated
  BEFORE UPDATE ON wg_profiles
  FOR EACH ROW EXECUTE FUNCTION wg_touch_updated_at();
