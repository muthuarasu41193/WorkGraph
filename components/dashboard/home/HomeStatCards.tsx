"use client";

import { Briefcase, EyeOff, Target } from "lucide-react";
import MetricCard from "@/components/design-system/MetricCard";
import type { HomeStatCards } from "@/lib/home-dashboard";

export default function HomeStatCards({ stats }: { stats: HomeStatCards }) {
  const cards = [
  {
      label: "New Jobs Matched",
      value: stats.matchedToday.toLocaleString("en-IN"),
      description: "Roles aligned with your profile today",
      icon: Briefcase,
    },
    {
      label: "Hidden Jobs Found",
      value: stats.hiddenJobsFound.toLocaleString("en-IN"),
      description: "Opportunities outside traditional boards",
      icon: EyeOff,
    },
    {
      label: "Pending Applications",
      value: stats.pendingApplications.toLocaleString("en-IN"),
      description: "Active applications in your pipeline",
      icon: Target,
    },
  ].filter((card) => {
    const numeric = Number(card.value.replace(/,/g, ""));
    return numeric > 0;
  });

  if (cards.length === 0) return null;

  return (
    <section aria-label="Career metrics">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, i) => (
          <MetricCard key={card.label} {...card} delay={i} />
        ))}
      </div>
    </section>
  );
}
