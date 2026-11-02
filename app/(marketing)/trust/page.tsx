import type { Metadata } from "next"
import Link from "next/link"
import { Text } from "@/components/ui/text"
import { STATED_PAY_RULE, TRUST_SIGNAL_NOTE } from "@/lib/credibility"
import { STALE_AFTER_DAYS } from "@/lib/job-staleness"

export const metadata: Metadata = {
  title: "What we checked",
  description: "What verified employer means, and the checks WorkGraph does not make.",
}

export default function TrustPage() {
  return (
    <main id="main-content" tabIndex={-1} className="measure space-y-8 px-4 py-8">
      <div>
        <Text as="h1" role="title">What we checked</Text>
        <Text role="body" className="mt-3 text-ink-muted">
          A label is only used when the check below is the one that produced it. Missing checks are omitted, not implied.
        </Text>
        <Text role="body-small" className="mt-2 text-ink-muted">{TRUST_SIGNAL_NOTE}</Text>
      </div>

      <section id="stated-pay" className="space-y-2">
        <Text as="h2" role="heading">Stated pay</Text>
        <Text role="body-small">{STATED_PAY_RULE}</Text>
        <Text role="body-small">
          A card shows a range or an amount only when the posting writes a currency or a pay unit, such as LPA, per annum, or per hour. The line ends with “stated in posting”. Competitive, “as per industry standards”, years of experience, and team sizes stay as “Salary not disclosed”.
        </Text>
      </section>

      <section id="asks-for-payment" className="space-y-2">
        <Text as="h2" role="heading">Asks for payment</Text>
        <Text role="body-small">
          This label appears when the posting asks for a fee, a deposit, registration charges, or payment to apply. It is the only trust label drawn in the warning colour. A sentence that says no fees are charged does not trigger it.
        </Text>
      </section>

      <section id="off-platform-contact" className="space-y-2">
        <Text as="h2" role="heading">Off-platform contact only</Text>
        <Text role="body-small">
          This label appears when the only contact is WhatsApp, Telegram, or a personal mailbox such as Gmail, and no company apply link is stored. It is most common on community posts. A company career link or a work email keeps the label off. It is not a warning colour.
        </Text>
      </section>

      <section id="may-be-closed" className="space-y-2">
        <Text as="h2" role="heading">May be closed</Text>
        <Text role="body-small">
          The same rule is used on the jobs list, the job page, and match ranking. A posting is treated as likely closed after {STALE_AFTER_DAYS} full days. Day {STALE_AFTER_DAYS} is still current. The posted date is not a check that the role is open. “Hide likely-closed jobs” on the jobs page is off until you turn it on.
        </Text>
      </section>

      <section id="always-open-wording" className="space-y-2">
        <Text as="h2" role="heading">Always-open wording</Text>
        <Text role="body-small">
          This label appears when the posting says “talent pool”, “future openings”, or “always hiring”. That is not a dated opening.
        </Text>
      </section>

      <section id="company-name-missing" className="space-y-2">
        <Text as="h2" role="heading">Company name missing</Text>
        <Text role="body-small">
          The company name is missing on the listing, or the stored name is the placeholder “Company”.
        </Text>
      </section>

      <section id="no-apply-link" className="space-y-2">
        <Text as="h2" role="heading">No apply link</Text>
        <Text role="body-small">
          No apply link is stored for the listing. A card shows at most two of these labels. Each one has a Why control with the sentence above.
        </Text>
      </section>

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
          {STATED_PAY_RULE} There is no sample size to quote.
        </Text>
      </section>

      <section id="subscription" className="space-y-2">
        <Text as="h2" role="heading">Subscription</Text>
        <Text role="body-small">
          WorkGraph Pass is a one-time payment. It does not auto-renew, so there is no cancel-subscription button. Pro is a profile flag with no public price.
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
