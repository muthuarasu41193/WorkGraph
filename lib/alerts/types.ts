import type { AlertFrequency } from "@/lib/validation/alerts";

export type JobAlert = {
  id: string;
  user_id: string;
  name: string;
  /** Query string for /jobs, without the leading question mark. */
  query: string;
  min_match: number;
  frequency: AlertFrequency;
  discreet: boolean;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AlertMatchJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  applyUrl: string;
  postedAtIso: string | null;
  matchPercent: number;
  matchedSkills: string[];
  source: string;
};
