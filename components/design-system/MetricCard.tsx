"use client";

import { Icon as WgIcon } from "@/components/ui/icon";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import MiniChart from "./MiniChart";

type Props = {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  description?: string;
  icon: LucideIcon;
  chartData?: number[];
  delay?: number;
  className?: string;
};

export default function MetricCard({
  label,
  value,
  trend,
  trendLabel,
  description,
  icon: Icon,
  chartData,
  delay = 0,
  className,
}: Props) {
  const trendUp = trend !== undefined && trend >= 0;
  const trendDown = trend !== undefined && trend < 0;

  return (
    <div
      style={{ animationDelay: `${delay * 60}ms` }}
      className={cn(
        "wg-dash-section-card wg-dash-card-lift wg-dash-stat-enter group relative overflow-hidden p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-4">
          <p className="text-xs font-medium text-[var(--dash-text-secondary)]">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-[var(--dash-text)]">
              {value}
            </p>
            {trend !== undefined ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium",
                  trendUp && "text-emerald-600",
                  trendDown && "text-amber-600",
                )}
              >
                {trendUp ? (
                  <WgIcon icon={TrendingUp} aria-hidden />
                ) : (
                  <WgIcon icon={TrendingDown} aria-hidden />
                )}
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="text-xs leading-relaxed text-[var(--dash-text-secondary)]">{description}</p>
          ) : null}
          {trendLabel && !description ? (
            <p className="text-xs text-[var(--dash-text-secondary)]">{trendLabel}</p>
          ) : null}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--dash-accent-soft)] text-[var(--dash-accent)] transition-transform group-hover:scale-105">
          <WgIcon icon={Icon} size="standalone" />
        </span>
      </div>
      {chartData && chartData.length > 1 ? (
        <div className="mt-4 h-10">
          <MiniChart data={chartData} positive={trendUp} />
        </div>
      ) : null}
    </div>
  );
}
