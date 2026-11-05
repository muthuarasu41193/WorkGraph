"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BillingPeriodToggle } from "@/components/marketing/BillingPeriodToggle";
import { PassCheckout, type PassCheckoutOption } from "@/components/marketing/PassCheckout";
import { PricingFaq, type PricingFaqItem } from "@/components/marketing/PricingFaq";
import { RazorpayMark } from "@/components/marketing/RazorpayMark";
import { Text } from "@/components/ui/text";
import {
  approximateInVisitorCurrency,
  formatPaise,
  pass90SavingsPaise,
  passPlanIdForPeriod,
  type SeekerBillingPeriod,
} from "@/lib/billing/pricing-display";
import { PASS_PLANS, type PassPlanId } from "@/lib/billing/plans";
import type { SupportedCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

export type SeekerPricingLimits = {
  freeCoverLettersPerMonth: number;
  freeTailoringPerMonth: number;
  proCoverLettersPerMonth: number;
};

/** Fallback when the server does not pass LIMITS. Keep in sync with lib/subscription. */
// TODO(data) prefer limits prop from PricingTiers so this never drifts
const FALLBACK_LIMITS: SeekerPricingLimits = {
  freeCoverLettersPerMonth: 3,
  freeTailoringPerMonth: 2,
  proCoverLettersPerMonth: -1,
};

export type SeekerPricingProps = {
  signedIn: boolean;
  locale: string;
  /** Display currency inferred from the visitor. Charge remains INR via Razorpay. */
  displayCurrency: SupportedCurrency;
  taxWording: string;
  limits?: SeekerPricingLimits;
  /**
   * Optional display override for the Annual toggle.
   * // TODO(data) publish when founder sets a yearly amount and a matching PassPlanId exists.
   * Until then the Annual toggle shows the 90-day catalog Pass.
   */
  annualPlan?: {
    label: string;
    amountPaise: number;
    days: number;
  } | null;
  faqItems?: PricingFaqItem[];
  /** Gallery / storybook state overrides */
  state?: "populated" | "loading" | "empty" | "error";
  className?: string;
};

function limitLabel(value: number, noun: string): string {
  if (value < 0) return `Unlimited ${noun}`;
  return `${value} ${noun}`;
}

function FreeIncludes({ limits }: { limits: SeekerPricingLimits }) {
  return (
    <ul className="mt-4 space-y-2 text-role-body-small text-ink-muted">
      <li>Search the job index with no account required to browse.</li>
      <li>Log applications in the tracker once you sign in.</li>
      <li>
        {limitLabel(limits.freeCoverLettersPerMonth, "cover letters per month")}.
      </li>
      <li>
        {limitLabel(limits.freeTailoringPerMonth, "resume tailorings per month")}.
      </li>
      <li>Weekly job alerts. Daily alerts need a Pass.</li>
    </ul>
  );
}

function PassIncludes() {
  return (
    <ul className="mt-4 space-y-2 text-role-body-small text-ink-muted">
      <li>Unlimited cover letters for the Pass length.</li>
      <li>Unlimited resume tailoring for the Pass length.</li>
      <li>Daily job alerts while the Pass is active.</li>
      <li>Everything on Free stays available after the Pass ends.</li>
    </ul>
  );
}

export function SeekerPricing({
  signedIn,
  locale,
  displayCurrency,
  taxWording,
  limits = FALLBACK_LIMITS,
  annualPlan = null,
  faqItems,
  state = "populated",
  className,
}: SeekerPricingProps) {
  const [period, setPeriod] = useState<SeekerBillingPeriod>("monthly");

  const selectedPlanId = passPlanIdForPeriod(period);
  const catalogPlan = PASS_PLANS[selectedPlanId];
  // TODO(data) when founder publishes an annual Pass, prefer annualPlan for period === "annual"
  const displayAmountPaise =
    period === "annual" && annualPlan ? annualPlan.amountPaise : catalogPlan.amountPaise;
  const displayLabel =
    period === "annual" && annualPlan ? annualPlan.label : catalogPlan.label;
  // Checkout always uses a catalog PassPlanId so Razorpay order amounts stay server-trusted.
  const checkoutPlanId: PassPlanId = catalogPlan.id;
  const checkoutAmountPaise = catalogPlan.amountPaise;

  const priceLabel = formatPaise(displayAmountPaise, locale, "INR");
  const approx = approximateInVisitorCurrency(displayAmountPaise, displayCurrency, locale);

  const savingsPaise = pass90SavingsPaise(
    PASS_PLANS.pass_30.amountPaise,
    annualPlan?.amountPaise ?? PASS_PLANS.pass_90.amountPaise,
  );
  const approxSavings = approximateInVisitorCurrency(savingsPaise, displayCurrency, locale);
  const annualSavingsLabel =
    savingsPaise > 0
      ? `Save ${formatPaise(savingsPaise, locale, "INR")}${
          approxSavings ? ` (about ${approxSavings})` : ""
        } vs three 30-day Passes`
      : null;

  const checkoutOptions: PassCheckoutOption[] = useMemo(
    () => [
      {
        id: checkoutPlanId,
        label: displayLabel,
        priceLabel: formatPaise(checkoutAmountPaise, locale, "INR"),
        amountPaise: checkoutAmountPaise,
        currency: "INR",
      },
    ],
    [checkoutPlanId, displayLabel, checkoutAmountPaise, locale],
  );

  if (state === "loading") {
    return (
      <div className={cn("space-y-6", className)} aria-busy="true" aria-live="polite">
        <div className="h-11 w-48 animate-pulse rounded-control bg-surface-sunken" />
        <div className="h-40 animate-pulse rounded-card bg-surface-sunken" />
        <div className="h-24 animate-pulse bg-surface-sunken" />
        <Text role="caption" className="text-ink-subtle">
          Loading pricing
        </Text>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className={cn("border border-hairline p-4", className)} role="alert">
        <Text as="h2" role="subheading">
          Pricing could not load
        </Text>
        <Text role="body-small" className="mt-2 text-ink-muted">
          The Pass amounts did not reach this page. Refresh to try again. Free search still works.
        </Text>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className={cn("border-y border-hairline py-6", className)}>
        {/* TODO(data) catalog empty — unusual; Pass plans are static today */}
        <Text role="body" className="text-ink-muted">
          No Pass lengths are listed right now. You can still create a free account.
        </Text>
        <Link href="/signup" className="mt-4 inline-flex min-h-11 items-center text-accent">
          Create a free account
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("space-y-10", className)}>
      <BillingPeriodToggle
        period={period}
        onChange={setPeriod}
        annualSavingsLabel={period === "annual" ? annualSavingsLabel : null}
      />

      {/* Asymmetric layout: free list + featured Pass + pro note. Not an identical card grid. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] lg:items-start">
        <section aria-labelledby="seeker-free-heading" className="border-t border-hairline pt-6">
          <Text as="h2" id="seeker-free-heading" role="subheading">
            Free
          </Text>
          <Text role="body-small" className="mt-1 text-ink-muted">
            Enough to search, track, and try the AI tools without a card.
          </Text>
          <Text role="heading" className="mt-4 font-numeric">
            {formatPaise(0, locale, "INR")}
          </Text>
          <FreeIncludes limits={limits} />
          <Link
            href="/signup"
            className="mt-6 inline-flex min-h-11 items-center border border-hairline bg-surface-raised px-4 text-role-body-small text-ink transition-colors duration-base ease-standard hover:border-ink"
          >
            Create a free account
          </Link>
        </section>

        <section
          aria-labelledby="seeker-pass-heading"
          className="border border-hairline border-s-2 border-s-accent bg-surface-raised p-5 sm:p-6"
        >
          <p className="text-role-caption font-medium text-accent">Recommended</p>
          <Text as="h2" id="seeker-pass-heading" role="subheading" className="mt-1">
            WorkGraph Pass
          </Text>
          <Text role="body-small" className="mt-1 text-ink-muted">
            {period === "annual"
              ? annualPlan
                ? `${annualPlan.days}-day Pass, paid once.`
                : "90-day Pass, paid once. An annual subscription is not published."
              : "30-day Pass, paid once."}
            {/* TODO(data) publish annualPlan when founder sets a yearly amount */}
          </Text>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Text role="heading" className="font-numeric">
              {priceLabel}
            </Text>
            {approx ? (
              <Text role="caption" className="text-ink-subtle">
                About {approx}. Charged in INR.
              </Text>
            ) : null}
          </div>
          <PassIncludes />
          <PassCheckout
            signedIn={signedIn}
            options={checkoutOptions}
            taxWording={taxWording}
            policyBesideBuy="Pause or cancel the day you get hired"
          />
        </section>
      </div>

      <section
        aria-labelledby="seeker-pro-heading"
        className="border-y border-hairline py-6"
      >
        <Text as="h2" id="seeker-pro-heading" role="subheading">
          Pro
        </Text>
        <Text role="body" className="mt-2 max-w-2xl text-ink-muted">
          Pro is a profile flag for people who need longer access. No public price is configured,
          so this tier cannot be bought here.
        </Text>
        <Text role="body-small" className="mt-2 text-ink-subtle">
          {limitLabel(limits.proCoverLettersPerMonth, "cover letters per month")} when active.
        </Text>
      </section>

      <aside className="space-y-3 border border-hairline bg-surface p-4">
        <Text as="h2" role="subheading">
          Refunds
        </Text>
        <Text role="body" className="text-ink-muted">
          If you buy a WorkGraph Pass by mistake, email contact@getworkgraph.com within 14 days of
          payment. Unused Pass days are refunded to the original payment method after we confirm the
          charge. A Pass that has already been used for paid features is not refundable for those
          days.
        </Text>
        <Text role="body-small">
          <Link href="/legal/terms#payments-and-refunds" className="text-accent">
            Full payments and refunds terms
          </Link>
        </Text>
      </aside>

      <div className="flex flex-wrap items-center gap-3 text-role-body-small text-ink-muted">
        <span>Payments by</span>
        <RazorpayMark />
        <span>Razorpay receives payment details only, never resume data.</span>
        <Link href="/legal/terms" className="text-accent">
          Read the terms
        </Link>
      </div>

      <PricingFaq items={faqItems} />
    </div>
  );
}
