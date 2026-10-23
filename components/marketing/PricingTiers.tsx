import Link from "next/link"
import { Text } from "@/components/ui/text"
import { LIMITS, type SubscriptionTier } from "@/lib/subscription"

const REFUND = "Paid vault transactions, when enabled, are processed by Stripe. Payouts, refunds, and revenue share will be described in-product at checkout."

const ORDER: SubscriptionTier[] = ["free", "premium", "pro"]

const NOTES: Record<SubscriptionTier, string> = {
  free: "Job search and the tracker are not capped by this tier.",
  premium: "Premium is a profile flag. No public price is configured.",
  pro: "Pro is a profile flag. No public price is configured.",
}

function limitLabel(value: number, noun: string): string {
  if (value < 0) return `Unlimited ${noun}`
  return `${value} ${noun}`
}

export function PricingTiers() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {ORDER.map((tier) => {
          const limits = LIMITS[tier]
          return (
            <article key={tier} className="rounded-card border border-hairline bg-surface-raised p-4">
              <Text as="h2" role="subheading" className="capitalize">{tier}</Text>
              <Text role="body" className="mt-2">No public price</Text>
              <ul className="mt-3 space-y-2 text-role-body-small">
                <li>{limitLabel(limits.coverLettersPerMonth, "cover letters per month")}</li>
                <li>{limitLabel(limits.interviewQuestionsPerWeek, "interview questions per week")}</li>
                <li>{NOTES[tier]}</li>
              </ul>
              {tier === "free" ? (
                <Link href="/signup" className="mt-4 inline-flex min-h-11 items-center text-role-body-small text-accent">
                  Create a free account
                </Link>
              ) : (
                <Text role="body-small" className="mt-4 text-ink-muted">No checkout is published, so this tier cannot be bought here.</Text>
              )}
            </article>
          )
        })}
      </div>
      <Text role="body-small">
        {REFUND}{" "}
        <Link href="/legal/terms" className="text-accent">Read the terms</Link>
      </Text>
      <Text role="caption" className="text-ink-subtle">Prices are not shown in another currency because no checkout price is published.</Text>
    </div>
  )
}
