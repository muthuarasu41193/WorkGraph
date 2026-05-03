import Link from "next/link";
import { ArrowUpRight, Clock, ExternalLink, LifeBuoy } from "lucide-react";
import type { FeedDemoHint, RecommendedJobCard } from "../../lib/job-dashboard";

const SOURCE_STYLES: Record<
  RecommendedJobCard["source"],
  { label: string; className: string }
> = {
  greenhouse: {
    label: "Greenhouse",
    className: "bg-emerald-600/12 text-emerald-900 ring-emerald-600/25",
  },
  lever: {
    label: "Lever",
    className: "bg-orange-500/12 text-orange-900 ring-orange-400/25",
  },
  ashby: {
    label: "Ashby",
    className: "bg-violet-600/12 text-violet-900 ring-violet-500/25",
  },
  linkedin: { label: "LinkedIn", className: "bg-[#0a66c2]/12 text-[#0a66c2] ring-[#0a66c2]/20" },
  reddit: { label: "Reddit", className: "bg-orange-500/12 text-orange-800 ring-orange-400/25" },
  indeed: { label: "Indeed", className: "bg-blue-600/12 text-blue-800 ring-blue-500/20" },
  glassdoor: { label: "Glassdoor", className: "bg-emerald-700/10 text-emerald-900 ring-emerald-600/15" },
  levels: { label: "Levels.fyi", className: "bg-violet-600/12 text-violet-900 ring-violet-500/20" },
};

type Props = {
  jobs: RecommendedJobCard[];
  skillHints: string[];
  feedKind: "live" | "demo";
  feedDemoHint?: FeedDemoHint | null;
};

function demoBannerCopy(hint: FeedDemoHint): { title: string; body: string } {
  switch (hint) {
    case "empty_table":
      return {
        title: "No job rows in this site’s Supabase database yet",
        body:
          "Vercel is reading public.jobs on the project tied to NEXT_PUBLIC_SUPABASE_URL. That table is empty until ingest runs against the same Postgres. In GitHub: Actions → “Sync ATS jobs to Supabase” → Run workflow (after repository secrets are set), or run python -m app.main ingest --no-embed locally with DATABASE_URL pointing at this project.",
      };
    case "count_unavailable":
    case "rows_unavailable":
      return {
        title: "Could not load listings from Supabase",
        body:
          "Often missing GRANT SELECT on public.jobs, missing RLS policies, or wrong API keys. Run all SQL migrations in supabase/migrations (including 20260205153000_jobs_api_grants.sql), then open /api/jobs-health on this domain to see the exact error.",
      };
    case "select_returned_empty":
      return {
        title: "Job count looks non-zero but no rows were returned",
        body:
          "Rare mismatch (RLS vs count, or stale schema cache). Check /api/jobs-health and confirm migrations; in Supabase Dashboard try Database → Settings → reload if your project offers schema refresh.",
      };
  }
}

export default function RecommendedJobsSection({ jobs, skillHints, feedKind, feedDemoHint }: Props) {
  const hint =
    skillHints.length > 0
      ? feedKind === "live"
        ? `Ranked from ingested ATS roles — boosted when titles/descriptions mention ${skillHints.slice(0, 3).join(", ")}${skillHints.length > 3 ? "…" : ""}.`
        : `Demo cards — once ingest fills Postgres, listings personalize against ${skillHints.slice(0, 3).join(", ")}${skillHints.length > 3 ? "…" : ""}.`
      : feedKind === "live"
        ? "Ranked using your headline, summary text, and saved skills vs each posting."
        : "Add skills to your profile to sharpen ranking after ingest runs.";

  return (
    <section id="recommended-jobs" className="scroll-mt-28 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Recommended roles</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {feedKind === "live" ? "Greenhouse · Lever · Ashby matches" : "Sample roles (run ingest for live data)"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{hint}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${
            feedKind === "live"
              ? "border-0 bg-emerald-50 text-emerald-900 ring-emerald-200"
              : "border-amber-200/90 bg-amber-50 text-amber-900 ring-amber-200"
          }`}
        >
          {feedKind === "live" ? "Live Postgres feed" : "Demo preview"}
        </span>
      </div>

      {feedKind === "demo" && feedDemoHint ? (
        <div className="flex gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/90 p-4 text-sm text-amber-950 shadow-sm ring-1 ring-amber-100">
          <span className="mt-0.5 shrink-0 text-amber-700">
            <LifeBuoy className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 space-y-2">
            <p className="font-semibold leading-snug text-amber-950">{demoBannerCopy(feedDemoHint).title}</p>
            <p className="leading-relaxed text-amber-900/95">{demoBannerCopy(feedDemoHint).body}</p>
            <p className="text-xs text-amber-800/90">
              <Link
                href="/api/jobs-health"
                className="font-semibold underline decoration-amber-400 underline-offset-2 hover:text-amber-950"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open /api/jobs-health
              </Link>{" "}
              (new tab) — then compare Supabase project ref with Vercel env and GitHub Action secrets.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {jobs.map((job, i) => {
          const src = SOURCE_STYLES[job.source];
          const applyHref = job.applyUrl?.trim();
          const canApply = Boolean(applyHref);

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
                {canApply ? (
                  <a
                    href={applyHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 min-[380px]:flex-none"
                  >
                    Apply
                    <ExternalLink className="h-3.5 w-3.5 opacity-90" aria-hidden />
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    title="No apply URL on demo listings — ingest live ATS rows"
                    className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white opacity-60 shadow-sm min-[380px]:flex-none"
                  >
                    Apply
                    <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  title="Saved roles hook into job_tracker_entries soon"
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
        Ingest jobs with{" "}
        <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] text-slate-800">job_aggregator</code> using the
        same <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">DATABASE_URL</code> as Supabase.{" "}
        <Link href="/create-profile" className="font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-950">
          Refresh resume
        </Link>{" "}
        to tune keyword overlap ranking.
      </p>
    </section>
  );
}
