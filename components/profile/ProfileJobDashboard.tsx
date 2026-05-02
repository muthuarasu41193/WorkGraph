"use client";

import {
  Briefcase,
  CalendarHeart,
  HeartHandshake,
  PartyPopper,
  Radar,
  Sparkles,
} from "lucide-react";
import type { JobPipelineCounts } from "../../lib/job-dashboard";

type Props = {
  stats: JobPipelineCounts;
  profileCompleteness: number;
  /** Total rows in public.jobs (Python ATS ingest target table). */
  liveListings: number;
  listingsBySource: Partial<Record<string, number>>;
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

export default function ProfileJobDashboard({
  stats,
  profileCompleteness,
  liveListings,
  listingsBySource,
}: Props) {
  const totalTracked = stats.applied + stats.interview + stats.offers + stats.saved;
  const sourceEntries = Object.entries(listingsBySource).filter(([, n]) => (n ?? 0) > 0);

  return (
    <section
      aria-labelledby="job-dashboard-heading"
      className="rounded-3xl border border-emerald-100/90 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/35 p-5 shadow-[0_24px_80px_-48px_rgba(16,185,129,0.35)] sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <h2 id="job-dashboard-heading" className="text-lg font-semibold tracking-tight text-slate-900">
              Job hunt pulse
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Pipeline cards reflect your tracker rows; live listings count syncs from Postgres{" "}
            <code className="rounded bg-emerald-100/80 px-1 py-0.5 text-[11px] text-emerald-900">jobs</code> via ATS
            ingest.
          </p>
          {liveListings > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-900 shadow-sm">
                <Radar className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                {liveListings.toLocaleString()} live listings indexed
              </span>
              {sourceEntries.map(([src, n]) => (
                <span
                  key={src}
                  className="rounded-full bg-emerald-900/[0.06] px-2.5 py-0.5 text-[11px] font-medium capitalize text-slate-700 ring-1 ring-emerald-900/10"
                >
                  {src}: {(n ?? 0).toLocaleString()}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Run the Python ingest against Supabase Postgres — totals appear here automatically after migration{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">20260202120000_jobs_board</code>.
            </p>
          )}
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
          {liveListings > 0 ? (
            <>
              No personal tracker rows yet — listing totals above come from shared ATS ingest. Insert rows into{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">job_tracker_entries</code> when your CRM
              ships.
            </>
          ) : (
            <>
              No applications synced yet — ingest jobs first, then wire tracker events. Until then, browse recommended
              roles below.
            </>
          )}
        </p>
      ) : null}
    </section>
  );
}
