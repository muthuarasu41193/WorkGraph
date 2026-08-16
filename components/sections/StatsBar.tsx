import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

const STATS = [
  { value: 50, suffix: "+", label: "Job Sources" },
  { value: 92, suffix: "%", label: "Match Accuracy" },
  { value: 10000, suffix: "+", label: "Interview Q&As" },
  { value: 2400, suffix: "+", label: "Active Users" },
] as const;

export default function StatsBar() {
  return (
    <section aria-label="Platform statistics" className="bg-slate-950 py-10 sm:py-12">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center lg:text-left">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-numeric text-3xl font-bold tracking-heading text-brand sm:text-4xl">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </dd>
              <dd className="mt-1 text-sm font-medium text-white/70 sm:text-base">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
