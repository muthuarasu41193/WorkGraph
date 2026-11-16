"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { WG_COLORS } from "@/lib/design-tokens";

export type FunnelChartRow = {
  stage: string;
  d7: number;
  d30: number;
};

export function MetricsFunnelChart({ data }: { data: FunnelChartRow[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={WG_COLORS.border} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: WG_COLORS.inkSubtle }} />
          <YAxis
            type="category"
            dataKey="stage"
            width={120}
            tick={{ fontSize: 11, fill: WG_COLORS.inkSubtle }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${WG_COLORS.hairline}`,
              fontSize: 12,
              background: WG_COLORS.surfaceRaised,
              color: WG_COLORS.ink,
            }}
          />
          <Bar dataKey="d30" name="30 days" fill={WG_COLORS.inkMuted} radius={[0, 4, 4, 0]} barSize={10} />
          <Bar dataKey="d7" name="7 days" fill={WG_COLORS.primary} radius={[0, 4, 4, 0]} barSize={10} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
