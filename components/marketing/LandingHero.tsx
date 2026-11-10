import Link from "next/link"
import { WorkGraphMark } from "@/components/brand/WorkGraphLogo"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

/**
 * First viewport: brand, one headline, one support line, CTAs, and a
 * full-bleed vault blotter. No stats strip.
 */
export function LandingHero() {
  return (
    <section
      aria-labelledby="landing-hero-heading"
      className="relative isolate overflow-hidden border-b border-hairline"
    >
      <div className="pointer-events-none absolute inset-0 bg-surface" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--hairline) 90%, transparent) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] border-l border-hairline bg-surface-sunken/80 lg:block"
        aria-hidden
      >
        <HeroVaultPanel />
      </div>

      <div className="relative mx-auto flex min-h-[min(90vh,46rem)] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-xl space-y-6">
          <div className="flex items-center gap-3">
            <WorkGraphMark className="h-10 w-10 [&_circle]:fill-accent [&_line]:stroke-accent" />
            <Text as="p" role="heading" className="font-heading tracking-tight text-ink">
              WorkGraph
            </Text>
          </div>

          <Text as="h1" role="display" id="landing-hero-heading" className="text-balance">
            Real interview notes from people who show their work
          </Text>

          <Text role="body" className="max-w-md text-ink-muted">
            Buy prep written by seekers who link GitHub and LinkedIn. Sell the
            interviews you already sat, at the price you set, while you keep
            looking for the next role.
          </Text>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="premium" className="min-h-11 px-6">
              <Link href="/interview-vault">Browse interview vault</Link>
            </Button>
            <Button asChild variant="outline" size="premium" className="min-h-11 px-6">
              <Link href="/interview-vault/sell">Sell your experience</Link>
            </Button>
          </div>

          <Text role="caption" className="text-ink-subtle">
            No course funnels. No fake scarcity. Sellers publish only after their
            profile includes GitHub and LinkedIn links buyers can open.
          </Text>
        </div>

        <div className="mt-12 lg:hidden" aria-hidden>
          <HeroVaultPanel compact />
        </div>
      </div>
    </section>
  )
}

function HeroVaultPanel({ compact = false }: { compact?: boolean }) {
  const rows = [
    {
      title: "Backend engineer · Series B fintech",
      meta: "4 rounds · Offer · Seller-set price",
      mark: "Linked",
    },
    {
      title: "Product designer · Health tech",
      meta: "3 rounds · Ongoing · Seller-set price",
      mark: "Linked",
    },
    {
      title: "Data analyst · Remote product team",
      meta: "2 rounds · Offer · Seller-set price",
      mark: "Linked",
    },
  ]

  return (
    <div
      className={
        compact
          ? "rounded-card border border-hairline bg-surface-raised/95 p-4 shadow-raised"
          : "absolute inset-y-10 right-6 left-8 flex flex-col justify-center"
      }
    >
      <div
        className={
          compact
            ? "space-y-3"
            : "rounded-card border border-hairline bg-surface-raised/95 p-5 shadow-raised"
        }
      >
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <Text role="caption" className="text-ink-muted">
            Interview vault
          </Text>
          <span className="inline-flex items-center gap-1.5 rounded-control bg-highlight-wash px-2 py-0.5 text-role-caption text-highlight-ink transition-colors duration-base">
            <span className="size-1.5 rounded-full bg-highlight" aria-hidden />
            Seller linked
          </span>
        </div>
        <ul className="divide-y divide-hairline">
          {rows.map((row) => (
            <li key={row.title} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-role-body-small font-medium text-ink">{row.title}</p>
                <p className="mt-0.5 truncate text-role-caption text-ink-subtle">{row.meta}</p>
              </div>
              <span className="shrink-0 text-role-caption text-positive">{row.mark}</span>
            </li>
          ))}
        </ul>
        <p className="pt-2 text-role-caption text-ink-subtle">
          Illustrative layout. Live notes open in the vault.
        </p>
      </div>
    </div>
  )
}
