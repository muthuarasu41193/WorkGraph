import { INTELLIGENCE_STATS } from "@/lib/constants";
import { FadeIn } from "./FadeIn";
import { SectionContainer } from "./SectionContainer";

export function IntelligenceSection() {
  return (
    <SectionContainer id="intelligence" ariaLabel="Intelligence metrics">
      <div className="overflow-hidden rounded-3xl border border-border bg-foreground text-background">
        <div className="grid lg:grid-cols-2">
          <FadeIn className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-wg-primary-light">
              Career intelligence
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Data-driven decisions at every step
            </h2>
            <p className="mt-4 text-lg text-white/70">
              WorkGraph doesn&apos;t just find jobs — it quantifies your odds, surfaces market
              signals, and tells you exactly where to focus next.
            </p>
          </FadeIn>

          <div className="grid divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
            {INTELLIGENCE_STATS.map((stat, index) => (
              <FadeIn key={stat.label} delay={index * 0.1}>
                <div className="flex flex-col justify-center p-8 sm:p-10">
                  <p className="font-heading text-4xl font-extrabold text-wg-primary-light sm:text-5xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 font-semibold text-white">{stat.label}</p>
                  <p className="mt-1 text-sm text-white/50">{stat.detail}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
