import Link from "next/link"
import { Text } from "@/components/ui/text"

const STEPS = [
  {
    title: "Search roles or open the vault",
    body: "Use the live job index without an account, or browse interview notes that other seekers published.",
  },
  {
    title: "Buy grounded prep when you need it",
    body: "Unlock a note to read rounds, questions, and tips from someone who linked GitHub and LinkedIn.",
  },
  {
    title: "Sell your own write-up at your price",
    body: "Add profile links, draft the interview you sat, set INR pricing, and earn while the next search continues.",
  },
] as const

export function HowItWorksLanding() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="border-b border-hairline bg-surface-raised"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl space-y-3">
          <Text as="h2" role="title" id="how-heading">
            How to use WorkGraph
          </Text>
          <Text role="body" className="text-ink-muted">
            One product for looking, preparing, and earning from experience you
            already have — without fake course noise.
          </Text>
        </div>

        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
          {STEPS.map((step, index) => (
            <li key={step.title} className="space-y-3">
              <Text role="caption" className="text-accent tabular-nums">
                Step {index + 1}
              </Text>
              <Text as="h3" role="subheading">
                {step.title}
              </Text>
              <Text role="body-small" className="text-ink-muted">
                {step.body}
              </Text>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/jobs"
            className="inline-flex min-h-11 items-center text-accent transition-colors duration-base hover:text-ink"
          >
            Search the job index
          </Link>
          <Link
            href="/interview-vault"
            className="inline-flex min-h-11 items-center text-ink-muted transition-colors duration-base hover:text-ink"
          >
            Browse the vault
          </Link>
        </div>
      </div>
    </section>
  )
}
