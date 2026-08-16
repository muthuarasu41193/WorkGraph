"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Briefcase, Building2, Search, Sparkles, X } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDashboardContext } from "@/components/dashboard/DashboardProvider";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { toast } from "@/hooks/use-toast";

type SearchFilter = "all" | "jobs" | "companies" | "skills";

const FILTERS: { id: SearchFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "jobs", label: "Jobs" },
  { id: "companies", label: "Companies" },
  { id: "skills", label: "Skills" },
];

type Props = {
  className?: string;
  compact?: boolean;
  onOpenCommandPalette?: () => void;
};

export default function GlobalSearch({ className, compact = false, onOpenCommandPalette }: Props) {
  const { recommendedJobs, profile } = useDashboardContext();
  const { navigate } = useDashboardNavigation();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [open, setOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (deferredQuery.length < 2) return [];
    return recommendedJobs
      .filter((job) => {
        const blob = `${job.title} ${job.company} ${job.location} ${job.description} ${job.matchedSkills.join(" ")}`.toLowerCase();
        if (!blob.includes(deferredQuery)) return false;
        if (filter === "companies") return job.company.toLowerCase().includes(deferredQuery);
        if (filter === "skills") return job.matchedSkills.some((s) => s.toLowerCase().includes(deferredQuery));
        return true;
      })
      .slice(0, 8);
  }, [deferredQuery, filter, recommendedJobs]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        if (compact) setOverlayOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [compact]);

  useEffect(() => {
    if (!overlayOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOverlayOpen(false);
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [overlayOpen]);

  function closeOverlay() {
    setOverlayOpen(false);
    setOpen(false);
    setQuery("");
  }

  function selectJob(jobId: string, title: string) {
    closeOverlay();
    navigate("jobs");
    toast({ title: "Opening jobs", description: `Showing listings — look for “${title}”.`, variant: "success" });
    window.setTimeout(() => {
      document.getElementById(`job-card-${jobId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
  }

  const searchField = (
    <div className="relative min-w-0 flex-1">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <Input
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls="global-search-listbox"
        aria-autocomplete="list"
        autoFocus={compact && overlayOpen}
        placeholder={compact ? "Search…" : "Search jobs, companies, or skills"}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className={cn(
          "h-9 rounded-lg border-slate-200 bg-slate-50 py-0 pl-9 text-[13px] text-slate-800 shadow-none",
          "placeholder:text-[13px] placeholder:text-slate-400",
          "focus-visible:border-red-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
          "[&::-webkit-search-cancel-button]:hidden",
          compact ? "pr-3" : "pr-14",
        )}
      />
      {query.length > 1 && deferredQuery !== query.trim().toLowerCase() ? (
        <span
          className="absolute right-3 top-1/2 h-3.5 w-8 -translate-y-1/2 rounded wg-skeleton-shimmer"
          aria-label="Searching"
        />
      ) : !compact && !query ? (
        <button
          type="button"
          onClick={() => onOpenCommandPalette?.()}
          className="absolute right-2 top-1/2 hidden h-[22px] -translate-y-1/2 items-center rounded-md border border-slate-200 bg-white px-1.5 font-sans text-[11px] font-medium text-slate-400 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-500 md:inline-flex"
          aria-label="Open command palette"
        >
          <kbd className="font-sans text-[11px] font-medium">⌘K</kbd>
        </button>
      ) : null}
    </div>
  );

  const resultsPanel =
    open && (query.length > 0 || results.length > 0) ? (
      <div
        id="global-search-listbox"
        role="listbox"
        className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[min(24rem,70dvh)] overflow-hidden overflow-x-clip rounded-lg border border-slate-200 bg-background shadow-lg dark:border-slate-700"
      >
        <div className="flex flex-wrap gap-1 border-b border-border p-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "wg-touch-target rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                filter === f.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {deferredQuery.length < 2 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">Type at least 2 characters to search.</p>
        ) : results.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">
            No matches for “{query}”. Try a skill from your profile: {profile.skills.slice(0, 3).join(", ") || "add skills first"}.
          </p>
        ) : (
          <ul className="max-h-72 overflow-y-auto py-1">
            {results.map((job) => (
              <li key={job.id} role="option">
                <button
                  type="button"
                  className="flex min-h-10 w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/70"
                  onClick={() => selectJob(job.id, job.title)}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Briefcase className={iconClass()} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{job.title}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className={iconClass()} />
                      {job.company}
                      <Badge variant="outline" className="h-5 px-1.5 text-xs">
                        {job.source}
                      </Badge>
                    </span>
                  </span>
                  {job.matchedSkills.length > 0 ? (
                    <Sparkles className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    ) : null;

  if (compact) {
    return (
      <div ref={containerRef} className={cn("relative", className)}>
        <button
          type="button"
          className="wg-touch-target flex size-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
          aria-label="Search jobs, companies, or skills"
          aria-expanded={overlayOpen}
          onClick={() => {
            setOverlayOpen(true);
            setOpen(true);
          }}
        >
          <Search className="size-4" />
        </button>

        {overlayOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[55] bg-black/40"
              aria-label="Dismiss search"
              onClick={closeOverlay}
            />
            <div className="fixed inset-x-0 top-0 z-[60] border-b border-slate-200 bg-white px-3 py-2.5 shadow-sm">
              <div className="flex items-center gap-2">
                {searchField}
                <button
                  type="button"
                  className="wg-touch-target flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Close search"
                  onClick={closeOverlay}
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="relative">{resultsPanel}</div>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative w-full min-w-0", className)}>
      {searchField}
      {resultsPanel}
    </div>
  );
}
