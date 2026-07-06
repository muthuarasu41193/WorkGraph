"use client";

import { cn } from "@/lib/utils";

type Props = {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
};

const SIZES = {
  sm: { radius: 28, stroke: 5, font: "text-heading-s" },
  md: { radius: 40, stroke: 6, font: "text-heading-l" },
  lg: { radius: 52, stroke: 8, font: "text-heading-xl" },
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-success dark:text-success";
  if (score >= 60) return "text-warning dark:text-warning";
  return "text-rose-600 dark:text-rose-400";
}

function ringColor(score: number): string {
  if (score >= 80) return "stroke-success";
  if (score >= 60) return "stroke-warning";
  return "stroke-rose-500";
}

export default function ScoreRing({ score, size = "md", label, className }: Props) {
  const { radius, stroke, font } = SIZES[size];
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const dim = (radius + stroke) * 2;

  return (
    <div className={cn("relative flex flex-col items-center gap-1", className)} role="img" aria-label={label ?? `Score ${score}%`}>
      <svg width={dim} height={dim} className="-rotate-90">
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-700", ringColor(score))}
        />
      </svg>
      <span
        className={cn("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold", font, scoreColor(score))}
      >
        {score}%
      </span>
      {label ? <span className="text-caption text-muted-foreground">{label}</span> : null}
    </div>
  );
}
