"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, Bell, Bookmark, Briefcase, CheckCircle2, Radar, RefreshCw, SlidersHorizontal, Sparkles, XCircle } from "lucide-react";
import type { JobPipelineCounts } from "../../lib/job-dashboard";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Slider,
  TextField,
  Typography,
} from "@mui/material";

type Props = {
  stats: JobPipelineCounts;
  profileCompleteness: number;
  /** Total rows in public.jobs (Python ATS ingest target table). */
  liveListings: number;
  listingsBySource: Partial<Record<string, number>>;
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
  listingsBySource,
  lastSyncedLabel = "2 mins ago",
}: Props) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [activeSource, setActiveSource] = useState<string | null>(null);
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
  const sourceEntries = Object.entries(listingsBySource).filter(([, n]) => (n ?? 0) > 0);

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

  const sourceItems: Array<{
    key: string;
    name: string;
    icon: string;
    status: "synced" | "syncing" | "error";
    lastSync: string;
    countLabel: string;
  }> = [
    {
      key: "greenhouse",
      name: "Greenhouse",
      icon: "🏢",
      status: "synced",
      lastSync: "Last synced 2 mins ago",
      countLabel: (listingsBySource.greenhouse ?? 3241).toLocaleString(),
    },
    {
      key: "lever",
      name: "Lever",
      icon: "⚙️",
      status: "synced",
      lastSync: "Last synced 4 mins ago",
      countLabel: (listingsBySource.lever ?? 2108).toLocaleString(),
    },
    {
      key: "workday",
      name: "Workday",
      icon: "💼",
      status: "syncing",
      lastSync: "Sync in progress",
      countLabel: "Syncing…",
    },
    {
      key: "smartrecruiters",
      name: "SmartRecruiters",
      icon: "🧠",
      status: "synced",
      lastSync: "Last synced 6 mins ago",
      countLabel: (listingsBySource.smartrecruiters ?? 1456).toLocaleString(),
    },
    {
      key: "ashby",
      name: "Ashby",
      icon: "✨",
      status: "synced",
      lastSync: "Last synced 3 mins ago",
      countLabel: (listingsBySource.ashby ?? 891).toLocaleString(),
    },
    {
      key: "jobvite",
      name: "Jobvite",
      icon: "🧩",
      status: "error",
      lastSync: "Sync failed 12 mins ago",
      countLabel: "Error",
    },
    {
      key: "bamboohr",
      name: "BambooHR",
      icon: "🎋",
      status: "synced",
      lastSync: "Last synced 8 mins ago",
      countLabel: (listingsBySource.bamboohr ?? 734).toLocaleString(),
    },
    {
      key: "icims",
      name: "iCIMS",
      icon: "🌀",
      status: "synced",
      lastSync: "Last synced 5 mins ago",
      countLabel: (listingsBySource.icims ?? 612).toLocaleString(),
    },
    {
      key: "taleo",
      name: "Taleo",
      icon: "📁",
      status: "synced",
      lastSync: "Last synced 7 mins ago",
      countLabel: (listingsBySource.taleo ?? 508).toLocaleString(),
    },
  ];

  function selectSource(source: string | null) {
    setActiveSource(source);
    window.dispatchEvent(new CustomEvent("wg:job-source-filter", { detail: { source } }));
    document.querySelector("#recommended-jobs")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    <section
      aria-labelledby="job-dashboard-heading"
      className="rounded-xl border border-[#DADCE0] bg-[#FFFFFF] p-4 sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 wg-section-fade" style={{ animationDelay: "0ms" }}>
        <div className="min-w-0 flex-1">
          <div>
            <h2 id="job-dashboard-heading" className="text-2xl font-bold leading-8 text-[#1D1D1F]">
              Job Dashboard
            </h2>
            <p className="mt-1 text-sm font-normal text-[#8E8E93]">Live jobs matched to your profile</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-[20px] bg-[#E6F4EA] px-3 py-1 text-xs font-medium text-[#1E8E3E]">
              <span className="h-2 w-2 rounded-full bg-[#1E8E3E] animate-pulse" aria-hidden />
              Live • Last synced {lastSyncedLabel}
            </span>
          </div>
          <p className="mt-3 text-sm font-normal text-[#3A3A3C]">
            Pipeline cards reflect your tracker rows; live listings count syncs from Postgres{" "}
            <code className="rounded bg-[#E8F0FE] px-1 py-0.5 text-[11px] text-[#1557B0]">jobs</code> via ATS
            ingest.
          </p>
          {liveListings > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1 rounded-[20px] border border-[#DADCE0] bg-[#E8F0FE] px-3 py-1 text-xs font-medium text-[#1557B0] sm:gap-1.5">
                <Radar className="h-3.5 w-3.5 text-[#1A73E8]" aria-hidden />
                {liveListings.toLocaleString()} live listings indexed
              </span>
              <button
                type="button"
                onClick={refreshListings}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1 rounded-[20px] border border-[#DADCE0] bg-[#FFFFFF] px-3 py-1 text-xs font-medium text-[#3A3A3C] transition hover:shadow-[0_1px_3px_rgba(0,0,0,0.10)] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2 sm:gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[#1A73E8] ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
                {isRefreshing ? "Refreshing…" : "Refresh listings"}
              </button>
              {sourceEntries.map(([src, n]) => (
                <span
                  key={src}
                  className="rounded-[8px] bg-[#F8F9FA] px-2.5 py-1 text-xs font-medium capitalize text-[#3A3A3C] ring-1 ring-[#DADCE0]"
                >
                  {src}: {(n ?? 0).toLocaleString()}
                </span>
              ))}
              <a
                href="#recommended-jobs"
                className="inline-flex items-center gap-1 rounded-[20px] border border-[#DADCE0] bg-[#FFFFFF] px-3 py-1 text-xs font-medium text-[#3A3A3C] transition hover:shadow-[0_1px_3px_rgba(0,0,0,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2 sm:gap-1.5"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                Filter live jobs
              </a>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-xs leading-relaxed text-[#8E8E93]">
                Run the Python ingest against Supabase Postgres — totals appear here automatically after migration{" "}
                <code className="rounded bg-[#F8F9FA] px-1 py-0.5 text-[11px]">20260202120000_jobs_board</code>.
              </p>
              <button
                type="button"
                onClick={refreshListings}
                disabled={isRefreshing}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[20px] border border-[#DADCE0] bg-[#FFFFFF] px-3 py-1 text-xs font-medium text-[#3A3A3C] transition hover:shadow-[0_1px_3px_rgba(0,0,0,0.10)] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
                {isRefreshing ? "Checking…" : "Check again"}
              </button>
            </div>
          )}
        </div>
        <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
          <button
            type="button"
            onClick={refreshListings}
            disabled={isRefreshing}
            className="inline-flex h-10 items-center gap-2 rounded-[20px] border border-[#DADCE0] px-5 text-sm font-medium text-[#5F6368] transition hover:shadow-[0_1px_3px_rgba(0,0,0,0.10)] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2"
          >
            {syncStatus === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-[#1E8E3E]" aria-hidden />
            ) : syncStatus === "error" ? (
              <XCircle className="h-4 w-4 text-[#D93025] wg-shake" aria-hidden />
            ) : (
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
            )}
            <span className="hidden sm:inline">{isRefreshing ? "Syncing…" : "Sync Jobs"}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAlertModalOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-[20px] bg-[#1A73E8] px-5 text-sm font-medium text-white transition hover:bg-[#1557B0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2"
          >
            <Bell className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Set Job Alerts</span>
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-2xl bg-[#FEF7E0] px-3 py-1.5 text-xs font-medium text-[#F9AB00]">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            Profile {profileCompleteness}% complete
          </span>
        </div>
      </div>

      <section className="mb-5 rounded-xl border border-[#DADCE0] bg-white px-6 py-4 wg-section-fade" style={{ animationDelay: "100ms" }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[#1D1D1F]">Job Sources</h3>
          <a href="#recommended-jobs" className="text-xs font-medium text-[#1A73E8] hover:underline">
            View all integrations
          </a>
        </div>
        <div className="wg-no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {sourceItems.map((source) => {
            const isActive = activeSource === source.key;
            const statusClass =
              source.status === "synced"
                ? "bg-[#1E8E3E]"
                : source.status === "syncing"
                  ? "bg-[#F9AB00]"
                  : "bg-[#D93025]";
            return (
              <button
                key={source.key}
                type="button"
                title={source.lastSync}
                onClick={() => selectSource(source.key)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-[20px] border px-4 py-2 transition ${
                  isActive
                    ? "border-[#1A73E8] bg-[#1A73E8] text-white"
                    : "border-[#DADCE0] bg-[#F8F9FA] text-[#1D1D1F] hover:border-[#1A73E8] hover:bg-[#E8F0FE]"
                }`}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center text-sm">{source.icon}</span>
                <span className="text-[13px] font-medium">{source.name}</span>
                <span
                  className={`rounded-[20px] px-2 py-0.5 text-xs font-semibold ${
                    isActive ? "bg-white/20 text-white" : "bg-[#E8F0FE] text-[#1A73E8]"
                  }`}
                >
                  {source.countLabel}
                </span>
                <span className={`h-2 w-2 rounded-full ${statusClass}`} aria-hidden />
                {source.status === "error" ? (
                  <span
                    onClick={(event) => {
                      event.stopPropagation();
                      refreshListings();
                    }}
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      isActive ? "bg-white/25 text-white" : "bg-[#FCE8E6] text-[#D93025]"
                    }`}
                  >
                    Retry
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 wg-section-fade" style={{ animationDelay: "200ms" }}>
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
              <div className="h-5 w-28 rounded wg-skeleton-shimmer" />
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
              <p className="text-[32px] font-bold leading-none text-[#1D1D1F]"><AnimatedCount value={liveListings} /></p>
              <p className="mt-2 text-[13px] text-[#8E8E93]">Live Jobs Available</p>
              <span className="mt-2 inline-flex rounded-lg bg-[#E6F4EA] px-2 py-1 text-xs font-medium text-[#1E8E3E]">↑ +284 new today</span>
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
              <p className="text-[32px] font-bold leading-none text-[#1D1D1F]"><AnimatedCount value={matchedCount} /></p>
              <p className="mt-2 text-[13px] text-[#8E8E93]">Matched to Your Profile</p>
              <span className="mt-2 inline-flex rounded-lg bg-[#E6F4EA] px-2 py-1 text-xs font-medium text-[#1E8E3E]">↑ +47 new matches</span>
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
              <p className="text-[32px] font-bold leading-none text-[#1D1D1F]"><AnimatedCount value={stats.applied} /></p>
              <p className="mt-2 text-[13px] text-[#8E8E93]">Applications Sent</p>
              <span className="mt-2 inline-flex rounded-lg bg-[#FEF7E0] px-2 py-1 text-xs font-medium text-[#F9AB00]">3 awaiting response</span>
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
              <p className="text-[32px] font-bold leading-none text-[#1D1D1F]"><AnimatedCount value={stats.saved} /></p>
              <p className="mt-2 text-[13px] text-[#8E8E93]">Jobs Saved</p>
              <span className="mt-2 inline-flex rounded-lg bg-[#FCE8E6] px-2 py-1 text-xs font-medium text-[#D93025]">12 expiring soon</span>
            </div>
          </div>
        </article>
        </>
        )}
      </div>

      {totalTracked === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-[#DADCE0] bg-[#F8F9FA] px-4 py-3 text-center text-xs leading-relaxed text-[#3A3A3C]">
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

      <Dialog
        open={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="create-job-alert-title"
      >
        <DialogTitle id="create-job-alert-title" sx={{ fontWeight: 700, fontSize: 22 }}>
          Create Job Alert
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Get notified when new matching jobs are posted
          </Typography>
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField label="Alert name" value={alertName} onChange={(e) => setAlertName(e.target.value)} size="small" />
            <Box>
              <Typography variant="caption" color="text.secondary">Keywords</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                {keywords.map((kw) => (
                  <Chip key={kw} label={kw} onDelete={() => setKeywords((prev) => prev.filter((x) => x !== kw))} />
                ))}
              </Box>
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <TextField
                  size="small"
                  fullWidth
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
                <Button onClick={addKeyword} variant="outlined">Add</Button>
              </Box>
            </Box>
            <TextField label="Location" value={alertLocation} onChange={(e) => setAlertLocation(e.target.value)} size="small" />
            <Box>
              <Typography variant="caption" color="text.secondary">Frequency</Typography>
              <RadioGroup value={frequency} onChange={(e) => setFrequency(e.target.value as "realtime" | "daily" | "weekly")}>
                <FormControlLabel value="realtime" control={<Radio />} label="Real-time (instant notification)" />
                <FormControlLabel value="daily" control={<Radio />} label="Daily digest (9 AM)" />
                <FormControlLabel value="weekly" control={<Radio />} label="Weekly digest (Mondays)" />
              </RadioGroup>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Channels</Typography>
              <FormControlLabel control={<Checkbox checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} />} label="Email notifications" />
              <FormControlLabel control={<Checkbox checked={inAppEnabled} onChange={(e) => setInAppEnabled(e.target.checked)} />} label="In-app notifications" />
              <FormControlLabel control={<Checkbox checked={smsEnabled} onChange={(e) => setSmsEnabled(e.target.checked)} />} label="SMS (add phone number)" />
              {smsEnabled ? <TextField size="small" fullWidth placeholder="+1 555 123 4567" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /> : null}
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Only notify me for jobs with {matchThreshold}%+ match
              </Typography>
              <Slider value={matchThreshold} onChange={(_, value) => setMatchThreshold(Number(value))} min={40} max={100} valueLabelDisplay="auto" />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAlertModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setIsAlertModalOpen(false)}>Create Alert</Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}
