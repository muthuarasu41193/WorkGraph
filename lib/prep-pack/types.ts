/** Types for the free interview prep pack (Milestone A). */

export type PrepPackSkill = {
  name: string;
  /** Where the skill came from in this estimate. */
  source: "job_description" | "role_focus";
};

export type PrepPackGuideMatch = {
  id: string;
  company: string;
  role: string;
  level: string | null;
  difficulty: string | null;
  rounds: number | null;
  avg_rating: number | null;
  price_inr: number;
  href: string;
  /** Human-readable reasons this guide was included (estimate only). */
  why: string[];
  score: number;
};

export type PrepPackChecklistItem = {
  id: string;
  text: string;
  /** Round label when known; otherwise a general prep bucket. */
  round: string;
};

export type PrepPackRoleOption = {
  id: string;
  label: string;
};

export type PrepPackResult = {
  role: PrepPackRoleOption | null;
  skills: PrepPackSkill[];
  guides: PrepPackGuideMatch[];
  checklist: PrepPackChecklistItem[];
  /** Always true in product copy: match output is an estimate. */
  estimateNotice: string;
  /** Distinct client state when no published guides scored above the threshold. */
  status: "ok" | "no_matches";
};

export type PrepPackGuideCandidate = {
  id: string;
  company: string;
  role: string;
  level: string | null;
  difficulty: string | null;
  rounds: number | null;
  avg_rating: number | null;
  price_inr: number;
  /** Round names from published guide data when present. */
  roundNames: string[];
};

export type SavedPrepPackSummary = {
  id: string;
  role_id: string | null;
  role_label: string | null;
  skill_count: number;
  guide_count: number;
  created_at: string;
  updated_at: string;
};

export type SavedPrepPack = SavedPrepPackSummary & {
  skills: PrepPackSkill[];
  guides: PrepPackGuideMatch[];
  checklist: PrepPackChecklistItem[];
  estimate_notice: string;
};
