/**
 * Server-side WorkGraph Pass catalog.
 * Checkout never trusts an amount from the browser. Order creation reads this file.
 */

export const PASS_PLAN_IDS = ["pass_30", "pass_90"] as const;

export type PassPlanId = (typeof PASS_PLAN_IDS)[number];

export type PassPlan = {
  id: PassPlanId;
  label: string;
  amountPaise: number;
  currency: "INR";
  days: number;
  tier: "premium";
};

export const PASS_PLANS: Record<PassPlanId, PassPlan> = {
  pass_30: {
    id: "pass_30",
    label: "WorkGraph Pass, 30 days",
    amountPaise: 29900,
    currency: "INR",
    days: 30,
    tier: "premium",
  },
  pass_90: {
    id: "pass_90",
    label: "WorkGraph Pass, 90 days",
    amountPaise: 69900,
    currency: "INR",
    days: 90,
    tier: "premium",
  },
};

/**
 * TODO(founder): Confirm the tax line before taking live payments.
 * Replace PASS_TAX_WORDING_TODO with exactly one of these strings:
 * "incl. of applicable taxes"
 * "+ GST"
 */
export const PASS_TAX_WORDING_TODO =
  'TODO: confirm tax wording — "incl. of applicable taxes" or "+ GST"';

export function isPassPlanId(value: string): value is PassPlanId {
  return (PASS_PLAN_IDS as readonly string[]).includes(value);
}

export function getPlan(planId: string): PassPlan | null {
  return isPassPlanId(planId) ? PASS_PLANS[planId] : null;
}
