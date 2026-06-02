"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { VaultDashboardStats } from "@/lib/vault";

type Props = {
  salesByDay: VaultDashboardStats["sales_by_day"];
};

export default function VaultEarningsChart({ salesByDay }: Props) {
  if (salesByDay.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Sales data will appear here once you make your first sale.
      </div>
    );
  }

  const data = salesByDay.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="sales" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis yAxisId="earnings" orientation="right" tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value, name) => [
              name === "earnings_inr" ? `₹${Number(value).toLocaleString("en-IN")}` : value,
              name === "earnings_inr" ? "Earnings" : "Sales",
            ]}
          />
          <Line yAxisId="sales" type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          <Line yAxisId="earnings" type="monotone" dataKey="earnings_inr" stroke="#22c55e" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
