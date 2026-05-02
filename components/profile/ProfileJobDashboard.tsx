"use client";

import {
  Briefcase,
  CalendarHeart,
  HeartHandshake,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import type { JobPipelineCounts } from "../../lib/profile-dashboard-placeholder";

type Props = {
  stats: JobPipelineCounts;
  profileCompleteness: number;
};

const cards = [
  {
    key: "applied" as const,
    label: "Applied",
    icon: Briefcase,
    hint: "Roles you've submitted",
    tint: "from-emerald-500/15 to-teal-600/10",
    ring: "ring-emerald-200/70",
    iconBg: "bg-emerald-500/15 text-emerald-700",
  },
  {
    key: "interview" as const,
    label: "Interviews",
    icon: CalendarHeart,
    hint: "Loops & onsite scheduled",
    tint: "from-sky-500/15 to-cyan-600/10",
    ring: "ring-sky-200/70",
    iconBg: "bg-sky-500/15 text-sky-700",
  },
  {
    key: "offers" as const,
    label: "Offers",
    icon: PartyPopper,
    hint: "Wins & negotiations",
    tint: "from-amber-400/18 to-orange-500/12",
    ring: "ring-amber-200/70",
    iconBg: "bg-amber-500/15 text-amber-800",
  },
  {
    key: "saved" as const,
    label: "Saved",
    icon: HeartHandshake,
    hint: "Bookmarks & watchlist",
    tint: "from-violet-500/14 to-fuchsia-500/10",
    ring: "ring-violet-200/60",
    iconBg: "bg-violet-500/12 text-violet-800",
  },
];

export default function ProfileJobDashboard({ stats, profileCompleteness }: Props) {
  const totalTracked = stats.applied + stats.interview + stats.offers + stats.saved;

  return (
    <section
      aria-labelledby="job-dashboard-heading"
      className="rounded-3xl border border-emerald-100/90 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/35 p-5 shadow-[0_24px_80px_-48px_rgba(16,185,129,0.35)] sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <h2 id="job-dashboard-heading" className="text-lg font-semibold tracking-tight text-slate-900">
              Job hunt pulse
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Compact tracker — totals sync when you wire LinkedIn, boards & Reddit feeds.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200/70 bg-white/80 px-3 py-2 text-right shadow-sm backdrop-blur-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700/90">Profile</p>
          <p className="text-sm font-bold tabular-nums text-slate-900">{profileCompleteness}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          const value = stats[c.key];
          const active = value > 0;
          return (
            <article
              key={c.key}
              style={{ animationDelay: `${70 + i * 55}ms` }}
              className={`wg-dash-stat relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.tint} p-4 ring-1 ${c.ring} wg-dash-stat-enter`}
            >
              <div className="wg-dash-icon-float mb-3 flex items-center justify-between gap-2">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.iconBg}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span
                  className={`text-2xl font-bold tabular-nums tracking-tight ${active ? "text-slate-900" : "text-slate-400"}`}
                >
                  {value}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{c.label}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-600">{c.hint}</p>
            </article>
          );
        })}
      </div>

      {totalTracked === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-emerald-200/90 bg-white/70 px-4 py-3 text-center text-xs leading-relaxed text-slate-600">
          No applications synced yet — when your tracker API goes live, this row fills automatically. Until then, use{" "}
          <strong className="font-semibold text-slate-800">Saved</strong> bookmarks below as your backlog.
        </p>
      ) : null}
    </section>
  );
}
