"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Bookmark,
  Briefcase,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { JobPipelineCounts } from "../../lib/job-dashboard";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  stats: JobPipelineCounts;
  profileCompleteness: number;
  liveListings: number;
  matchedListings: number;
};

type DashboardFilter = "all" | "matched" | "applied" | "saved";

function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = Math.max(0, value);
    const duration = 1500;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}

export default function ProfileJobDashboard({
  stats,
  profileCompleteness,
  liveListings,
  matchedListings,
}: Props) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSectionLoading, setIsSectionLoading] = useState(true);

  function refreshListings() {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSyncStatus("error");
      window.setTimeout(() => setSyncStatus("idle"), 2000);
      return;
    }
    startRefresh(() => {
      router.refresh();
    });
    setSyncStatus("success");
    window.setTimeout(() => setSyncStatus("idle"), 2000);
  }

  function triggerFilter(filter: DashboardFilter) {
    document.querySelector("#recommended-jobs")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.dispatchEvent(new CustomEvent("wg:job-filter", { detail: { filter } }));
  }

  useEffect(() => {
    const t = window.setTimeout(() => setIsSectionLoading(false), 650);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <Card className="border-slate-200 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-4 sm:p-6">
        <section aria-labelledby="job-dashboard-heading">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 wg-section-fade" style={{ animationDelay: "0ms" }}>
            <div className="min-w-0 flex-1">
              <h2 id="job-dashboard-heading" className="text-2xl font-bold leading-8 text-[#1D1D1F]">
                Job Dashboard
              </h2>
              <p className="mt-1 text-sm font-normal text-[#8E8E93]">
                Live ATS jobs matched to your profile
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
              <button
                type="button"
                onClick={refreshListings}
                disabled={isRefreshing}
                className="inline-flex h-10 items-center gap-2 rounded-[20px] border border-[#DADCE0] px-5 text-sm font-medium text-[#5F6368] transition hover:shadow-[0_1px_3px_rgba(0,0,0,0.10)] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2"
              >
                {syncStatus === "error" ? (
                  <XCircle className="h-4 w-4 text-[#D93025] wg-shake" aria-hidden />
                ) : (
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
                )}
                <span className="hidden sm:inline">{isRefreshing ? "Syncing…" : "Sync Jobs"}</span>
              </button>
              {profileCompleteness < 100 ? (
                <span className="inline-flex items-center gap-1.5 rounded-2xl bg-[#FEF7E0] px-3 py-1.5 text-xs font-medium text-[#F9AB00]">
                  Profile {profileCompleteness}% complete
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 wg-section-fade" style={{ animationDelay: "100ms" }}>
            {isSectionLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <article key={`dashboard-skel-${idx}`} className="rounded-xl border border-[#DADCE0] bg-white p-4 md:px-6 md:py-5">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="h-10 w-10 rounded-[10px] wg-skeleton-shimmer" />
                    <div className="space-y-2">
                      <div className="h-8 w-20 rounded wg-skeleton-shimmer" />
                      <div className="h-3 w-24 rounded wg-skeleton-shimmer" />
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <>
                <article
                  onClick={() => triggerFilter("all")}
                  className="cursor-pointer rounded-xl border border-[#DADCE0] bg-white p-4 transition-all duration-200 ease-in md:px-6 md:py-5 hover:-translate-y-0.5 hover:border-[#C4C7CC] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E8F0FE] text-[#1A73E8]">
                      <Briefcase className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[32px] font-bold leading-none text-[#1D1D1F]">
                        <AnimatedCount value={liveListings} />
                      </p>
                      <p className="mt-2 text-[13px] text-[#8E8E93]">Live Jobs Available</p>
                    </div>
                  </div>
                </article>

                <article
                  onClick={() => triggerFilter("matched")}
                  className="cursor-pointer rounded-xl border border-[#DADCE0] bg-white p-4 shadow-[0_0_0_2px_#1E8E3E20] transition-all duration-200 ease-in md:px-6 md:py-5 hover:-translate-y-0.5 hover:border-[#C4C7CC] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] wg-matched-live-pulse"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4EA] text-[#1E8E3E]">
                      <Sparkles className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[32px] font-bold leading-none text-[#1D1D1F]">
                        <AnimatedCount value={matchedListings} />
                      </p>
                      <p className="mt-2 text-[13px] text-[#8E8E93]">Matched to Your Profile</p>
                    </div>
                  </div>
                </article>

                <article
                  onClick={() => triggerFilter("applied")}
                  className="cursor-pointer rounded-xl border border-[#DADCE0] bg-white p-4 transition-all duration-200 ease-in md:px-6 md:py-5 hover:-translate-y-0.5 hover:border-[#C4C7CC] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#FEF7E0] text-[#F9AB00]">
                      <CheckCircle2 className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[32px] font-bold leading-none text-[#1D1D1F]">
                        <AnimatedCount value={stats.applied} />
                      </p>
                      <p className="mt-2 text-[13px] text-[#8E8E93]">Applications Sent</p>
                      {stats.interview > 0 ? (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#FEF7E0] px-2 py-1 text-xs font-medium text-[#F9AB00]">
                          <LoaderCircle className="h-3.5 w-3.5" />
                          {stats.interview} in interview
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>

                <article
                  onClick={() => triggerFilter("saved")}
                  className="cursor-pointer rounded-xl border border-[#DADCE0] bg-white p-4 transition-all duration-200 ease-in md:px-6 md:py-5 hover:-translate-y-0.5 hover:border-[#C4C7CC] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#FCE8E6] text-[#D93025]">
                      <Bookmark className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[32px] font-bold leading-none text-[#1D1D1F]">
                        <AnimatedCount value={stats.saved} />
                      </p>
                      <p className="mt-2 text-[13px] text-[#8E8E93]">Jobs Saved</p>
                    </div>
                  </div>
                </article>
              </>
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
