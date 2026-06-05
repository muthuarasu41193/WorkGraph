/** WorkGraph Employer — Hiring Signals & graph connections (not ATS clones). */

export type HiringIntent = "exploring" | "actively_hiring" | "backfill" | "stealth";
export type WorkMode = "remote" | "hybrid" | "onsite" | "flexible";
export type HiringSignalStatus = "draft" | "live" | "paused" | "closed";
export type ConnectionStage = "incoming" | "reviewing" | "dialogue" | "aligned" | "passed";

export type FitSignalKind = "skill" | "trait" | "context";

export type FitSignal = {
  label: string;
  kind: FitSignalKind;
  weight: number;
};

export type FitSnapshot = {
  matchPercent: number;
  matchedSignals: string[];
  profileCompleteness: number;
  headline?: string | null;
};

export type EmployerVerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export type EmployerProfile = {
  id: string;
  company_name: string;
  company_slug: string;
  tagline: string | null;
  website_url: string | null;
  logo_url: string | null;
  hiring_philosophy: string | null;
  team_size: string | null;
  verification_status: EmployerVerificationStatus;
  verified_at: string | null;
  verified_domain: string | null;
  created_at: string;
  updated_at: string;
};

export const VERIFICATION_STATUS_LABELS: Record<EmployerVerificationStatus, string> = {
  unverified: "Not verified",
  pending: "Verification pending",
  verified: "Verified employer",
  rejected: "Verification declined",
};

export type HiringSignal = {
  id: string;
  employer_id: string;
  title: string;
  location: string;
  work_mode: WorkMode;
  hiring_intent: HiringIntent;
  why_now: string;
  description: string;
  fit_signals: FitSignal[];
  comp_hint: string | null;
  status: HiringSignalStatus;
  applies_count: number;
  published_at: string | null;
  closes_at: string | null;
  created_at: string;
  updated_at: string;
  employer?: Pick<
    EmployerProfile,
    "company_name" | "company_slug" | "tagline" | "logo_url" | "verification_status" | "verified_at"
  >;
};

export type SignalConnection = {
  id: string;
  signal_id: string;
  seeker_id: string;
  connection_note: string;
  fit_snapshot: FitSnapshot;
  stage: ConnectionStage;
  employer_reply: string | null;
  created_at: string;
  updated_at: string;
  signal?: Pick<HiringSignal, "id" | "title" | "employer_id">;
  seeker?: {
    full_name: string | null;
    headline: string | null;
    email: string | null;
    skills: string[];
    profile_completeness: number;
  };
};

export const HIRING_INTENT_LABELS: Record<HiringIntent, string> = {
  exploring: "Exploring talent",
  actively_hiring: "Actively hiring",
  backfill: "Backfill / urgent",
  stealth: "Stealth / confidential",
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
  flexible: "Flexible",
};

export const CONNECTION_STAGE_LABELS: Record<ConnectionStage, string> = {
  incoming: "Incoming",
  reviewing: "Reviewing",
  dialogue: "In dialogue",
  aligned: "Aligned",
  passed: "Passed",
};

export const CONNECTION_STAGE_ORDER: ConnectionStage[] = [
  "incoming",
  "reviewing",
  "dialogue",
  "aligned",
  "passed",
];

export function isHiringIntent(v: string): v is HiringIntent {
  return v === "exploring" || v === "actively_hiring" || v === "backfill" || v === "stealth";
}

export function isWorkMode(v: string): v is WorkMode {
  return v === "remote" || v === "hybrid" || v === "onsite" || v === "flexible";
}

export function isHiringSignalStatus(v: string): v is HiringSignalStatus {
  return v === "draft" || v === "live" || v === "paused" || v === "closed";
}

export function isConnectionStage(v: string): v is ConnectionStage {
  return (
    v === "incoming" ||
    v === "reviewing" ||
    v === "dialogue" ||
    v === "aligned" ||
    v === "passed"
  );
}

export function slugifyCompany(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "company";
}
