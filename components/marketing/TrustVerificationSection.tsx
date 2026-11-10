import Link from "next/link"
import { Text } from "@/components/ui/text"

const STEPS = [
  {
    title: "Add GitHub and LinkedIn on your profile",
    body: "Both links are required before an experience can go live. Buyers can open them and judge the person behind the note.",
  },
  {
    title: "Write the interview you sat",
    body: "Company, role, rounds, questions, tips, and outcome. This is the professional proof of the experience — not a marketing page.",
  },
  {
    title: "Set your price and publish",
    body: "You choose the amount. When another seeker unlocks the full note, you earn. Until your next offer lands, those notes can keep working for you.",
  },
] as const

export function TrustVerificationSection() {
  return (
    <section
      id="trust"
      aria-labelledby="trust-heading"
      className="relative border-b border-hairline"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-accent"
        aria-hidden
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:px-8 lg:py-20">
        <div className="space-y-4">
          <Text as="h2" role="title" id="trust-heading">
            Transparency before anyone can sell
          </Text>
          <Text role="body" className="max-w-md text-ink-muted">
            WorkGraph refuses anonymous course pitches. A seller must put
            checkable profile links on the record, then publish the interview
            itself. That is how fellow seekers avoid unwanted content and empty
            promises.
          </Text>
          <Text role="body-small" className="max-w-md text-ink-subtle">
            Profile links are required by the product. They are not a hiring
            background check, and they are not a guarantee of an offer.
          </Text>
          <Link
            href="/profile"
            className="inline-flex min-h-11 items-center text-accent transition-colors duration-base hover:text-ink"
          >
            Complete your profile links
          </Link>
        </div>

        <ol className="overflow-hidden rounded-card border border-hairline bg-surface-raised">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="grid gap-2 border-b border-hairline px-4 py-5 last:border-b-0 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-4 sm:px-5"
            >
              <Text role="caption" className="pt-1 text-accent tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </Text>
              <div className="space-y-2">
                <Text as="h3" role="subheading">
                  {step.title}
                </Text>
                <Text role="body-small" className="text-ink-muted">
                  {step.body}
                </Text>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
