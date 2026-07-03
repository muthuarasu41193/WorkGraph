import {
  Brain,
  Briefcase,
  EyeOff,
  HeartPulse,
  Target,
} from "lucide-react";
import MetricCard from "@/components/design-system/MetricCard";
import type { HomeStatCards } from "@/lib/home-dashboard";

export default function HomeStatCards({ stats }: { stats: HomeStatCards }) {
  const cards = [
    {
      label: "Resume Score",
      value: "91%",
      trend: 6,
      description: "Excellent keyword optimization",
      icon: Brain,
      chartData: [72, 78, 81, 85, 88, 91],
    },
    {
      label: "New Jobs Matched",
      value: stats.matchedToday.toLocaleString("en-IN"),
      trend: 12,
      description: "Roles aligned with your profile today",
      icon: Briefcase,
      chartData: [2, 4, 3, 6, 5, stats.matchedToday || 8],
    },
    {
      label: "Hidden Jobs Found",
      value: stats.hiddenJobsFound.toLocaleString("en-IN"),
      trend: 8,
      description: "Opportunities outside traditional boards",
      icon: EyeOff,
      chartData: [5, 8, 12, 15, 18, stats.hiddenJobsFound || 20],
    },
    {
      label: "Application Success",
      value: `${Math.max(48, 100 - stats.pendingApplications * 3)}%`,
      trend: 4,
      description: "Response rate vs platform average",
      icon: Target,
      chartData: [52, 55, 58, 61, 63, 64],
    },
    {
      label: "Career Health",
      value: "82%",
      trend: 3,
      description: "Skill alignment and growth trajectory",
      icon: HeartPulse,
      chartData: [70, 74, 76, 78, 80, 82],
    },
    {
      label: "Pending Applications",
      value: stats.pendingApplications.toLocaleString("en-IN"),
      description: "Active applications in your pipeline",
      icon: Briefcase,
      chartData: [8, 10, 9, 11, stats.pendingApplications, stats.pendingApplications],
    },
  ];

  return (
    <section aria-label="Career intelligence metrics">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.slice(0, 6).map((card, i) => (
          <MetricCard key={card.label} {...card} delay={i} />
        ))}
      </div>
    </section>
  );
}
