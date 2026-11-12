import Link from "next/link"
import { WorkGraphMark } from "@/components/brand/WorkGraphLogo"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

/**
 * First viewport: one composition — brand, headline, support, CTAs, and a
 * full-bleed blotter visual. No stats strip, no inset media card.
 */
export function LandingHero() {
  return (
    <section
      aria-labelledby="landing-hero-heading"
      className="relative isolate overflow-hidden border-b border-hairline"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-surface"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--hairline) 85%, transparent) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[54%] border-l border-hairline bg-surface-sunken/70 lg:block"
        aria-hidden
      >
        <HeroBlotter />
      </div>

      <div className="relative mx-auto flex min-h-[min(88vh,44rem)] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-xl space-y-6">
          <div className="flex items-center gap-3">
            <WorkGraphMark className="h-10 w-10 [&_circle]:fill-accent [&_line]:stroke-accent" />
            <Text
              as="p"
              role="heading"
              className="font-heading text-ink tracking-tight"
            >
              WorkGraph
            </Text>
          </div>

          <Text as="h1" role="display" id="landing-hero-heading" className="text-balance">
            The live job index, with a clear next step
          </Text>

          <Text role="body" className="max-w-md text-ink-muted">
            Search roles from public boards and community sources, see what a
            listing actually says, and keep your applications in one record.
          </Text>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="premium" className="min-h-11 px-6">
              <Link href="/jobs">Search the index</Link>
            </Button>
            <Button asChild variant="outline" size="premium" className="min-h-11 px-6">
              <Link href="/signup">Create a free account</Link>
            </Button>
          </div>

          <Text role="caption" className="text-ink-subtle">
            No account is required to look. Match notes appear only when a
            profile is available to compare.
          </Text>
        </div>

        <div className="mt-12 lg:hidden" aria-hidden>
          <HeroBlotter compact />
        </div>
      </div>
    </section>
  )
}

function HeroBlotter({ compact = false }: { compact?: boolean }) {
  const rows = [
    { title: "Senior backend engineer", meta: "Bengaluru · Remote · Greenhouse", live: true },
    { title: "Product designer", meta: "Lagos · Hybrid · Lever", live: false },
    { title: "Data analyst", meta: "Remote · Community post", live: true },
  ]

  return (
    <div
      className={
        compact
          ? "rounded-card border border-hairline bg-surface-raised/90 p-4 shadow-raised"
          : "absolute inset-y-10 right-6 left-8 flex flex-col justify-center"
      }
    >
      <div
        className={
          compact
            ? "space-y-3"
            : "rounded-card border border-hairline bg-surface-raised/95 p-5 shadow-raised backdrop-blur-[2px]"
        }
      >
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <Text role="caption" className="text-ink-muted">
            Live index
          </Text>
          <span className="inline-flex items-center gap-1.5 rounded-control bg-highlight-wash px-2 py-0.5 text-role-caption text-highlight-ink transition-colors duration-base">
            <span className="size-1.5 rounded-full bg-highlight" aria-hidden />
            Live
          </span>
        </div>
        <ul className="divide-y divide-hairline">
          {rows.map((row) => (
            <li key={row.title} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-role-body-small font-medium text-ink">
                  {row.title}
                </p>
                <p className="mt-0.5 truncate text-role-caption text-ink-subtle">
                  {row.meta}
                </p>
              </div>
              {row.live ? (
                <span className="shrink-0 text-role-caption text-highlight">Live</span>
              ) : (
                <span className="shrink-0 text-role-caption text-ink-subtle">Stored</span>
              )}
            </li>
          ))}
        </ul>
        <p className="pt-2 text-role-caption text-ink-subtle">
          Illustrative layout. Real roles load from the index below.
        </p>
      </div>
    </div>
  )
}
