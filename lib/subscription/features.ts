/** Paid features that canUse() may gate. Job search, matching, tracker, and hidden jobs are not in this list. */
export const PAID_FEATURES = [
  "cover_letter",
  "tailoring",
  "talent_intelligence",
  "ats_score",
] as const;

export type PaidFeature = (typeof PAID_FEATURES)[number];

export function isPaidFeature(value: string): value is PaidFeature {
  return (PAID_FEATURES as readonly string[]).includes(value);
}
