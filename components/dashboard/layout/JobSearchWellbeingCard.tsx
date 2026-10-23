"use client";

import type { WeeklyJobActivity } from "@/lib/job-search-wellbeing";

type Props = {
  activity: WeeklyJobActivity;
  message?: string;
  hasActivity?: boolean;
};

/** Factual weekly counts. The motivational line is intentionally not shown. */
export default function JobSearchWellbeingCard({ activity }: Props) {
  return (
    <div className="week-card" aria-label="This week">
      <p className="text-role-caption font-medium text-ink">This week</p>
      <p className="week-stats">
        <span>
          <span className="number">{activity.jobsViewed}</span> viewed
        </span>
        <span aria-hidden>·</span>
        <span>
          <span className="number">{activity.applicationsSent}</span> sent
        </span>
        <span aria-hidden>·</span>
        <span>
          <span className="number">{activity.skillMatches}</span> matches
        </span>
      </p>
    </div>
  );
}
