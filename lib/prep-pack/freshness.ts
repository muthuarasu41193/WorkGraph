/** Interview Vault freshness labels from interview_date or published_at. */

export const VAULT_FRESH_DAYS = 180;
export const VAULT_AGING_DAYS = 365;

export function daysSince(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((now - then) / 86_400_000);
}

export function vaultFreshnessLabel(
  interviewDate: string | null | undefined,
  publishedAt?: string | null,
  now = Date.now(),
): string {
  const fromInterview = daysSince(interviewDate, now);
  if (fromInterview != null) {
    if (fromInterview <= VAULT_FRESH_DAYS) {
      return `Interview reported within ${VAULT_FRESH_DAYS} days`;
    }
    if (fromInterview <= VAULT_AGING_DAYS) {
      return `Interview reported ${fromInterview} days ago`;
    }
    return `Older interview report (${fromInterview} days ago)`;
  }

  const fromPublished = daysSince(publishedAt, now);
  if (fromPublished != null) {
    if (fromPublished <= VAULT_FRESH_DAYS) return `Published within ${VAULT_FRESH_DAYS} days`;
    return `Published ${fromPublished} days ago · interview date not provided`;
  }

  return "Interview date not provided";
}
