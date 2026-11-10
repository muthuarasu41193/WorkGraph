import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

const BUYER_POINTS = [
  {
    title: "Notes from interviews people actually sat",
    body: "Rounds, questions, and tips written by the person who was in the room — not a recycled course outline.",
  },
  {
    title: "Sellers you can check",
    body: "Publishing requires GitHub and LinkedIn links on the seller profile. Open the links. Decide if the experience is useful.",
  },
  {
    title: "No fake guru promises",
    body: "WorkGraph does not sell guaranteed offers or scarcity countdowns. A note is prep material. An offer is still earned in the interview.",
  },
] as const

const SELLER_POINTS = [
  {
    title: "Set the amount you want",
    body: "You choose the price in INR when you publish. Earn when another seeker unlocks the full note.",
  },
  {
    title: "Share skills and interview experience",
    body: "Active and passive seekers can both publish. Draft while you search. Publish when the write-up is ready.",
  },
  {
    title: "Earn while the search continues",
    body: "A quiet stretch in applications does not have to mean zero income from the interviews you already finished.",
  },
] as const

export function VaultValueSection() {
  return (
    <section
      id="interview-vault"
      aria-labelledby="vault-value-heading"
      className="border-b border-hairline bg-surface-raised"
    >
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl space-y-4">
          <p className="inline-flex items-center gap-2 rounded-control bg-highlight-wash px-2.5 py-1 text-role-caption text-highlight-ink">
            <span className="size-1.5 rounded-full bg-highlight" aria-hidden />
            Interview vault
          </p>
          <Text as="h2" role="title" id="vault-value-heading">
            Help the next seeker. Get paid for the work you already did.
          </Text>
          <Text role="body" className="text-ink-muted">
            WorkGraph is built so job seekers help each other with transparent
            interview notes — not with empty motivation or paid “secret”
            courses. Buyers pay for experience. Sellers keep a profile buyers
            can inspect.
          </Text>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <article className="space-y-6 rounded-card border border-hairline bg-surface p-6 sm:p-8">
            <div className="space-y-2">
              <Text role="caption" className="text-accent">
                For people preparing
              </Text>
              <Text as="h3" role="subheading">
                Buy notes that stay grounded
              </Text>
            </div>
            <ul className="space-y-5">
              {BUYER_POINTS.map((item) => (
                <li key={item.title} className="space-y-1 border-t border-hairline pt-4 first:border-t-0 first:pt-0">
                  <Text as="h4" role="card-title">
                    {item.title}
                  </Text>
                  <Text role="body-small" className="text-ink-muted">
                    {item.body}
                  </Text>
                </li>
              ))}
            </ul>
            <Button asChild size="premium" className="min-h-11">
              <Link href="/interview-vault">Open the vault</Link>
            </Button>
          </article>

          <article className="space-y-6 rounded-card border border-hairline bg-surface p-6 sm:p-8">
            <div className="space-y-2">
              <Text role="caption" className="text-accent">
                For people who sat the interview
              </Text>
              <Text as="h3" role="subheading">
                Sell experience at your price
              </Text>
            </div>
            <ul className="space-y-5">
              {SELLER_POINTS.map((item) => (
                <li key={item.title} className="space-y-1 border-t border-hairline pt-4 first:border-t-0 first:pt-0">
                  <Text as="h4" role="card-title">
                    {item.title}
                  </Text>
                  <Text role="body-small" className="text-ink-muted">
                    {item.body}
                  </Text>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="premium" className="min-h-11">
              <Link href="/interview-vault/sell">Start a draft</Link>
            </Button>
          </article>
        </div>
      </div>
    </section>
  )
}
