import Link from "next/link"
import { Text } from "@/components/ui/text"

const DELIVERABLES = [
  {
    id: "vault",
    title: "A marketplace for lived interviews",
    body: "Active and passive seekers publish notes at a price they choose. Buyers unlock prep that came from a real process, not a guru funnel.",
    href: "/interview-vault",
    linkLabel: "Open interview vault",
  },
  {
    id: "trust",
    title: "Profile links before publishing",
    body: "GitHub and LinkedIn must be on the seller profile before an experience goes live. That keeps the vault checkable.",
    href: "/#trust",
    linkLabel: "How seller trust works",
  },
  {
    id: "index",
    title: "A searchable live job index",
    body: "Roles from ATS boards and community sources sit beside the vault, so looking for work and preparing for it stay in one product.",
    href: "/sources",
    linkLabel: "Where jobs come from",
  },
] as const

export function WhatWeDeliver() {
  return (
    <section
      id="features"
      aria-labelledby="deliver-heading"
      className="border-b border-hairline"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl space-y-3">
          <Text as="h2" role="title" id="deliver-heading">
            What customers actually get
          </Text>
          <Text role="body" className="text-ink-muted">
            Clear surfaces for prep, trust, and search — without inventing
            stats, scarcity, or guaranteed offers.
          </Text>
        </div>

        <div className="mt-10 grid gap-0 border-t border-hairline md:grid-cols-3">
          {DELIVERABLES.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-3 border-b border-hairline py-8 md:border-b-0 md:border-r md:px-6 md:py-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
            >
              <Text as="h3" role="subheading">
                {item.title}
              </Text>
              <Text role="body-small" className="flex-1 text-ink-muted">
                {item.body}
              </Text>
              <Link
                href={item.href}
                className="inline-flex min-h-11 items-center self-start text-accent transition-colors duration-base hover:text-ink"
              >
                {item.linkLabel}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
