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
            Keep searching. Keep earning from what you already know.
          </Text>
          <Text role="body" className="text-ink-muted">
            Browse notes from linked sellers, or publish your own interview
            write-up at the price you set. The job index stays free to search.
          </Text>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="premium" className="min-h-11 px-6">
            <Link href="/interview-vault">Browse the vault</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="premium"
            className="min-h-11 bg-surface-raised px-6"
          >
            <Link href="/interview-vault/sell">Sell your experience</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
