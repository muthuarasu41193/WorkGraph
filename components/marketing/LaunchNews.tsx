import Link from "next/link"
import { Text } from "@/components/ui/text"

const UPDATES = [
  {
    title: "Interview vault with seller-set prices",
    body: "Publish the interviews you sat. Buyers unlock the full note. You choose the INR amount.",
  },
  {
    title: "GitHub and LinkedIn required to publish",
    body: "An experience cannot go live until both links are on the seller profile. Buyers can open them.",
  },
  {
    title: "Live job index beside the vault",
    body: "Search roles from public boards and community sources without creating an account.",
  },
] as const

export function LaunchNews() {
  return (
    <section
      id="launch"
      aria-labelledby="launch-news-heading"
      className="relative border-b border-hairline bg-surface-raised"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-highlight"
        aria-hidden
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16 lg:px-8 lg:py-20">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="inline-flex items-center gap-2 rounded-control bg-highlight-wash px-2.5 py-1 text-role-caption text-highlight-ink transition-colors duration-base">
              <span className="size-1.5 rounded-full bg-highlight" aria-hidden />
              Launch note
            </p>
            <Text role="caption" className="text-ink-subtle">
              Built for job seekers helping job seekers
            </Text>
          </div>
          <Text as="h2" role="title" id="launch-news-heading">
            What WorkGraph is shipping
          </Text>
          <Text role="body" className="max-w-md text-ink-muted">
            A calm place to search roles and trade interview experience with
            transparent seller profiles — not course hype, not fake promises.
          </Text>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Link
              href="/interview-vault/sell"
              className="inline-flex min-h-11 items-center text-accent transition-colors duration-base hover:text-ink"
            >
              Sell an experience
            </Link>
            <Link
              href="/waitlist"
              className="inline-flex min-h-11 items-center text-ink-muted transition-colors duration-base hover:text-ink"
            >
              Join the waitlist for updates
            </Link>
          </div>
        </div>

        <ol className="overflow-hidden rounded-card border border-hairline bg-surface">
          {UPDATES.map((item, index) => (
            <li
              key={item.title}
              className="grid gap-2 border-b border-hairline px-4 py-5 last:border-b-0 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-4 sm:px-5"
            >
              <Text role="caption" className="pt-1 text-accent tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </Text>
              <div className="space-y-2">
                <Text as="h3" role="subheading">
                  {item.title}
                </Text>
                <Text role="body-small" className="text-ink-muted">
                  {item.body}
                </Text>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
