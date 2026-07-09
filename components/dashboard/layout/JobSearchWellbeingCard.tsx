"use client";

import { motion } from "framer-motion";
import { BarChart3, Check } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";
import { isWeekend } from "@/lib/job-search-wellbeing";
import type { WeeklyJobActivity } from "@/lib/job-search-wellbeing";
import { cn } from "@/lib/utils";

type Props = {
  activity: WeeklyJobActivity;
  message: string;
  hasActivity: boolean;
  animate?: boolean;
};

function StatBlock({
  value,
  label,
  showCheck,
  animate,
}: {
  value: number;
  label: string;
  showCheck?: boolean;
  animate?: boolean;
}) {
  const display = useCountUp(value, 800, animate);

  return (
    <div className="min-w-0 text-center">
      <div className="flex items-center justify-center gap-0.5">
        <span className="text-base font-semibold tabular-nums text-gray-800">{display}</span>
        {showCheck && value > 0 ? (
          <Check className="h-3 w-3 shrink-0 text-emerald-500" strokeWidth={2.5} aria-hidden />
        ) : null}
      </div>
      <p className="mt-0.5 text-[11px] leading-tight text-gray-500">{label}</p>
    </div>
  );
}

export default function JobSearchWellbeingCard({
  activity,
  message,
  hasActivity,
  animate = true,
}: Props) {
  const weekendRest = isWeekend() && !hasActivity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.28, ease: "easeOut" }}
      className={cn(
        "wg-wellbeing-card relative mx-2 overflow-hidden rounded-xl border border-indigo-100 p-3",
        "bg-gradient-to-br from-blue-50 to-indigo-50",
      )}
      aria-label="Job search wellbeing"
    >
      <span className="wg-wellbeing-shimmer pointer-events-none" aria-hidden />

      <div className="relative">
        <div className="mb-2.5 flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5 text-indigo-500" strokeWidth={1.75} aria-hidden />
          <h3 className="text-xs font-semibold text-gray-700">Your Week</h3>
        </div>

        {weekendRest ? (
          <p className="py-2 text-xs font-medium italic text-indigo-600">{message}</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1.5">
              <StatBlock
                value={activity.jobsViewed}
                label="jobs viewed"
                animate={animate}
              />
              <StatBlock
                value={activity.applicationsSent}
                label="applications sent"
                showCheck
                animate={animate}
              />
              <StatBlock
                value={activity.skillMatches}
                label="skill matches"
                animate={animate}
              />
            </div>

            <p className="mt-2.5 text-xs font-medium italic leading-relaxed text-indigo-600">
              &ldquo;{message}&rdquo;
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}
