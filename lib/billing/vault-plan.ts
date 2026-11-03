const VAULT_PLAN_PREFIX = "vault:";

const EXPERIENCE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Encode a vault experience id into payments.plan_id. */
export function vaultPlanId(experienceId: string): string {
  return `${VAULT_PLAN_PREFIX}${experienceId}`;
}

/** Parse payments.plan_id back to an experience id, or null if not a vault plan. */
export function parseVaultExperienceId(planId: string): string | null {
  if (!planId.startsWith(VAULT_PLAN_PREFIX)) return null;
  const id = planId.slice(VAULT_PLAN_PREFIX.length);
  if (!EXPERIENCE_ID_RE.test(id)) return null;
  return id;
}

export function isVaultPlanId(planId: string): boolean {
  return parseVaultExperienceId(planId) !== null;
}

/** Server-side INR → paise. Never trust a client amount. */
export function inrToPaise(priceInr: number): number {
  if (!Number.isFinite(priceInr) || priceInr <= 0) return 0;
  return Math.round(priceInr * 100);
}
