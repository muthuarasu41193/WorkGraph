import { displayCount, type SocialProofCounts } from "@/lib/social-proof";
import { FadeIn } from "./FadeIn";
import { SectionContainer } from "./SectionContainer";

const METRICS = [
  { key: "signups" as const, label: "People signed up", detail: "Real accounts in Postgres" },
  { key: "publishedGuides" as const, label: "Published guides", detail: "Live Interview Vault listings" },
  { key: "verifiedOutcomes" as const, label: "Verified outcomes", detail: "Published guides marked offer" },
] as const;

export function IntelligenceSection({
  counts = { signups: 0, publishedGuides: 0, verifiedOutcomes: 0 },
}: {
  counts?: SocialProofCounts;
}) {
  return (
    <SectionContainer id="intelligence" ariaLabel="Intelligence metrics">
      <div className="overflow-hidden rounded-3xl border border-border bg-foreground text-background">
        <div className="grid lg:grid-cols-2">
          <FadeIn className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-wg-primary-light">
              Career intelligence
            </p>
            <h2 className="wg-section-heading mt-3 font-heading font-bold tracking-tight">
              Data-driven decisions at every step
            </h2>
            <p className="mt-4 text-lg text-white/70">
              WorkGraph doesn&apos;t just find jobs — it quantifies your odds, surfaces market
              signals, and tells you exactly where to focus next.
            </p>
          </FadeIn>

          <div className="grid divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
            {METRICS.map((stat, index) => {
              const metric = displayCount(counts[stat.key]);
              return (
                <FadeIn key={stat.label} delay={index * 0.1}>
                  <div className="flex flex-col justify-center p-8 sm:p-10">
                    <p className="font-numeric text-4xl font-bold text-wg-primary-light sm:text-5xl">
                      {metric.showNumber ? metric.display : (
                        <span className="block text-xl leading-snug sm:text-2xl">{metric.display}</span>
                      )}
                    </p>
                    <p className="mt-1 font-semibold text-white">{stat.label}</p>
                    <p className="mt-1 text-sm text-white/50">{stat.detail}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
