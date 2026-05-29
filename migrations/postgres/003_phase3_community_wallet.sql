-- Phase 3: community votes + wallet ledger

CREATE TABLE IF NOT EXISTS wg_community_votes (
  user_id UUID NOT NULL REFERENCES wg_users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES wg_community_posts(id) ON DELETE CASCADE,
  vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS ix_wg_community_posts_type_created
  ON wg_community_posts (post_type, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_wg_community_posts_moderation
  ON wg_community_posts (moderation_status, created_at DESC);

CREATE TABLE IF NOT EXISTS wg_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES wg_users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('earn', 'payout_request', 'payout', 'adjustment')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'rejected', 'cancelled')),
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_wg_wallet_tx_user ON wg_wallet_transactions (user_id, created_at DESC);
