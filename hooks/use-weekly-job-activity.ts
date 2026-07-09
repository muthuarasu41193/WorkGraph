"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JobPipelineCounts } from "@/lib/job-dashboard";
import {
  createEmptyWeekActivity,
  getDateKey,
  getMotivationalMessage,
  getWeekKey,
  hasWeeklyActivity,
  shouldShowWellbeingCard,
  type WeeklyJobActivity,
} from "@/lib/job-search-wellbeing";

const STORAGE_PREFIX = "wg-weekly-activity";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

function readActivity(userId: string): WeeklyJobActivity {
  const weekKey = getWeekKey();
  if (typeof window === "undefined") {
    return createEmptyWeekActivity(weekKey);
  }

  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return createEmptyWeekActivity(weekKey);
    const parsed = JSON.parse(raw) as WeeklyJobActivity;
    if (parsed.weekKey !== weekKey) return createEmptyWeekActivity(weekKey);
    return {
      ...createEmptyWeekActivity(weekKey),
      ...parsed,
      activeDates: Array.isArray(parsed.activeDates) ? parsed.activeDates : [],
    };
  } catch {
    return createEmptyWeekActivity(weekKey);
  }
}

function persistActivity(userId: string, activity: WeeklyJobActivity) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(activity));
  } catch {
    /* ignore */
  }
}

function touchActiveDate(activity: WeeklyJobActivity): WeeklyJobActivity {
  const today = getDateKey();
  if (activity.activeDates.includes(today)) return activity;
  return { ...activity, activeDates: [...activity.activeDates, today] };
}

type Options = {
  userId: string;
  jobPipeline: JobPipelineCounts;
  matchCount: number;
  activeRoute: string;
};

export function useWeeklyJobActivity({
  userId,
  jobPipeline,
  matchCount,
  activeRoute,
}: Options) {
  const [activity, setActivity] = useState<WeeklyJobActivity>(() =>
    createEmptyWeekActivity(getWeekKey()),
  );
  const [hydrated, setHydrated] = useState(false);

  const syncActivity = useCallback(
    (updater: (prev: WeeklyJobActivity) => WeeklyJobActivity) => {
      setActivity((prev) => {
        const weekKey = getWeekKey();
        const base = prev.weekKey === weekKey ? prev : createEmptyWeekActivity(weekKey);
        const next = updater(base);
        persistActivity(userId, next);
        return next;
      });
    },
    [userId],
  );

  useEffect(() => {
    const stored = readActivity(userId);
    const weekKey = getWeekKey();

    if (stored.weekKey !== weekKey) {
      const fresh = {
        ...createEmptyWeekActivity(weekKey),
        appliedBaseline: jobPipeline.applied,
        matchesBaseline: matchCount,
      };
      if (jobPipeline.applied > 0 || matchCount > 0) {
        fresh.applicationsSent = jobPipeline.applied;
        fresh.skillMatches = matchCount;
        fresh.activeDates = [getDateKey()];
      }
      setActivity(fresh);
      persistActivity(userId, fresh);
    } else {
      const applicationsSent = Math.max(
        stored.applicationsSent,
        Math.max(0, jobPipeline.applied - (stored.appliedBaseline ?? jobPipeline.applied)),
      );
      const skillMatches = Math.max(
        stored.skillMatches,
        Math.max(0, matchCount - (stored.matchesBaseline ?? matchCount)),
      );
      setActivity({ ...stored, applicationsSent, skillMatches });
    }

    setHydrated(true);
  }, [userId, jobPipeline.applied, matchCount]);

  const prevRouteRef = useRef(activeRoute);
  useEffect(() => {
    if (!hydrated) return;
    const enteredJobs = activeRoute === "jobs" && prevRouteRef.current !== "jobs";
    prevRouteRef.current = activeRoute;
    if (!enteredJobs) return;

    syncActivity((prev) =>
      touchActiveDate({
        ...prev,
        jobsViewed: prev.jobsViewed + 1,
      }),
    );
  }, [activeRoute, hydrated, syncActivity]);

  useEffect(() => {
    if (!hydrated) return;

    syncActivity((prev) => {
      const applicationsSent = Math.max(
        0,
        jobPipeline.applied - (prev.appliedBaseline ?? jobPipeline.applied),
      );
      const skillMatches = Math.max(0, matchCount - (prev.matchesBaseline ?? matchCount));
      let next: WeeklyJobActivity = {
        ...prev,
        applicationsSent: Math.max(prev.applicationsSent, applicationsSent),
        skillMatches: Math.max(prev.skillMatches, skillMatches),
      };
      if (applicationsSent > 0 || skillMatches > 0) {
        next = touchActiveDate(next);
      }
      return next;
    });
  }, [hydrated, jobPipeline.applied, matchCount, syncActivity]);

  const message = useMemo(() => getMotivationalMessage(activity), [activity]);
  const visible = useMemo(
    () => hydrated && shouldShowWellbeingCard(activity),
    [activity, hydrated],
  );
  const hasActivity = useMemo(() => hasWeeklyActivity(activity), [activity]);

  return { activity, message, visible, hasActivity, hydrated };
}
