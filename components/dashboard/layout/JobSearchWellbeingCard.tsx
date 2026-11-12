"use client";

import type { WeeklyJobActivity } from "@/lib/job-search-wellbeing";

type Props = {
  activity: WeeklyJobActivity;
  message?: string;
  hasActivity?: boolean;
};

/** Factual weekly counts. The motivational line is intentionally not shown. */
export default function JobSearchWellbeingCard({ activity }: Props) {
  const cells = [
    { label: "Viewed", value: activity.jobsViewed },
    { label: "Sent", value: activity.applicationsSent },
    { label: "Matches", value: activity.skillMatches },
  ] as const;

  return (
    <div className="week-card" aria-label="This week">
      <p className="week-card__title">This week</p>
      <div className="week-stats">
        {cells.map((cell) => (
          <div key={cell.label} className="week-stats__cell">
            <span className="number">{cell.value}</span>
            <span className="week-stats__label">{cell.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
