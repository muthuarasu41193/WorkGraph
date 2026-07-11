const STATS = [
  { value: "50+", label: "Job Sources" },
  { value: "92%", label: "Match Accuracy" },
  { value: "10,000+", label: "Interview Q&As" },
  { value: "2,400+", label: "Active Users" },
] as const;

export default function StatsBar() {
  return (
    <section aria-label="Platform statistics" className="bg-[#0A0A0A] py-10 sm:py-12">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center lg:text-left">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-heading text-3xl font-extrabold text-[#C41E3A] sm:text-4xl">
                {stat.value}
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
