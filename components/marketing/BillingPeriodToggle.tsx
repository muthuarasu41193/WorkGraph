"use client";

import { cn } from "@/lib/utils";
import type { SeekerBillingPeriod } from "@/lib/billing/pricing-display";
import { Text } from "@/components/ui/text";

type Props = {
  period: SeekerBillingPeriod;
  onChange: (period: SeekerBillingPeriod) => void;
  /** Formatted savings for the longer Pass, e.g. "Save ₹198". */
  annualSavingsLabel: string | null;
  disabled?: boolean;
  className?: string;
};

/**
 * Monthly / annual control for seekers.
 * Monthly maps to the 30-day Pass. Annual maps to the 90-day Pass we sell today
 * (one-time, not a subscription). See PricingTiers for the mapping copy.
 */
export function BillingPeriodToggle({
  period,
  onChange,
  annualSavingsLabel,
  disabled = false,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-col items-start gap-2 sm:items-center", className)}>
      <div
        className="inline-flex rounded-control border border-hairline bg-surface-sunken p-1"
        role="group"
        aria-label="Pass length"
      >
        <button
          type="button"
          disabled={disabled}
          aria-pressed={period === "monthly"}
          onClick={() => onChange("monthly")}
          className={cn(
            "min-h-11 rounded-control px-4 text-role-body-small font-medium transition-colors duration-base ease-standard",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
            period === "monthly"
              ? "bg-surface-raised text-ink shadow-raised"
              : "text-ink-muted hover:text-ink",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          Monthly
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={period === "annual"}
          onClick={() => onChange("annual")}
          className={cn(
            "min-h-11 rounded-control px-4 text-role-body-small font-medium transition-colors duration-base ease-standard",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
            period === "annual"
              ? "bg-surface-raised text-ink shadow-raised"
              : "text-ink-muted hover:text-ink",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          Annual
        </button>
      </div>
      {period === "annual" && annualSavingsLabel ? (
        <Text role="body-small" className="text-positive">
          {annualSavingsLabel}
        </Text>
      ) : (
        <Text role="caption" className="text-ink-subtle">
          One-time Pass lengths. Not a renewing subscription.
        </Text>
      )}
    </div>
  );
}
