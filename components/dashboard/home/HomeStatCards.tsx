"use client";

import Link from "next/link";
import { Briefcase, ClipboardList, MessageCircle, type LucideIcon } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import type { HomeStatCards as HomeStatCardsData } from "@/lib/home-dashboard";
import { dashboardHref } from "@/lib/dashboard-routes";
import { cn } from "@/lib/utils";

type StatCard = {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  href: string;
};

export default function HomeStatCards({ stats }: { stats: HomeStatCardsData }) {
  const cards: StatCard[] = [
    {
      title: "New matches",
      value: stats.newMatches.toLocaleString("en-IN"),
      helper: "Roles matched to your profile in the catalog",
      icon: Briefcase,
      href: dashboardHref("jobs"),
    },
    {
      title: "Follow-ups due",
      value: stats.followUpsDue.toLocaleString("en-IN"),
      helper: "Gentle nudges on your application board",
      icon: MessageCircle,
      href: dashboardHref("applications"),
    },
    {
      title: "Applications this week",
      value: stats.applicationsThisWeek.toLocaleString("en-IN"),
      helper: "Submitted in the last 7 days",
      icon: ClipboardList,
      href: dashboardHref("applications"),
    },
  ];

  return (
    <section aria-label="Career insights">
      <div className="grid grid-cols-1 gap-[var(--layout-card-gap)] sm:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className={cn(
                "flex flex-col gap-[var(--space-3)] rounded-[var(--radius-card)] border border-hairline bg-surface-raised p-[var(--layout-card-pad-mobile)] no-underline md:p-[var(--layout-card-pad)]",
                "transition-colors duration-base hover:border-border-strong",
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-sunken text-ink-muted">
                <Icon className={iconClass("inline")} aria-hidden />
              </span>
              <div className="flex flex-col gap-[var(--space-1)]">
                <p className="text-role-caption text-ink-muted">{card.title}</p>
                <p className="text-role-title tabular-nums text-ink">{card.value}</p>
                <p className="text-role-caption text-ink-subtle">{card.helper}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
