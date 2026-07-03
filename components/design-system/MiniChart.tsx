"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

type Props = {
  data: number[];
  positive?: boolean;
  className?: string;
};

export default function MiniChart({ data, positive = true, className }: Props) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div className={cn("h-full w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="wgChartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={positive ? "#10B981" : "#F59E0B"}
                stopOpacity={0.2}
              />
              <stop
                offset="100%"
                stopColor={positive ? "#10B981" : "#F59E0B"}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={positive ? "#10B981" : "#F59E0B"}
            strokeWidth={1.5}
            fill="url(#wgChartGrad)"
            dot={false}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
