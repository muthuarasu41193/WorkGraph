"use client";

import { cn } from "@/lib/utils";

type ScoreVisualizationProps = {
  value: number;
  label: string;
  accentClassName?: string;
};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export default function ScoreVisualization({ value, label, accentClassName }: ScoreVisualizationProps) {
  const score = clampScore(value);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4">
      <svg width="120" height="120" viewBox="0 0 120 120" className="overflow-visible">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" className="text-muted/50" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          className={cn("text-primary", accentClassName)}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="65" textAnchor="middle" className="fill-foreground text-heading-l">
          {score}
        </text>
      </svg>
      <p className="text-body font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

