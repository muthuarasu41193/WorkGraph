"use client";

import { Briefcase, EyeOff, Target } from "lucide-react";
import InsightCard from "@/components/design-system/InsightCard";
import type { HomeStatCards } from "@/lib/home-dashboard";
import { dashboardHref } from "@/lib/dashboard-routes";

export default function HomeStatCards({ stats }: { stats: HomeStatCards }) {
  const cards = [
    {
      title: "New Jobs Matched",
      score: stats.matchedToday.toLocaleString("en-IN"),
      description: "Roles aligned with your profile today",
      icon: Briefcase,
      href: dashboardHref("jobs"),
    },
    {
      title: "Hidden Jobs Found",
      score: stats.hiddenJobsFound.toLocaleString("en-IN"),
      description: "Opportunities outside traditional boards",
      icon: EyeOff,
      href: dashboardHref("job-discovery"),
    },
    {
      title: "Pending Applications",
      score: stats.pendingApplications.toLocaleString("en-IN"),
      description: "Active applications in your pipeline",
      icon: Target,
      href: dashboardHref("applications"),
    },
  ].filter((card) => {
    const numeric = Number(String(card.score).replace(/,/g, ""));
    return numeric > 0;
  }).slice(0, 2);

  if (cards.length === 0) return null;

  return (
    <section aria-label="Career insights">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <InsightCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  );
}
