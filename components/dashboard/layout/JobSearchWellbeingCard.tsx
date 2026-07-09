"use client";

import { isWeekend } from "@/lib/job-search-wellbeing";
import type { WeeklyJobActivity } from "@/lib/job-search-wellbeing";

type Props = {
  activity: WeeklyJobActivity;
  message: string;
  hasActivity: boolean;
};

export default function JobSearchWellbeingCard({
  activity,
  message,
  hasActivity,
}: Props) {
  const weekendRest = isWeekend() && !hasActivity;

  return (
    <div className="week-card" aria-label="This week">
      <p className="text-xs font-medium text-slate-700">This week</p>

      {weekendRest ? (
        <p className="week-quote mt-1.5">{message}</p>
      ) : (
        <>
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
          <p className="week-quote">&ldquo;{message}&rdquo;</p>
        </>
      )}
    </div>
  );
}
