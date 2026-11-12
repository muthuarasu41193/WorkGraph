/**
 * Prep-pack types. Shareable payloads never include pasted job descriptions,
 * resumes, or private profile fields.
 */

export const PREP_SOURCE_KINDS = [
  "job_description",
  "role_template",
  "firsthand_guide",
  "estimate",
] as const;

export type PrepSourceKind = (typeof PREP_SOURCE_KINDS)[number];

export const PREP_SOURCE_LABELS: Record<PrepSourceKind, string> = {
  job_description: "From the job description",
  role_template: "From a role template",
  firsthand_guide: "Firsthand Interview Vault guide",
  estimate: "Estimate — not a hiring judgment",
};

export type PrepPackGuideMatch = {
  id: string;
  company: string;
  role: string;
  level: string | null;
  rounds: number | null;
  interview_date: string | null;
  price_inr: number;
  preview: string;
  avg_rating: number | null;
  freshness_label: string;
  match_reason: string;
  source: PrepSourceKind;
};

export type PrepPackChecklistItem = {
  id: string;
  label: string;
  source: PrepSourceKind;
};

export type PrepPackSkill = {
  name: string;
  source: PrepSourceKind;
  kind: "required" | "preferred" | "practice";
};

export type PrepPackResult = {
  title: string | null;
  company: string | null;
  seniority: string | null;
  input_mode: "job_description" | "role_template";
  role_template_id: string | null;
  requirements: PrepPackSkill[];
  guides: PrepPackGuideMatch[];
  checklist: PrepPackChecklistItem[];
  practice_topics: PrepPackSkill[];
  disclaimers: string[];
  /** Present only after a share is created. Never includes JD text. */
  share_id?: string;
};

export type PrepPackSharePayload = Omit<PrepPackResult, "share_id"> & {
  created_at: string;
};

export type ComposePrepPackInput = {
  jobDescription?: string;
  roleTemplateId?: string;
  companyHint?: string;
  titleHint?: string;
};
