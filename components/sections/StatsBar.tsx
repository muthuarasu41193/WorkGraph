import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import {
  displayCount,
  type SocialProofCounts,
} from "@/lib/social-proof";

const STAT_KEYS = [
  { key: "signups" as const, label: "People signed up" },
  { key: "publishedGuides" as const, label: "Published guides" },
  { key: "verifiedOutcomes" as const, label: "Verified outcomes" },
] as const;

export default function StatsBar({ counts }: { counts: SocialProofCounts }) {
  return (
    <section aria-label="Platform statistics" className="bg-slate-950 py-10 sm:py-12">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6 min-[1025px]:px-8">
        <dl className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:gap-6">
          {STAT_KEYS.map((stat) => {
            const metric = displayCount(counts[stat.key]);
            return (
              <div key={stat.label} className="text-center lg:text-left">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-numeric text-3xl font-bold tracking-heading text-brand sm:text-4xl">
                  {metric.showNumber ? (
                    <AnimatedNumber value={metric.value} />
                  ) : (
                    <span className="block font-heading text-lg font-semibold leading-snug sm:text-xl">
                      {metric.display}
                    </span>
                  )}
                </dd>
                <dd className="mt-1 text-sm font-medium text-white/70 sm:text-base">
                  {stat.label}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
