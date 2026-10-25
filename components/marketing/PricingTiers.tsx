import Link from "next/link"
import { PassCheckout, type PassCheckoutOption } from "@/components/marketing/PassCheckout"
import { Text } from "@/components/ui/text"
import { formatInrFromPaise } from "@/lib/billing/display"
import { PASS_PLAN_IDS, PASS_PLANS, PASS_TAX_WORDING_TODO } from "@/lib/billing/plans"
import { LIMITS } from "@/lib/subscription"

const ORDER = ["free", "premium", "pro"] as const

function limitLabel(value: number, noun: string): string {
  if (value < 0) return `Unlimited ${noun}`
  return `${value} ${noun}`
}

const PASS_OPTIONS: PassCheckoutOption[] = PASS_PLAN_IDS.map((id) => {
  const plan = PASS_PLANS[id]
  return {
    id: plan.id,
    label: plan.label,
    priceLabel: formatInrFromPaise(plan.amountPaise),
    amountPaise: plan.amountPaise,
    currency: plan.currency,
  }
})

export function PricingTiers({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {ORDER.map((tier) => {
          const limits = LIMITS[tier]
          return (
            <article key={tier} className="rounded-card border border-hairline bg-surface-raised p-4">
              {tier === "premium" ? (
                <Text as="h2" role="subheading">WorkGraph Pass</Text>
              ) : (
                <Text as="h2" role="subheading" className="capitalize">{tier}</Text>
              )}
              {tier === "premium" ? (
                <PassCheckout
                  signedIn={signedIn}
                  options={PASS_OPTIONS}
                  taxWording={PASS_TAX_WORDING_TODO}
                />
              ) : (
                <Text role="body" className="mt-2">No public price</Text>
              )}
              <ul className="mt-3 space-y-2 text-role-body-small">
                <li>{limitLabel(limits.coverLettersPerMonth, "cover letters per month")}</li>
                {tier === "free" ? <li>Job search and the tracker are not capped by this tier.</li> : null}
                {tier === "pro" ? <li>Pro is a profile flag. No public price is configured.</li> : null}
              </ul>
              {tier === "free" ? (
                <Link href="/signup" className="mt-4 inline-flex min-h-11 items-center text-role-body-small text-accent">
                  Create a free account
                </Link>
              ) : null}
              {tier === "pro" ? (
                <Text role="body-small" className="mt-4 text-ink-muted">
                  No checkout is published, so this tier cannot be bought here.
                </Text>
              ) : null}
            </article>
          )
        })}
      </div>
      <Text role="body-small">
        Payments are processed by Razorpay. Razorpay receives payment details only, never resume data.{" "}
        <Link href="/legal/terms" className="text-accent">Read the terms</Link>
      </Text>
    </div>
  )
}
