import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { AccountabilityPage } from "@/components/accountability/AccountabilityPage"
import { Text } from "@/components/ui/text"
import { FOUNDER } from "@/lib/accountability"

export const metadata: Metadata = {
  title: "About",
  description: "Who builds WorkGraph, how it is funded, and what we will not invent.",
}

export default function AboutPage() {
  return (
    <AccountabilityPage
      title="About WorkGraph"
      lede="A small product that searches a live job index. This page is for the people behind it, not a growth story."
    >
      <section className="space-y-4">
        <Text as="h2" role="heading">
          Founder
        </Text>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-card border border-dashed border-hairline bg-surface-sunken">
            {/* TODO: replace the SVG placeholder with a real founder portrait. */}
            <Image
              src={FOUNDER.photoSrc}
              alt={FOUNDER.photoAlt}
              fill
              className="object-cover"
              sizes="160px"
              unoptimized
            />
          </div>
          <div className="space-y-3">
            <Text role="subheading">{FOUNDER.name}</Text>
            {FOUNDER.story.map((paragraph) => (
              <Text key={paragraph} role="body-small" className="text-ink-muted">
                {paragraph}
              </Text>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <Text as="h2" role="heading">
          How WorkGraph is funded
        </Text>
        <Text role="body-small" className="text-ink-muted">
          {FOUNDER.funding}
        </Text>
        <Text role="caption" className="text-ink-subtle">
          There are no investor logos, press quotes, or user-count badges on this page.
        </Text>
      </section>

      <section className="space-y-2">
        <Text as="h2" role="heading">
          Related
        </Text>
        <ul className="space-y-1">
          <li>
            <Link href="/how-we-find-jobs" className="inline-flex min-h-11 items-center text-accent">
              How we find and check jobs
            </Link>
          </li>
          <li>
            <Link href="/contact" className="inline-flex min-h-11 items-center text-accent">
              Contact a person
            </Link>
          </li>
          <li>
            <Link href="/trust" className="inline-flex min-h-11 items-center text-accent">
              What we checked
            </Link>
          </li>
        </ul>
      </section>
    </AccountabilityPage>
  )
}
