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
import { iconClass } from "@/lib/icon-styles";
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
    <Card className="border-slate-200 shadow-none">
      <CardContent className="p-0">
        <section aria-labelledby="job-dashboard-heading">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3 wg-section-fade" style={{ animationDelay: "0ms" }}>
            <div className="min-w-0 flex-1">
              <h2 id="job-dashboard-heading" className="text-[17px] font-semibold tracking-tight text-fg-primary">
                Job Dashboard
              </h2>
              <p className="mt-0.5 text-[13px] font-normal text-fg-secondary">
                Live ATS jobs matched to your profile
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
              <button
                type="button"
                onClick={refreshListings}
                disabled={isRefreshing}
                className="inline-flex h-10 items-center gap-2 rounded-[20px] border border-border-default px-5 text-sm font-medium text-fg-secondary transition hover:shadow-[0_1px_3px_rgba(0,0,0,0.10)] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2"
              >
                {syncStatus === "error" ? (
                  <XCircle className={iconClass("inline", "text-brand wg-shake")} aria-hidden />
                ) : (
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
                )}
                <span className="hidden sm:inline">{isRefreshing ? "Syncing…" : "Sync Jobs"}</span>
              </button>
              {profileCompleteness < 100 ? (
                <span className="inline-flex items-center gap-1.5 rounded-2xl bg-warning-50 px-3 py-1.5 text-xs font-medium text-warning">
                  Profile {profileCompleteness}% complete
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 wg-section-fade" style={{ animationDelay: "100ms" }}>
            {isSectionLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <article key={`dashboard-skel-${idx}`} className="rounded-[10px] border border-border-default bg-surface p-3.5 md:px-4 md:py-3.5">
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
                  className="cursor-pointer rounded-xl border border-border-default bg-surface p-4 transition-all duration-200 ease-in md:px-4 md:py-3.5 hover:border-border-strong hover:bg-slate-50"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-info-50 text-info">
                      <Briefcase className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-2xl font-semibold leading-none tracking-tight text-fg-primary">
                        <AnimatedCount value={liveListings} />
                      </p>
                      <p className="mt-1.5 text-[13px] text-fg-secondary">Live Jobs Available</p>
                    </div>
                  </div>
                </article>

                <article
                  onClick={() => triggerFilter("matched")}
                  className="cursor-pointer rounded-xl border border-border-default bg-surface p-4 shadow-[0_0_0_2px_color-mix(in_srgb,var(--wg-success)_20%,transparent)] transition-all duration-200 ease-in md:px-4 md:py-3.5 hover:border-border-strong hover:bg-slate-50 wg-matched-live-pulse"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-success-50 text-success">
                      <Sparkles className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-2xl font-semibold leading-none tracking-tight text-fg-primary">
                        <AnimatedCount value={matchedListings} />
                      </p>
                      <p className="mt-1.5 text-[13px] text-fg-secondary">Matched to Your Profile</p>
                    </div>
                  </div>
                </article>

                <article
                  onClick={() => triggerFilter("applied")}
                  className="cursor-pointer rounded-xl border border-border-default bg-surface p-4 transition-all duration-200 ease-in md:px-4 md:py-3.5 hover:border-border-strong hover:bg-slate-50"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-warning-50 text-warning">
                      <CheckCircle2 className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-2xl font-semibold leading-none tracking-tight text-fg-primary">
                        <AnimatedCount value={stats.applied} />
                      </p>
                      <p className="mt-1.5 text-[13px] text-fg-secondary">Applications Sent</p>
                      {stats.interview > 0 ? (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-lg bg-warning-50 px-2 py-1 text-xs font-medium text-warning">
                          <LoaderCircle className={iconClass()} />
                          {stats.interview} in interview
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>

                <article
                  onClick={() => triggerFilter("saved")}
                  className="cursor-pointer rounded-xl border border-border-default bg-surface p-4 transition-all duration-200 ease-in md:px-4 md:py-3.5 hover:border-border-strong hover:bg-slate-50"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-50 text-brand">
                      <Bookmark className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-2xl font-semibold leading-none tracking-tight text-fg-primary">
                        <AnimatedCount value={stats.saved} />
                      </p>
                      <p className="mt-1.5 text-[13px] text-fg-secondary">Jobs Saved</p>
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
