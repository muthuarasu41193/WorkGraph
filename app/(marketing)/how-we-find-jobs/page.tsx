import type { Metadata } from "next"
import Link from "next/link"
import { AccountabilityPage } from "@/components/accountability/AccountabilityPage"
import { Text } from "@/components/ui/text"
import { NAMED_INGEST_SOURCES, SCAM_REMOVAL_STEPS } from "@/lib/accountability"

export const metadata: Metadata = {
  title: "How we find and check jobs",
  description: "Real ingest sources for the WorkGraph index, and how suspected scams are removed.",
}

export default function HowWeFindJobsPage() {
  return (
    <AccountabilityPage
      title="How we find and check jobs"
      lede="These are ingest sources for the public jobs index. A name here is not a partner logo, a customer, or a claim that the employer works with WorkGraph."
    >
      <section className="space-y-3">
        <Text as="h2" role="heading">
          Sources we ingest
        </Text>
        <ul className="space-y-3" role="list">
          {NAMED_INGEST_SOURCES.map((source) => (
            <li key={source.id} className="rounded-card border border-hairline bg-surface-raised p-3">
              <Text role="body-small" className="font-medium text-ink">
                {source.label}
              </Text>
              <Text role="caption" className="mt-1 text-ink-muted">
                {source.how}
              </Text>
            </li>
          ))}
        </ul>
        <Link href="/sources" className="inline-flex min-h-11 items-center text-accent">
          Full source label list
        </Link>
      </section>

      <section className="space-y-3">
        <Text as="h2" role="heading">
          How suspected scams are removed
        </Text>
        <ol className="list-decimal space-y-2 ps-5">
          {SCAM_REMOVAL_STEPS.map((step) => (
            <li key={step} className="text-role-body-small text-ink-muted">
              {step}
            </li>
          ))}
        </ol>
        <Link href="/trust#asks-for-payment" className="inline-flex min-h-11 items-center text-accent">
          Trust labels we show on cards
        </Link>
      </section>
    </AccountabilityPage>
  )
}
