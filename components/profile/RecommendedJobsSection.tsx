import Link from "next/link";
import { ArrowUpRight, Clock, ExternalLink } from "lucide-react";
import type { RecommendedJobPlaceholder } from "../../lib/profile-dashboard-placeholder";

const SOURCE_STYLES: Record<
  RecommendedJobPlaceholder["source"],
  { label: string; className: string }
> = {
  linkedin: { label: "LinkedIn", className: "bg-[#0a66c2]/12 text-[#0a66c2] ring-[#0a66c2]/20" },
  reddit: { label: "Reddit", className: "bg-orange-500/12 text-orange-800 ring-orange-400/25" },
  indeed: { label: "Indeed", className: "bg-blue-600/12 text-blue-800 ring-blue-500/20" },
  glassdoor: { label: "Glassdoor", className: "bg-emerald-700/10 text-emerald-900 ring-emerald-600/15" },
  levels: { label: "Levels.fyi", className: "bg-violet-600/12 text-violet-900 ring-violet-500/20" },
};

type Props = {
  jobs: RecommendedJobPlaceholder[];
  skillHints: string[];
};

export default function RecommendedJobsSection({ jobs, skillHints }: Props) {
  const hint =
    skillHints.length > 0
      ? `Surfaced from aggregated feeds — weighted toward ${skillHints.slice(0, 3).join(", ")}${skillHints.length > 3 ? "…" : ""}.`
      : "Matched using your headline & skills once connectors land.";

  return (
    <section id="recommended-jobs" className="scroll-mt-28 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Recommended roles</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Pulled across LinkedIn, Reddit & major boards
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{hint}</p>
        </div>
        <span className="rounded-full border border-amber-200/90 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
          Preview data · APIs pending
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {jobs.map((job, i) => {
          const src = SOURCE_STYLES[job.source];
          return (
            <article
              key={job.id}
              style={{ animationDelay: `${90 + i * 65}ms` }}
              className="group relative flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.22)] transition hover:border-emerald-200/90 hover:shadow-[0_22px_55px_-36px_rgba(16,185,129,0.22)] wg-job-card-enter"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${src.className}`}>
                  {src.label}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  <Clock className="h-3 w-3" aria-hidden />
                  {job.postedAgo}
                </span>
              </div>
              <h3 className="text-[17px] font-semibold leading-snug text-slate-900">{job.title}</h3>
              <p className="mt-1 text-sm font-medium text-slate-700">{job.company}</p>
              <p className="mt-1 text-xs text-slate-500">{job.location}</p>
              <p className="mt-3 rounded-xl bg-emerald-50/80 px-3 py-2 text-xs leading-relaxed text-emerald-900 ring-1 ring-emerald-100/90">
                <span className="font-semibold">Match signal:</span> {job.matchLabel}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  title="Opens when your apply integrations ship"
                  className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white opacity-60 shadow-sm min-[380px]:flex-none"
                >
                  Apply
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
                </button>
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="inline-flex cursor-not-allowed items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 opacity-60"
                >
                  Save
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <p className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-center text-xs leading-relaxed text-slate-600">
        You&apos;ll replace this grid with live searches against LinkedIn, Reddit threads, Indeed & more.
        {" "}
        <Link href="/create-profile" className="font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-950">
          Update resume
        </Link>{" "}
        anytime to sharpen matches.
      </p>
    </section>
  );
}
