"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import SectionHeader from "@/components/design-system/SectionHeader";

const FUNNEL_DATA = [
  { stage: "Applied", count: 24, fill: "#B91C1C" },
  { stage: "Screening", count: 12, fill: "#DC2626" },
  { stage: "Interview", count: 6, fill: "#EF4444" },
  { stage: "Offer", count: 2, fill: "#10B981" },
];

const WEEKLY_DATA = [
  { day: "Mon", applications: 2 },
  { day: "Tue", applications: 4 },
  { day: "Wed", applications: 1 },
  { day: "Thu", applications: 5 },
  { day: "Fri", applications: 3 },
  { day: "Sat", applications: 0 },
  { day: "Sun", applications: 1 },
];

const SKILLS_DATA = [
  { name: "React", value: 85 },
  { name: "TypeScript", value: 78 },
  { name: "Node.js", value: 72 },
  { name: "System Design", value: 58 },
];

export default function HomeChartsSection() {
  return (
    <section aria-labelledby="charts-heading" className="space-y-4">
      <SectionHeader
        title="Career Analytics"
        description="Track your application funnel, weekly activity, and skill growth."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="wg-dash-section-card p-5 lg:col-span-1">
          <h3 className="text-sm font-semibold text-[var(--dash-text)]">Application Funnel</h3>
          <p className="mt-0.5 text-xs text-[var(--dash-text-secondary)]">Conversion by stage</p>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FUNNEL_DATA} layout="vertical" margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ECECEC" />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="stage"
                  width={72}
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #ECECEC",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                  {FUNNEL_DATA.map((entry) => (
                    <Cell key={entry.stage} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="wg-dash-section-card p-5 lg:col-span-1">
          <h3 className="text-sm font-semibold text-[var(--dash-text)]">Weekly Applications</h3>
          <p className="mt-0.5 text-xs text-[var(--dash-text-secondary)]">Last 7 days</p>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECECEC" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #ECECEC",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="applications" fill="#B91C1C" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="wg-dash-section-card p-5 lg:col-span-1">
          <h3 className="text-sm font-semibold text-[var(--dash-text)]">Skills Growth</h3>
          <p className="mt-0.5 text-xs text-[var(--dash-text-secondary)]">Proficiency vs target</p>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SKILLS_DATA}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={64}
                  paddingAngle={3}
                >
                  {SKILLS_DATA.map((_, i) => (
                    <Cell
                      key={i}
                      fill={["#B91C1C", "#DC2626", "#F87171", "#FECACA"][i % 4]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #ECECEC",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {SKILLS_DATA.map((s, i) => (
              <span key={s.name} className="inline-flex items-center gap-1 text-[10px] text-[var(--dash-text-secondary)]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: ["#B91C1C", "#DC2626", "#F87171", "#FECACA"][i % 4] }}
                />
                {s.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
