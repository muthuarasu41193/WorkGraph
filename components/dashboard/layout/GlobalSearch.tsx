"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Briefcase, Building2, Search as SearchIcon, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
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
};

export default function GlobalSearch({ className, compact = false }: Props) {
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
        <SearchIcon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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
            "h-11 rounded-lg border-border bg-surface-secondary/80 pl-10 pr-3 shadow-sm transition-shadow focus-visible:bg-background focus-visible:shadow-md",
            compact && "h-10",
          )}
        />
        {query.length > 1 && deferredQuery !== query ? (
          <Spinner className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        ) : null}
      </div>

      {open && (query.length > 0 || results.length > 0) ? (
        <div
          id="global-search-listbox"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+var(--space-2))] z-50 overflow-hidden rounded-lg border border-border bg-background shadow-xl"
        >
          <div className="flex flex-wrap gap-1 border-b border-border p-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-md px-3 py-1 text-caption font-medium transition-colors",
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
            <p className="px-3 py-4 text-body text-muted-foreground">Type at least 2 characters to search.</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-body text-muted-foreground">
              No matches for “{query}”. Try a skill from your profile: {profile.skills.slice(0, 3).join(", ") || "add skills first"}.
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((job) => (
                <li key={job.id} role="option">
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/70"
                    onClick={() => selectJob(job.id, job.title)}
                  >
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Briefcase className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body font-medium">{job.title}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {job.company}
                        <Badge variant="outline" className="h-5 px-2 text-caption">
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
