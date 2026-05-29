/** Phase 3 — community, wallet, dashboard types. */

export type CommunityPostType =
  | "interview"
  | "review"
  | "salary"
  | "template"
  | "discussion"
  | "referral";

export type ModerationStatus = "pending" | "approved" | "rejected";

export type CommunityPost = {
  id: string;
  author_id: string | null;
  author_display: string;
  post_type: CommunityPostType;
  title: string;
  body: string;
  company_name: string | null;
  is_anonymous: boolean;
  upvotes: number;
  downvotes: number;
  reputation_delta: number;
  moderation_status: ModerationStatus;
  user_vote: -1 | 0 | 1;
  created_at: string;
};

export type WalletSummary = {
  balance_cents: number;
  pending_cents: number;
  currency: string;
  lifetime_earned_cents: number;
};

export type WalletTransaction = {
  id: string;
  amount_cents: number;
  kind: "earn" | "payout_request" | "payout" | "adjustment";
  status: "pending" | "completed" | "rejected" | "cancelled";
  description: string | null;
  created_at: string;
};

export type DashboardSnapshot = {
  profile_completeness: number;
  ats_score: number | null;
  trust_score: number;
  contribution_score: number;
  saved_jobs_count: number;
  applications_count: number;
};

export type AuthProvider = "supabase" | "supertokens";
