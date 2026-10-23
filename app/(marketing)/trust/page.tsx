import type { Metadata } from "next"
import Link from "next/link"
import { Text } from "@/components/ui/text"

export const metadata: Metadata = {
  title: "What we checked",
  description: "What verified employer means, and the checks WorkGraph does not make.",
}

export default function TrustPage() {
  return (
    <main id="main-content" className="measure space-y-8 px-4 py-8">
      <div>
        <Text as="h1" role="title">What we checked</Text>
        <Text role="body" className="mt-3 text-ink-muted">
          A label is only used when the check below is the one that produced it. Missing checks are omitted, not implied.
        </Text>
      </div>

      <section id="verified-employer" className="space-y-2">
        <Text as="h2" role="heading">Verified employer</Text>
        <Text role="body-small">
          This means the employer account email domain matches the website domain they entered, and the domain is not a free mailbox. An operator can also set the same status by hand. It does not mean we visited the office, confirmed a job is open, or checked a security certification.
        </Text>
        <Text role="caption" className="text-ink-subtle">
          The automatic check is whether those two domains align. The profile stores the status and the time that status was set.
        </Text>
      </section>

      <section id="verified-live" className="space-y-2">
        <Text as="h2" role="heading">Verified live</Text>
        <Text role="body-small">
          We do not use this label. Listings store a posted time. That time is not a check that the role is still open.
        </Text>
      </section>

      <section id="verified-experience" className="space-y-2">
        <Text as="h2" role="heading">Verified experience</Text>
        <Text role="body-small">
          We do not use this label. Work history on a profile or in a testimonial is not independently checked. A reported outcome on a consented quote is the person’s words, not a check we ran.
        </Text>
      </section>

      <section id="match" className="space-y-2">
        <Text as="h2" role="heading">Match estimate</Text>
        <Text role="body-small">
          A match percent is an estimate from skill overlap, title family, and a small seniority term. Older postings are ranked lower. It is not a chance of an interview or an offer. When no profile is available, the percent is hidden.
        </Text>
        <Text role="body-small">
          Salary estimates from other people’s pay are not shown. A card says salary is not disclosed unless the listing itself stored a figure. There is no sample size to quote.
        </Text>
      </section>

      <section id="subscription" className="space-y-2">
        <Text as="h2" role="heading">Subscription</Text>
        <Text role="body-small">
          There is no published checkout price and no subscription to cancel in the product today. When a paid subscription exists, the control will be one button labelled Cancel subscription.
        </Text>
        <Link href="/pricing" className="inline-flex min-h-11 items-center text-accent">See the tiers</Link>
      </section>

      <section id="feedback" className="space-y-2">
        <Text as="h2" role="heading">Feedback</Text>
        <Text role="body-small">
          The contact form is read by a person. A reply time is not published.
        </Text>
        <Link href="/#contact" className="inline-flex min-h-11 items-center text-accent">Send feedback</Link>
      </section>
    </main>
  )
}
