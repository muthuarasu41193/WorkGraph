"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Briefcase, Building2, Loader2, Search, Sparkles } from "lucide-react";
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
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function selectJob(jobId: string, title: string) {
    setOpen(false);
    setQuery("");
    navigate("jobs");
    toast({ title: "Opening jobs", description: `Showing listings — look for “${title}”.`, variant: "success" });
    window.setTimeout(() => {
      document.getElementById(`job-card-${jobId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <Input
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls="global-search-listbox"
          aria-autocomplete="list"
          placeholder={compact ? "Search…" : "Search jobs, companies, or skills"}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className={cn(
            "h-10 rounded-[10px] border-slate-200 bg-slate-50 py-0 pl-10 text-[13.5px] text-slate-800 shadow-none",
            "placeholder:text-[13.5px] placeholder:text-slate-400",
            "focus:border-red-400 focus:ring-2 focus:ring-red-100",
            "focus-visible:border-red-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-red-100",
            "[&::-webkit-search-cancel-button]:hidden",
            compact ? "pr-3" : "pr-14",
          )}
        />
        {query.length > 1 && deferredQuery !== query ? (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-slate-400" />
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

      {open && (query.length > 0 || results.length > 0) ? (
        <div
          id="global-search-listbox"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-lg border border-slate-200 bg-background shadow-lg dark:border-slate-700"
        >
          <div className="flex flex-wrap gap-1 border-b border-border p-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
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
                    className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/70"
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
      ) : null}
    </div>
  );
}
