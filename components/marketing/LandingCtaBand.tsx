import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export function LandingCtaBand() {
  return (
    <section
      aria-labelledby="landing-cta-heading"
      className="border-b border-hairline bg-accent-wash"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-16">
        <div className="max-w-xl space-y-3">
          <Text as="h2" role="title" id="landing-cta-heading">
            Start with a search
          </Text>
          <Text role="body" className="text-ink-muted">
            Look through the index now. Create an account when you want match
            notes, saved roles, or an application tracker.
          </Text>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="premium" className="min-h-11 px-6">
            <Link href="/jobs">Search jobs</Link>
          </Button>
          <Button asChild variant="outline" size="premium" className="min-h-11 px-6 bg-surface-raised">
            <Link href="/pricing">See pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
