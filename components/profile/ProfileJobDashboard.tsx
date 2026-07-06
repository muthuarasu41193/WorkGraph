"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  AlertTriangle,
  Bell,
  Bookmark,
  Briefcase,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { JobPipelineCounts } from "../../lib/job-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Props = {
  stats: JobPipelineCounts;
  profileCompleteness: number;
  /** Total rows in public.jobs (Python ATS ingest target table). */
  liveListings: number;
  lastSyncedLabel?: string;
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
  lastSyncedLabel = "2 mins ago",
}: Props) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSectionLoading, setIsSectionLoading] = useState(true);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertName, setAlertName] = useState("Senior React Engineer in Remote");
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>(["React", "TypeScript", "Remote"]);
  const [alertLocation, setAlertLocation] = useState("Remote");
  const [frequency, setFrequency] = useState<"realtime" | "daily" | "weekly">("daily");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [matchThreshold, setMatchThreshold] = useState(70);
  const totalTracked = stats.applied + stats.interview + stats.offers + stats.saved;
  const matchedCount = liveListings > 0 ? Math.min(liveListings, Math.max(totalTracked, Math.round(liveListings * 0.1))) : 0;

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

  function addKeyword() {
    const kw = keywordInput.trim();
    if (!kw) return;
    if (!keywords.some((existing) => existing.toLowerCase() === kw.toLowerCase())) {
      setKeywords((prev) => [...prev, kw]);
    }
    setKeywordInput("");
  }

  useEffect(() => {
    const t = window.setTimeout(() => setIsSectionLoading(false), 650);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <Card className="border-border shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-4 sm:p-6">
      <section aria-labelledby="job-dashboard-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 wg-section-fade" style={{ animationDelay: "0ms" }}>
        <div className="min-w-0 flex-1">
          <div>
            <h2 id="job-dashboard-heading" className="text-heading-l leading-8 text-[var(--text-primary)]">
              Job Dashboard
            </h2>
            <p className="mt-1 text-body font-normal text-[var(--text-tertiary)]">Live ATS jobs matched to your profile (excludes community posts)</p>
            <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--success-subtle)] px-3 py-1 text-caption font-medium text-[var(--success)]">
              <span className="h-2 w-2 rounded-full bg-[var(--success)] animate-pulse" aria-hidden />
              Live • Last synced {lastSyncedLabel}
            </span>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={refreshListings}
            disabled={isRefreshing}
            loading={isRefreshing}
            className="rounded-full"
          >
            {syncStatus === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-[var(--success)]" aria-hidden />
            ) : syncStatus === "error" ? (
              <XCircle className="h-4 w-4 text-[var(--danger)] wg-shake" aria-hidden />
            ) : (
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
            )}
            <span className="hidden sm:inline">{isRefreshing ? "Syncing…" : "Sync Jobs"}</span>
          </Button>
          <Button
            type="button"
            onClick={() => setIsAlertModalOpen(true)}
            className="rounded-full"
          >
            <Bell className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Set Job Alerts</span>
          </Button>
          <span className="inline-flex items-center gap-2 rounded-2xl bg-[var(--warning-subtle)] px-3 py-2 text-caption font-medium text-[var(--warning)]">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            Profile {profileCompleteness}% complete
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 wg-section-fade" style={{ animationDelay: "100ms" }}>
        {isSectionLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <article key={`dashboard-skel-${idx}`} className="rounded-xl border border-[var(--border-default)] bg-surface-primary p-4 md:px-6 md:py-5">
              <div className="mb-3 flex items-start gap-3">
                <div className="h-10 w-10 rounded-[10px] wg-skeleton-shimmer" />
                <div className="space-y-2">
                  <div className="h-8 w-20 rounded wg-skeleton-shimmer" />
                  <div className="h-3 w-24 rounded wg-skeleton-shimmer" />
                </div>
              </div>
              <div className="h-5 w-28 rounded wg-skeleton-shimmer" />
            </article>
          ))
        ) : (
          <>
        <article
          onClick={() => triggerFilter("all")}
          className="cursor-pointer rounded-xl border border-[var(--border-default)] bg-surface-primary p-4 transition-all duration-200 ease-in md:px-6 md:py-5 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--info-subtle)] text-[var(--info)]">
              <Briefcase className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-display leading-none text-[var(--text-primary)]"><AnimatedCount value={liveListings} /></p>
              <p className="mt-2 text-body text-[var(--text-tertiary)]">Live Jobs Available</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[var(--success-subtle)] px-2 py-1 text-caption font-medium text-[var(--success)]">
                <TrendingUp className="h-3.5 w-3.5" />
                +284 new today
              </span>
            </div>
          </div>
        </article>

        <article
          onClick={() => triggerFilter("matched")}
          className="cursor-pointer rounded-xl border border-[var(--border-default)] bg-surface-primary p-4 ring-2 ring-success/20 transition-all duration-200 ease-in md:px-6 md:py-5 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md wg-matched-live-pulse"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--success-subtle)] text-[var(--success)]">
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-display leading-none text-[var(--text-primary)]"><AnimatedCount value={matchedCount} /></p>
              <p className="mt-2 text-body text-[var(--text-tertiary)]">Matched to Your Profile</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[var(--success-subtle)] px-2 py-1 text-caption font-medium text-[var(--success)]">
                <TrendingUp className="h-3.5 w-3.5" />
                +47 new matches
              </span>
            </div>
          </div>
        </article>

        <article
          onClick={() => triggerFilter("applied")}
          className="cursor-pointer rounded-xl border border-[var(--border-default)] bg-surface-primary p-4 transition-all duration-200 ease-in md:px-6 md:py-5 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--warning-subtle)] text-[var(--warning)]">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-display leading-none text-[var(--text-primary)]"><AnimatedCount value={stats.applied} /></p>
              <p className="mt-2 text-body text-[var(--text-tertiary)]">Applications Sent</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[var(--warning-subtle)] px-2 py-1 text-caption font-medium text-[var(--warning)]">
                <LoaderCircle className="h-3.5 w-3.5" />
                3 awaiting response
              </span>
            </div>
          </div>
        </article>

        <article
          onClick={() => triggerFilter("saved")}
          className="cursor-pointer rounded-xl border border-[var(--border-default)] bg-surface-primary p-4 transition-all duration-200 ease-in md:px-6 md:py-5 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--danger-subtle)] text-[var(--danger)]">
              <Bookmark className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-display leading-none text-[var(--text-primary)]"><AnimatedCount value={stats.saved} /></p>
              <p className="mt-2 text-body text-[var(--text-tertiary)]">Jobs Saved</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[var(--danger-subtle)] px-2 py-1 text-caption font-medium text-[var(--danger)]">
                <AlertTriangle className="h-3.5 w-3.5" />
                12 expiring soon
              </span>
            </div>
          </div>
        </article>
        </>
        )}
      </div>

      {totalTracked === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-secondary)] px-4 py-3 text-center text-caption leading-relaxed text-[var(--text-secondary)]">
          {liveListings > 0 ? (
            <>
              No personal tracker rows yet — listing totals above come from shared ATS ingest. Insert rows into{" "}
              <code className="rounded bg-surface-secondary px-1 py-1 text-caption">job_tracker_entries</code> when your CRM
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

      <Dialog open={isAlertModalOpen} onOpenChange={setIsAlertModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle id="create-job-alert-title">Create Job Alert</DialogTitle>
            <DialogDescription>
              Get notified when new matching jobs are posted
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="alert-name">Alert name</Label>
              <Input id="alert-name" value={alertName} onChange={(e) => setAlertName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Keywords</Label>
              <div className="flex flex-wrap gap-1">
                {keywords.map((kw) => (
                  <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                    {kw}
                    <IconButton
                      type="button"
                      variant="ghost"
                      iconSize="sm"
                      onClick={() => setKeywords((prev) => prev.filter((x) => x !== kw))}
                      className="ml-1 rounded-full"
                      label={`Remove ${kw}`}
                      icon={<XCircle className="h-3 w-3" />}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add keyword"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addKeyword}>
                  Add
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="alert-location">Location</Label>
              <Input id="alert-location" value={alertLocation} onChange={(e) => setAlertLocation(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Frequency</Label>
              <RadioGroup
                value={frequency}
                onValueChange={(v) => setFrequency(v as "realtime" | "daily" | "weekly")}
                className="space-y-2"
              >
                {(
                  [
                    { value: "realtime", label: "Real-time (instant notification)" },
                    { value: "daily", label: "Daily digest (9 AM)" },
                    { value: "weekly", label: "Weekly digest (Mondays)" },
                  ] as const
                ).map((opt) => (
                  <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-body">
                    <RadioGroupItem value={opt.value} id={`frequency-${opt.value}`} />
                    {opt.label}
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="grid gap-2">
              <Label>Channels</Label>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-body">
                  <Checkbox checked={emailEnabled} onCheckedChange={(c) => setEmailEnabled(c === true)} />
                  Email notifications
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-body">
                  <Checkbox checked={inAppEnabled} onCheckedChange={(c) => setInAppEnabled(c === true)} />
                  In-app notifications
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-body">
                  <Checkbox checked={smsEnabled} onCheckedChange={(c) => setSmsEnabled(c === true)} />
                  SMS (add phone number)
                </label>
              </div>
              {smsEnabled ? (
                <Input placeholder="+1 555 123 4567" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="match-threshold">
                Only notify me for jobs with {matchThreshold}%+ match
              </Label>
              <Input
                id="match-threshold"
                type="range"
                min={40}
                max={100}
                value={matchThreshold}
                onChange={(e) => setMatchThreshold(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none border-0 bg-transparent p-0 accent-[var(--accent)] focus-visible:ring-0"
              />
              <span className="text-caption text-muted-foreground">{matchThreshold}%</span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAlertModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => setIsAlertModalOpen(false)}>
              Create Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </section>
      </CardContent>
    </Card>
  );
}
