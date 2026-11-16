import Link from "next/link"
import { Text } from "@/components/ui/text"

const DELIVERABLES = [
  {
    id: "index",
    title: "A searchable live index",
    body: "Roles arrive from Greenhouse, Lever, community posts, and other ingest sources. You can open a listing, read the stored date, and apply on the company site.",
    href: "/sources",
    linkLabel: "Where jobs come from",
  },
  {
    id: "trust",
    title: "Labels that say what was checked",
    body: "Stale dates, missing apply links, and payment asks are written as sentences. We omit badges we cannot support.",
    href: "/trust",
    linkLabel: "What we checked",
  },
  {
    id: "vault",
    title: "Interview vault and prep tools",
    body: "Read shared interview notes when they exist, tailor evidence against a role, and keep cover letters with the applications you log.",
    href: "/interview-vault",
    linkLabel: "Open interview vault",
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
            What you get
          </Text>
          <Text role="body" className="text-ink-muted">
            Three surfaces that stay useful on a hard week: find a role, read
            what the posting actually claims, and keep the search moving.
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
