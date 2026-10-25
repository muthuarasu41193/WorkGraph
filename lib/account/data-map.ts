/**
 * Account-owned tables verified against supabase/migrations.
 *
 * jobs and testimonials are not listed: neither has a user, owner, seller,
 * buyer, seeker, or employer column, and neither references auth.users.
 * workgraph_embeddings is user-scoped only when owner_user_id is set.
 * Null-owner rows are catalog vectors and are not part of an account.
 *
 * The coverage test parses the SQL. A new table with an owner column fails
 * that test until it is added here.
 */

export type DeleteStrategy = "delete" | "anonymise" | "keep-for-legal";

export type AccountTable = {
  table: string;
  /** Column that identifies this account. Every query must filter on it. */
  ownerColumn: string;
  export: boolean;
  deleteStrategy: DeleteStrategy;
  /** Short label for Settings and the privacy policy. */
  label: string;
};

/**
 * Order is the delete order. Unlink steps (anonymise / keep-for-legal) run
 * before row deletes. Storage is removed before any of these. The auth user
 * is deleted last so a failed step can be retried while the session still exists.
 *
 * Vault guides and hiring signals reference auth.users with ON DELETE CASCADE,
 * and purchases, reviews, and connections cascade from those rows. Deleting a
 * published guide also removes purchase rows that point at it. Deleting a
 * hiring signal also removes connections other people sent to it.
 */
export const ACCOUNT_TABLES: readonly AccountTable[] = [
  {
    table: "hidden_job_analytics",
    ownerColumn: "user_id",
    export: true,
    deleteStrategy: "anonymise",
    label: "Hidden-job view, click, and save events (the link to your account is removed; the event row stays)",
  },
  {
    table: "consent_log",
    ownerColumn: "user_id",
    export: true,
    deleteStrategy: "anonymise",
    label: "Consent audit rows (your user id is removed; the audit row stays)",
  },
  {
    table: "payments",
    ownerColumn: "user_id",
    export: true,
    deleteStrategy: "keep-for-legal",
    label: "WorkGraph Pass payment records (kept with your user id removed, for tax and accounting)",
  },
  {
    table: "resume_intelligence_feedback",
    ownerColumn: "user_id",
    export: true,
    deleteStrategy: "delete",
    label: "Feedback you left on Talent Intelligence reports",
  },
  {
    table: "resume_intelligence_reports",
    ownerColumn: "user_id",
    export: true,
    deleteStrategy: "delete",
    label: "Talent Intelligence reports, including stored scores and job-description text",
  },
  {
    table: "resume_versions",
    ownerColumn: "user_id",
    export: true,
    deleteStrategy: "delete",
    label: "Saved resume versions and their parsed snapshots",
  },
  {
    table: "cover_letters",
    ownerColumn: "user_id",
    export: true,
    deleteStrategy: "delete",
    label: "Cover letters",
  },
  {
    table: "applications",
    ownerColumn: "user_id",
    export: true,
    deleteStrategy: "delete",
    label: "Job applications, notes, and contacts",
  },
  {
    table: "job_tracker_entries",
    ownerColumn: "user_id",
    export: true,
    deleteStrategy: "delete",
    label: "Application status counts",
  },
  {
    table: "hidden_job_saves",
    ownerColumn: "user_id",
    export: true,
    deleteStrategy: "delete",
    label: "Saved hidden jobs",
  },
  {
    table: "feature_usage",
    ownerColumn: "user_id",
    export: true,
    deleteStrategy: "delete",
    label: "Records of cover letter, tailoring, Talent Intelligence, and ATS use",
  },
  {
    table: "signal_connections",
    ownerColumn: "seeker_id",
    export: true,
    deleteStrategy: "delete",
    label: "Connections you sent to hiring signals, including the snapshot you submitted",
  },
  {
    table: "vault_reviews",
    ownerColumn: "user_id",
    export: true,
    deleteStrategy: "delete",
    label: "Interview Vault reviews you wrote",
  },
  {
    table: "vault_purchases",
    ownerColumn: "buyer_id",
    export: true,
    deleteStrategy: "delete",
    label: "Interview Vault purchases you made",
  },
  {
    table: "vault_experiences",
    ownerColumn: "seller_id",
    export: true,
    deleteStrategy: "delete",
    label: "Interview Vault guides you published",
  },
  {
    table: "hiring_signals",
    ownerColumn: "employer_id",
    export: true,
    deleteStrategy: "delete",
    label: "Hiring signals you posted",
  },
  {
    table: "employer_profiles",
    ownerColumn: "id",
    export: true,
    deleteStrategy: "delete",
    label: "Employer profile",
  },
  {
    table: "workgraph_embeddings",
    ownerColumn: "owner_user_id",
    export: true,
    deleteStrategy: "delete",
    label: "Embeddings created from your profile or resume (catalog rows with no owner are not included)",
  },
  {
    table: "profiles",
    ownerColumn: "id",
    export: true,
    deleteStrategy: "delete",
    label: "Profile, including your name, email, phone, resume text, and resume file details",
  },
] as const;

export const ACCOUNT_STORAGE_BUCKETS = ["resumes", "avatars"] as const;

export type AccountStorageBucket = (typeof ACCOUNT_STORAGE_BUCKETS)[number];

export const TABLES_WITHOUT_ACCOUNT_OWNER = ["jobs", "testimonials"] as const;

export function accountTable(table: string): AccountTable | undefined {
  return ACCOUNT_TABLES.find((entry) => entry.table === table);
}

export function isAccountStorageBucket(bucket: string): bucket is AccountStorageBucket {
  return (ACCOUNT_STORAGE_BUCKETS as readonly string[]).includes(bucket);
}
