"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Clock, ExternalLink, LifeBuoy, Search, SlidersHorizontal } from "lucide-react";
import type { FeedDemoHint, JobFeedSource, RecommendedJobCard } from "../../lib/job-dashboard";

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

const DATE_OPTIONS = [
  { id: "any" as const, label: "Any time" },
  { id: "7" as const, label: "Last 7 days" },
  { id: "14" as const, label: "Last 14 days" },
  { id: "30" as const, label: "Last 30 days" },
];

const PAGE_SIZE = 24;

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
          "Vercel reads public.jobs on the Supabase project from NEXT_PUBLIC_SUPABASE_URL. Populate it via ingest: GitHub Actions → “Sync ATS jobs to Supabase” (set SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL on the repo, or DB password + pooler), or locally from job_aggregator run python -m app.main ingest --no-embed after adding SUPABASE_SERVICE_ROLE_KEY (secret key from Supabase → API Keys) or a real DATABASE_PASSWORD.",
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

function passesDateFilter(iso: string | null | undefined, windowId: "any" | "7" | "14" | "30"): boolean {
  if (windowId === "any") return true;
  if (!iso) return true;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return true;
  const days = Number(windowId);
  const cutoff = Date.now() - days * 86400000;
  return t >= cutoff;
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

  const [query, setQuery] = useState("");
  const [dateWindow, setDateWindow] = useState<"any" | "7" | "14" | "30">("any");
  const [sources, setSources] = useState<Set<JobFeedSource>>(() => new Set());
  const [skillsPick, setSkillsPick] = useState<Set<string>>(() => new Set());
  const [visible, setVisible] = useState(PAGE_SIZE);

  const platformsInFeed = useMemo(() => {
    const u = new Set<JobFeedSource>();
    for (const j of jobs) u.add(j.source);
    return Array.from(u).sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (q) {
        const blob = `${job.title} ${job.company} ${job.location}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      if (!passesDateFilter(job.postedAtIso, dateWindow)) return false;
      if (sources.size > 0 && !sources.has(job.source)) return false; // empty set = all platforms
      if (skillsPick.size > 0) {
        const hasAny = [...skillsPick].some((sk) =>
          job.matchedSkills.some((m) => m.toLowerCase() === sk.toLowerCase())
        );
        if (!hasAny) return false;
      }
      return true;
    });
  }, [jobs, query, dateWindow, sources, skillsPick]);

  const visibleJobs = useMemo(() => filtered.slice(0, visible), [filtered, visible]);

  function togglePlatform(src: JobFeedSource) {
    setSources((prev) => {
      const next = new Set(prev);
      if (next.has(src)) {
        next.delete(src);
      } else {
        next.add(src);
      }
      return next;
    });
    setVisible(PAGE_SIZE);
  }

  function toggleSkill(sk: string) {
    setSkillsPick((prev) => {
      const next = new Set(prev);
      if (next.has(sk)) next.delete(sk);
      else next.add(sk);
      return next;
    });
    setVisible(PAGE_SIZE);
  }

  function clearFilters() {
    setQuery("");
    setDateWindow("any");
    setSources(new Set());
    setSkillsPick(new Set());
    setVisible(PAGE_SIZE);
  }

  const hasActiveFilters =
    query.trim() !== "" || dateWindow !== "any" || sources.size > 0 || skillsPick.size > 0;

  return (
    <section id="recommended-jobs" className="scroll-mt-28 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Job board</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {feedKind === "live" ? "Browse live ATS listings" : "Sample roles (run ingest for live data)"}
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

      {jobs.length > 0 ? (
        <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
            <SlidersHorizontal className="h-4 w-4 text-slate-500" aria-hidden />
            <span className="text-sm font-semibold text-slate-800">Filters</span>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto text-xs font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-950"
              >
                Clear all
              </button>
            ) : null}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisible(PAGE_SIZE);
              }}
              placeholder="Search title, company, location…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none ring-emerald-500/20 transition focus:border-emerald-400 focus:bg-white focus:ring-2"
              aria-label="Search jobs"
            />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Posted</p>
            <div className="flex flex-wrap gap-2">
              {DATE_OPTIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setDateWindow(d.id);
                    setVisible(PAGE_SIZE);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ring-1 ${
                    dateWindow === d.id
                      ? "bg-emerald-700 text-white ring-emerald-700"
                      : "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {platformsInFeed.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Platform</p>
              <p className="text-[11px] text-slate-500">Leave none selected to show every platform, or pick one or more.</p>
              <div className="flex flex-wrap gap-2">
                {platformsInFeed.map((src) => {
                  const active = sources.size === 0 || sources.has(src);
                  return (
                    <button
                      key={src}
                      type="button"
                      onClick={() => togglePlatform(src)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ring-1 ${
                        sources.size === 0
                          ? "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-emerald-50 hover:ring-emerald-200"
                          : active
                            ? "bg-violet-600 text-white ring-violet-600"
                            : "bg-slate-100 text-slate-400 ring-slate-200"
                      }`}
                      title={
                        sources.size === 0
                          ? "Select to filter by this platform only (add more chips to combine)"
                          : active
                            ? "Click to exclude from filter"
                            : "Click to include"
                      }
                    >
                      {SOURCE_STYLES[src].label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {skillHints.length > 0 && feedKind === "live" ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Skills on your profile</p>
              <div className="flex flex-wrap gap-2">
                {skillHints.map((sk) => {
                  const picked = skillsPick.has(sk);
                  return (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => toggleSkill(sk)}
                      className={`max-w-full truncate rounded-full px-3 py-1.5 text-xs font-semibold transition ring-1 ${
                        picked
                          ? "bg-emerald-100 text-emerald-950 ring-emerald-300"
                          : "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-slate-100"
                      }`}
                      title="Show roles that mention this skill in title or description"
                    >
                      {sk}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500">Select one or more to require overlap with those skills.</p>
            </div>
          ) : null}

          <p className="text-sm text-slate-600">
            Showing{" "}
            <span className="font-semibold tabular-nums text-slate-900">{visibleJobs.length}</span> of{" "}
            <span className="font-semibold tabular-nums text-slate-900">{filtered.length}</span>
            {filtered.length !== jobs.length ? (
              <>
                {" "}
                (<span className="tabular-nums">{jobs.length}</span> total ranked)
              </>
            ) : null}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleJobs.map((job, i) => {
          const src = SOURCE_STYLES[job.source];
          const applyHref = job.applyUrl?.trim();
          const canApply = Boolean(applyHref);

          return (
            <article
              key={job.id}
              style={{ animationDelay: `${90 + i * 45}ms` }}
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
              {job.matchedSkills.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {job.matchedSkills.slice(0, 6).map((s) => (
                    <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      {s}
                    </span>
                  ))}
                  {job.matchedSkills.length > 6 ? (
                    <span className="text-[10px] font-medium text-slate-500">+{job.matchedSkills.length - 6}</span>
                  ) : null}
                </div>
              ) : null}

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

      {filtered.length > visible ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/50"
          >
            Load more ({Math.min(PAGE_SIZE, filtered.length - visible)} next)
          </button>
        </div>
      ) : null}

      {filtered.length === 0 && jobs.length > 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/90 px-4 py-8 text-center text-sm text-slate-600">
          No roles match these filters.{" "}
          <button type="button" onClick={clearFilters} className="font-semibold text-emerald-800 underline underline-offset-2">
            Clear filters
          </button>
        </p>
      ) : null}

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
