"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  ArrowUpRight,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  GraduationCap,
  ExternalLink,
  LayoutGrid,
  LayoutList,
  LifeBuoy,
  MapPin,
  Loader2,
  Sparkles,
  SearchX,
  Search,
  SlidersHorizontal,
  Star,
  Target,
  TriangleAlert,
  Zap,
  ArrowUp,
  UserSearch,
  X,
} from "lucide-react";
import type { FeedDemoHint, JobFeedSource, RecommendedJobCard } from "../../lib/job-dashboard";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControlLabel,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";

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
  workday: {
    label: "Workday",
    className: "bg-[#E8F0FE] text-[#1557B0] ring-[#1A73E8]/25",
  },
  smartrecruiters: {
    label: "SmartRecruiters",
    className: "bg-cyan-500/12 text-cyan-800 ring-cyan-500/25",
  },
  ashby: {
    label: "Ashby",
    className: "bg-violet-600/12 text-violet-900 ring-violet-500/25",
  },
  jobvite: { label: "Jobvite", className: "bg-rose-500/12 text-rose-800 ring-rose-500/25" },
  bamboohr: { label: "BambooHR", className: "bg-lime-500/12 text-lime-900 ring-lime-500/25" },
  icims: { label: "iCIMS", className: "bg-indigo-500/12 text-indigo-900 ring-indigo-500/25" },
  taleo: { label: "Taleo", className: "bg-slate-500/12 text-slate-800 ring-slate-400/25" },
  linkedin: { label: "LinkedIn", className: "bg-[#0a66c2]/12 text-[#0a66c2] ring-[#0a66c2]/20" },
  reddit: { label: "Reddit", className: "bg-orange-500/12 text-orange-800 ring-orange-400/25" },
  indeed: { label: "Indeed", className: "bg-blue-600/12 text-blue-800 ring-blue-500/20" },
  glassdoor: { label: "Glassdoor", className: "bg-emerald-700/10 text-emerald-900 ring-emerald-600/15" },
  levels: { label: "Levels.fyi", className: "bg-violet-600/12 text-violet-900 ring-violet-500/20" },
  other: { label: "Other ATS", className: "bg-[#F8F9FA] text-[#3A3A3C] ring-[#DADCE0]" },
};

const DATE_OPTIONS = [
  { id: "any" as const, label: "Any time" },
  { id: "1" as const, label: "Past 24h" },
  { id: "7" as const, label: "Last 7 days" },
  { id: "30" as const, label: "Last 30 days" },
];

const PAGE_SIZE = 20;
const FILTER_TRIGGER_BASE_CLASS =
  "inline-flex h-10 cursor-pointer list-none items-center gap-1 rounded-[20px] border px-4 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2";
const FILTER_TRIGGER_INACTIVE_CLASS =
  `${FILTER_TRIGGER_BASE_CLASS} border-[#DADCE0] bg-white text-[#3A3A3C] hover:border-[#1A73E8] hover:bg-[#E8F0FE]`;
const FILTER_TRIGGER_ACTIVE_CLASS = `${FILTER_TRIGGER_BASE_CLASS} border-[#1A73E8] bg-[#1A73E8] text-white`;

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

function passesDateFilter(iso: string | null | undefined, windowId: "any" | "1" | "7" | "30"): boolean {
  if (windowId === "any") return true;
  if (!iso) return true;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return true;
  const days = Number(windowId);
  const cutoff = Date.now() - days * 86400000;
  return t >= cutoff;
}

function getMatchScore(job: RecommendedJobCard, skillHints: string[]): number {
  const normalizedHints = skillHints.map((s) => s.toLowerCase());
  const hintHits = normalizedHints.filter((hint) =>
    job.matchedSkills.some((matched) => matched.toLowerCase() === hint)
  ).length;
  const titleLocationBlob = `${job.title} ${job.location}`.toLowerCase();
  const titleHits = normalizedHints.filter((hint) => titleLocationBlob.includes(hint)).length;
  const recencyBonus = job.postedAtIso ? Math.max(0, 6 - Math.floor((Date.now() - new Date(job.postedAtIso).getTime()) / 86400000)) : 0;
  const raw = 58 + job.matchedSkills.length * 6 + hintHits * 4 + titleHits * 2 + recencyBonus;
  return Math.max(56, Math.min(98, raw));
}

function companyInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "CO";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function RecommendedJobsSection({ jobs, skillHints, feedKind, feedDemoHint }: Props) {
  const autoLoadRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery("(max-width:767px)");
  const hint =
    skillHints.length > 0
      ? feedKind === "live"
        ? `Ranked from ingested ATS roles — boosted when titles/descriptions mention ${skillHints.slice(0, 3).join(", ")}${skillHints.length > 3 ? "…" : ""}.`
        : `Demo cards — once ingest fills Postgres, listings personalize against ${skillHints.slice(0, 3).join(", ")}${skillHints.length > 3 ? "…" : ""}.`
      : feedKind === "live"
        ? "Ranked using your headline, summary text, and saved skills vs each posting."
        : "Add skills to your profile to sharpen ranking after ingest runs.";

  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [dateWindow, setDateWindow] = useState<"any" | "1" | "7" | "30">(
    (searchParams.get("date") as "any" | "1" | "7" | "30") ?? "any"
  );
  const [sources, setSources] = useState<Set<JobFeedSource>>(
    () => new Set((searchParams.get("src") ?? "").split(",").filter(Boolean) as JobFeedSource[])
  );
  const [skillsPick, setSkillsPick] = useState<Set<string>>(() => new Set());
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [matchScore, setMatchScore] = useState<"any" | "90" | "75" | "60">("any");
  const [jobTypes, setJobTypes] = useState<Set<string>>(() => new Set());
  const [locationMode, setLocationMode] = useState<"any" | "remote" | "hybrid" | "onsite">("any");
  const [locationQuery, setLocationQuery] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<string>("any");
  const [salaryMin, setSalaryMin] = useState(0);
  const [salaryMax, setSalaryMax] = useState(500);
  const [currency, setCurrency] = useState("USD");
  const [salaryPeriod, setSalaryPeriod] = useState<"year" | "hour">("year");
  const [companySize, setCompanySize] = useState<string>("any");
  const [industries, setIndustries] = useState<Set<string>>(() => new Set());
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [isMatchProfileExpanded, setIsMatchProfileExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">((searchParams.get("view") as "list" | "grid") ?? "list");
  const [sortBy, setSortBy] = useState<"best" | "newest" | "salary_desc" | "salary_asc" | "company_asc">(
    (searchParams.get("sort") as "best" | "newest" | "salary_desc" | "salary_asc" | "company_asc") ?? "best"
  );
  const [savedJobs, setSavedJobs] = useState<Set<string>>(() => new Set());
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [autoLoadEnabled, setAutoLoadEnabled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileDetailJobId, setMobileDetailJobId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [bouncingBookmarkId, setBouncingBookmarkId] = useState<string | null>(null);

  const platformsInFeed = useMemo(() => {
    const u = new Set<JobFeedSource>();
    for (const j of jobs) u.add(j.source);
    return Array.from(u).sort();
  }, [jobs]);

  function getSalaryBand(job: RecommendedJobCard): [number, number] {
    const base = 90 + (job.id.length % 6) * 15;
    return [base, base + 60];
  }

  function getJobType(job: RecommendedJobCard): string {
    const types = ["Full-time", "Part-time", "Contract", "Freelance", "Internship", "Temporary"];
    return types[job.id.length % types.length];
  }

  function getExperience(job: RecommendedJobCard): string {
    const levels = ["1+ years", "3+ years", "5+ years", "8+ years"];
    return levels[job.id.length % levels.length];
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const score = getMatchScore(job, skillHints);
      if (q) {
        const blob = `${job.title} ${job.company} ${job.location} ${job.matchLabel} ${job.matchedSkills.join(" ")}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      if (!passesDateFilter(job.postedAtIso, dateWindow)) return false;
      if (matchScore !== "any") {
        if (score < Number(matchScore)) return false;
      }
      if (sources.size > 0 && !sources.has(job.source)) return false; // empty set = all platforms
      if (jobTypes.size > 0 && !jobTypes.has(getJobType(job))) return false;
      if (locationMode !== "any") {
        const loc = job.location.toLowerCase();
        if (locationMode === "remote" && !loc.includes("remote")) return false;
        if (locationMode === "hybrid" && !loc.includes("hybrid")) return false;
        if (locationMode === "onsite" && !(loc.includes("on-site") || loc.includes("onsite"))) return false;
      }
      if (locationQuery.trim()) {
        if (!job.location.toLowerCase().includes(locationQuery.trim().toLowerCase())) return false;
      }
      if (skillsPick.size > 0) {
        const hasAny = [...skillsPick].some((sk) =>
          job.matchedSkills.some((m) => m.toLowerCase() === sk.toLowerCase())
        );
        if (!hasAny) return false;
      }
      if (experienceLevel !== "any" && getExperience(job) !== experienceLevel) return false;
      const [, salaryMaxK] = getSalaryBand(job);
      if (salaryMaxK < salaryMin || salaryMaxK > salaryMax) return false;
      const industryKeywords: Record<string, string[]> = {
        Technology: ["software", "engineer", "developer", "saas", "ai"],
        Finance: ["finance", "fintech", "bank", "payments"],
        Healthcare: ["health", "clinical", "med", "biotech"],
        Marketing: ["marketing", "growth", "seo", "brand"],
        Design: ["design", "ux", "ui", "product design"],
        Legal: ["legal", "law", "compliance"],
        Education: ["education", "edtech", "curriculum"],
        Retail: ["retail", "commerce", "ecommerce"],
      };
      if (industries.size > 0) {
        const hay = `${job.title} ${job.company} ${job.matchLabel}`.toLowerCase();
        const matchesIndustry = Array.from(industries).some((industry) =>
          (industryKeywords[industry] ?? []).some((kw) => hay.includes(kw))
        );
        if (!matchesIndustry) return false;
      }
      return true;
    });
  }, [
    jobs,
    query,
    dateWindow,
    matchScore,
    sources,
    skillsPick,
    jobTypes,
    locationMode,
    locationQuery,
    experienceLevel,
    salaryMin,
    salaryMax,
    industries,
    skillHints,
  ]);

  const sortedJobs = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      if (sortBy === "company_asc") return a.company.localeCompare(b.company);
      if (sortBy === "newest") return (new Date(b.postedAtIso || 0).getTime() || 0) - (new Date(a.postedAtIso || 0).getTime() || 0);
      if (sortBy === "salary_desc") return getSalaryBand(b)[1] - getSalaryBand(a)[1];
      if (sortBy === "salary_asc") return getSalaryBand(a)[1] - getSalaryBand(b)[1];
      return getMatchScore(b, skillHints) - getMatchScore(a, skillHints);
    });
    return rows;
  }, [filtered, sortBy, skillHints]);

  const visibleJobs = useMemo(() => sortedJobs.slice(0, visible), [sortedJobs, visible]);
  const totalMatched = sortedJobs.length;
  const rangeStart = totalMatched === 0 ? 0 : 1;
  const rangeEnd = Math.min(visible, totalMatched);

  const loadMoreJobs = useCallback(() => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    window.setTimeout(() => {
      setVisible((v) => v + PAGE_SIZE);
      setIsLoadingMore(false);
    }, 450);
  }, [isLoadingMore]);

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

  const clearFilters = useCallback(() => {
    setQuery("");
    setSearchInput("");
    setDateWindow("any");
    setSources(new Set());
    setSkillsPick(new Set());
    setMatchScore("any");
    setJobTypes(new Set());
    setLocationMode("any");
    setLocationQuery("");
    setExperienceLevel("any");
    setSalaryMin(0);
    setSalaryMax(500);
    setCurrency("USD");
    setSalaryPeriod("year");
    setCompanySize("any");
    setIndustries(new Set());
    setVisible(PAGE_SIZE);
  }, []);

  useEffect(() => {
    setIsSearching(true);
    const handle = window.setTimeout(() => setQuery(searchInput), 300);
    return () => {
      window.clearTimeout(handle);
      setIsSearching(false);
    };
  }, [searchInput]);

  useEffect(() => {
    setIsSearching(false);
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput.trim()) params.set("q", searchInput.trim());
      else params.delete("q");
      if (dateWindow !== "any") params.set("date", dateWindow);
      else params.delete("date");
      if (sources.size > 0) params.set("src", Array.from(sources).join(","));
      else params.delete("src");
      params.set("view", viewMode);
      params.set("sort", sortBy);
      const next = `${pathname}?${params.toString()}`;
      router.replace(next, { scroll: false });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, dateWindow, sources, viewMode, sortBy, pathname, router, searchParams]);

  useEffect(() => {
    const closeAllDropdowns = () => {
      document.querySelectorAll<HTMLDetailsElement>('details[data-filter-dropdown="true"]').forEach((el) => {
        el.open = false;
      });
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const insideDropdown = (target as Element).closest('details[data-filter-dropdown="true"]');
      if (!insideDropdown) closeAllDropdowns();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAllDropdowns();
        setIsMoreFiltersOpen(false);
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const active = document.activeElement as HTMLElement | null;
      if (!active) return;
      const menu = active.closest("[data-filter-menu='true']") as HTMLElement | null;
      if (!menu) return;
      const focusables = Array.from(
        menu.querySelectorAll<HTMLElement>("button,input,select,[tabindex]:not([tabindex='-1'])")
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusables.length === 0) return;
      const currentIndex = focusables.indexOf(active);
      const nextIndex =
        event.key === "ArrowDown"
          ? (currentIndex + 1 + focusables.length) % focusables.length
          : (currentIndex - 1 + focusables.length) % focusables.length;
      focusables[nextIndex]?.focus();
      event.preventDefault();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setIsInitialLoading(false), 700);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!autoLoadEnabled) return;
    if (!autoLoadRef.current) return;
    if (visible >= sortedJobs.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && !isLoadingMore) {
          loadMoreJobs();
        }
      },
      { threshold: 0, rootMargin: "0px 0px 20% 0px" }
    );
    observer.observe(autoLoadRef.current);
    return () => observer.disconnect();
  }, [autoLoadEnabled, visible, sortedJobs.length, isLoadingMore]);

  const skeletonCount = viewMode === "grid" ? 6 : 3;
  const showSkeleton = isInitialLoading || isLoadingMore;
  const shouldVirtualize = false;

  useEffect(() => {
    const handler = (event: Event) => {
      const ce = event as CustomEvent<{ filter?: "all" | "matched" | "applied" | "saved" }>;
      const filter = ce.detail?.filter;
      if (!filter) return;
      if (filter === "all") {
        clearFilters();
        return;
      }
      if (filter === "matched") {
        setQuery("");
        setDateWindow("any");
        setSources(new Set());
        setVisible(PAGE_SIZE);
        if (skillHints.length > 0) {
          setSkillsPick(new Set([skillHints[0]]));
        }
        return;
      }
      // Applied/saved cards currently route users into the jobs list view.
      // Dedicated per-job status filtering will be wired when tracker status is attached to each row.
      setQuery("");
      setDateWindow("any");
      setSources(new Set());
      setSkillsPick(new Set());
      setVisible(PAGE_SIZE);
    };
    window.addEventListener("wg:job-filter", handler as EventListener);
    return () => window.removeEventListener("wg:job-filter", handler as EventListener);
  }, [skillHints]);

  useEffect(() => {
    const handler = (event: Event) => {
      const ce = event as CustomEvent<{ source?: string | null }>;
      if (!ce.detail) return;
      const source = ce.detail.source;
      setVisible(PAGE_SIZE);
      if (!source) {
        setSources(new Set());
        return;
      }
      setSources(new Set([source as JobFeedSource]));
    };
    window.addEventListener("wg:job-source-filter", handler as EventListener);
    return () => window.removeEventListener("wg:job-source-filter", handler as EventListener);
  }, []);

  const hasActiveFilters =
    query.trim() !== "" ||
    dateWindow !== "any" ||
    sources.size > 0 ||
    skillsPick.size > 0 ||
    matchScore !== "any" ||
    jobTypes.size > 0 ||
    locationMode !== "any" ||
    locationQuery.trim() !== "" ||
    experienceLevel !== "any" ||
    companySize !== "any" ||
    industries.size > 0;
  const activeFilterCount =
    (query.trim() ? 1 : 0) +
    (dateWindow !== "any" ? 1 : 0) +
    (sources.size > 0 ? 1 : 0) +
    (skillsPick.size > 0 ? 1 : 0) +
    (matchScore !== "any" ? 1 : 0) +
    (jobTypes.size > 0 ? 1 : 0) +
    (locationMode !== "any" || locationQuery.trim() ? 1 : 0) +
    (experienceLevel !== "any" ? 1 : 0) +
    (companySize !== "any" ? 1 : 0) +
    (industries.size > 0 ? 1 : 0);

  const activeFilterChips = [
    query.trim() ? { key: "query", label: `Search: ${query.trim()}` } : null,
    matchScore !== "any" ? { key: "match", label: `Match ${matchScore}%+` } : null,
    dateWindow !== "any" ? { key: "date", label: `Date: ${DATE_OPTIONS.find((d) => d.id === dateWindow)?.label}` } : null,
    sources.size > 0 ? { key: "source", label: `Source: ${sources.size}` } : null,
    jobTypes.size > 0 ? { key: "jobType", label: `Job Type: ${jobTypes.size}` } : null,
    (locationMode !== "any" || locationQuery.trim()) ? { key: "location", label: `Location` } : null,
    experienceLevel !== "any" ? { key: "exp", label: `Experience: ${experienceLevel}` } : null,
    companySize !== "any" ? { key: "size", label: `Size: ${companySize}` } : null,
    industries.size > 0 ? { key: "industry", label: `Industry: ${industries.size}` } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  function removeChip(key: string) {
    if (key === "query") {
      setSearchInput("");
      setQuery("");
    } else if (key === "match") setMatchScore("any");
    else if (key === "date") setDateWindow("any");
    else if (key === "source") setSources(new Set());
    else if (key === "jobType") setJobTypes(new Set());
    else if (key === "location") {
      setLocationMode("any");
      setLocationQuery("");
    } else if (key === "exp") setExperienceLevel("any");
    else if (key === "size") setCompanySize("any");
    else if (key === "industry") setIndustries(new Set());
  }

  const matchBreakdown = [
    { label: "Skills", score: 87, color: "#1A73E8", detail: "React, Node.js, Python +12 more" },
    { label: "Experience", score: 92, color: "#1E8E3E", detail: "5 years matches senior roles" },
    { label: "Location", score: 100, color: "#F9AB00", detail: "Remote preferred" },
    { label: "Salary", score: 78, color: "#1A73E8", detail: "$120K-$180K range" },
    { label: "Industry", score: 85, color: "#1E8E3E", detail: "Tech, SaaS, FinTech" },
  ];
  const overallMatch = Math.round(matchBreakdown.reduce((acc, item) => acc + item.score, 0) / matchBreakdown.length);
  const ringRadius = 34;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (overallMatch / 100) * ringCircumference;

  return (
    <section id="recommended-jobs" className="scroll-mt-28 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 wg-section-fade" style={{ animationDelay: "0ms" }}>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8E8E93]">Job board</p>
          <h2 className="mt-1 text-[18px] font-semibold text-[#2C2C2E] sm:text-[18px]">
            {feedKind === "live" ? "Browse live ATS listings" : "Sample roles (run ingest for live data)"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-normal leading-relaxed text-[#3A3A3C]">{hint}</p>
        </div>
        <span
          className={`rounded-[20px] px-3 py-1 text-xs font-medium uppercase tracking-wide ring-1 ${
            feedKind === "live"
              ? "border-0 bg-[#E8F0FE] text-[#1557B0] ring-[#DADCE0]"
              : "border-[#DADCE0] bg-[#FEF7E0] text-[#5F6368] ring-[#DADCE0]"
          }`}
        >
          {feedKind === "live" ? "Live Postgres feed" : "Demo preview"}
        </span>
      </div>

      {feedKind === "demo" && feedDemoHint ? (
        <div className="flex gap-3 rounded-xl border border-[#DADCE0] bg-[#FEF7E0] p-4 text-sm text-[#3A3A3C] ring-1 ring-[#DADCE0] wg-section-fade" style={{ animationDelay: "100ms" }}>
          <span className="mt-0.5 shrink-0 text-amber-700">
            <LifeBuoy className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 space-y-2">
            <p className="font-semibold leading-snug text-amber-950">{demoBannerCopy(feedDemoHint).title}</p>
            <p className="leading-relaxed text-amber-900/95">{demoBannerCopy(feedDemoHint).body}</p>
            <p className="text-xs text-amber-800/90">
              <Link
                href="/api/jobs-health"
                className="font-medium underline decoration-[#F9AB00] underline-offset-2 hover:text-[#1D1D1F]"
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

      <section className="rounded-xl border border-[#DADCE0] bg-white px-6 py-5 lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#1D1D1F]">Your Match Profile</h3>
            <p className="mt-1 text-[13px] text-[#8E8E93]">Based on your profile, we match jobs by:</p>
          </div>
          <button
            type="button"
            onClick={() => setIsMatchProfileExpanded((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#DADCE0] text-[#5F6368]"
            aria-label={isMatchProfileExpanded ? "Collapse profile analysis" : "Expand profile analysis"}
          >
            {isMatchProfileExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {isMatchProfileExpanded ? (
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-1 flex-col gap-2 md:flex-row md:flex-wrap">
              {matchBreakdown.map((item) => (
                <article key={item.label} className="w-full rounded-[20px] border border-[#DADCE0] bg-[#F8F9FA] px-4 py-3 md:w-[calc(50%-8px)] lg:w-[calc(33.333%-8px)] xl:w-[calc(20%-8px)]">
                  <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-[#E8F0FE]">
                    <div className="h-full rounded-full" style={{ width: `${item.score}%`, backgroundColor: item.color }} />
                  </div>
                  <p className="text-sm font-semibold text-[#1D1D1F]">
                    {item.label} <span className="text-[#5F6368]">{item.score}%</span>
                  </p>
                  <p className="mt-1 text-xs text-[#8E8E93]">{item.detail}</p>
                </article>
              ))}
            </div>

            <div className="flex shrink-0 flex-col items-center justify-center rounded-xl border border-[#DADCE0] bg-white px-5 py-4">
              <div className="relative h-20 w-20">
                <svg viewBox="0 0 80 80" className="-rotate-90">
                  <circle cx="40" cy="40" r={ringRadius} fill="none" stroke="#E8F0FE" strokeWidth="8" />
                  <circle
                    cx="40"
                    cy="40"
                    r={ringRadius}
                    fill="none"
                    stroke="#1A73E8"
                    strokeWidth="8"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[20px] font-bold text-[#1A73E8]">{overallMatch}%</div>
              </div>
              <p className="mt-1 text-[11px] text-[#8E8E93]">Match Score</p>
              <Link href="/create-profile" className="mt-2 text-[13px] font-medium text-[#1A73E8] hover:underline">
                Update profile to improve matches
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      {jobs.length > 0 ? (
        <>
          <Box sx={{ display: { md: "none" } }}>
            <Button
              onClick={() => setIsMobileFiltersOpen(true)}
              variant="outlined"
              startIcon={<SlidersHorizontal size={16} />}
              sx={{ borderRadius: "20px", textTransform: "none" }}
              aria-label="Open filters panel"
            >
              Filters
              {activeFilterCount > 0 ? (
                <Chip
                  label={activeFilterCount}
                  size="small"
                  sx={{ ml: 1, bgcolor: "primary.main", color: "primary.contrastText", height: 20 }}
                />
              ) : null}
            </Button>
          </Box>

          <section className="sticky top-[68px] z-[100] hidden border-b border-[#DADCE0] bg-[rgba(255,255,255,0.95)] py-3 backdrop-blur-[8px] md:block">
            <div className="wg-no-scrollbar flex items-center gap-2 overflow-x-auto">
              <div className="relative w-full min-w-[280px] md:w-[280px] md:min-w-[280px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8E93]" aria-hidden />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search job titles, companies..."
                  className="h-10 w-full rounded-[20px] border border-[#DADCE0] bg-white py-2 pl-11 pr-9 text-sm text-[#3A3A3C] placeholder:text-[#8E8E93] outline-none transition focus:border-[#1A73E8] focus:shadow-[0_0_0_3px_#E8F0FE]"
                />
                {searchInput ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setQuery("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
                {isSearching ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#8E8E93]" /> : null}
              </div>
              {query.trim() && !isSearching && filtered.length === 0 ? (
                <p className="ml-2 text-xs text-[#8E8E93]">No results for "{query.trim()}".</p>
              ) : null}

              <details data-filter-dropdown="true" className="group relative shrink-0">
                <summary className={`${matchScore !== "any" ? FILTER_TRIGGER_ACTIVE_CLASS : FILTER_TRIGGER_INACTIVE_CLASS} font-medium`}>
                  Match Score <ChevronDown className="h-4 w-4" />
                </summary>
                <div data-filter-menu="true" className="absolute left-0 top-11 z-20 w-44 rounded-xl border border-[#DADCE0] bg-white p-2 shadow-lg">
                  {[
                    { id: "any", label: "Any match" },
                    { id: "90", label: "90%+ (Excellent)" },
                    { id: "75", label: "75%+ (Good)" },
                    { id: "60", label: "60%+ (Fair)" },
                  ].map((o) => (
                    <button key={o.id} type="button" onClick={() => setMatchScore(o.id as "any" | "90" | "75" | "60")} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-[#F8F9FA]">
                      {o.label}
                      {matchScore === o.id ? <Check className="h-4 w-4 text-[#1A73E8]" /> : null}
                    </button>
                  ))}
                </div>
              </details>

              <details data-filter-dropdown="true" className="relative shrink-0">
                <summary className={FILTER_TRIGGER_INACTIVE_CLASS}>
                  {jobTypes.size > 0 ? `Job Type · ${jobTypes.size}` : "Job Type"} <ChevronDown className="h-4 w-4" />
                </summary>
                <div data-filter-menu="true" className="absolute left-0 top-11 z-20 w-52 rounded-xl border border-[#DADCE0] bg-white p-2 shadow-lg">
                  {["Full-time", "Part-time", "Contract", "Freelance", "Internship", "Temporary"].map((type) => (
                    <label key={type} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[#F8F9FA]">
                      <input
                        type="checkbox"
                        checked={jobTypes.has(type)}
                        onChange={() =>
                          setJobTypes((prev) => {
                            const next = new Set(prev);
                            if (next.has(type)) next.delete(type);
                            else next.add(type);
                            return next;
                          })
                        }
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </details>

              <details data-filter-dropdown="true" className="relative shrink-0">
                <summary className={FILTER_TRIGGER_INACTIVE_CLASS}>
                  <MapPin className="h-4 w-4" /> Location <ChevronDown className="h-4 w-4" />
                </summary>
                <div data-filter-menu="true" className="absolute left-0 top-11 z-20 w-64 rounded-xl border border-[#DADCE0] bg-white p-3 shadow-lg">
                  <input value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} placeholder="Country or city" className="mb-2 h-9 w-full rounded-lg border border-[#DADCE0] px-3 text-sm" />
                  <div className="flex flex-wrap gap-2">
                    {["remote", "hybrid", "onsite"].map((loc) => (
                      <button key={loc} type="button" onClick={() => setLocationMode(loc as "remote" | "hybrid" | "onsite")} className={`rounded-[16px] px-3 py-1 text-xs ${locationMode === loc ? "bg-[#1A73E8] text-white" : "bg-[#F8F9FA] text-[#3A3A3C]"}`}>
                        {loc === "onsite" ? "On-site" : loc[0].toUpperCase() + loc.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-[#8E8E93]">Popular: Remote, New York, London, San Francisco</p>
                </div>
              </details>

              {[
                { label: "Experience", value: experienceLevel, set: setExperienceLevel, opts: ["Entry (0-2yr)", "Mid (2-5yr)", "Senior (5-8yr)", "Lead (8-12yr)", "Executive (12yr+)"] },
                { label: "Date Posted", value: dateWindow, set: setDateWindow, opts: ["Any time", "Past 24h", "Past week", "Past month"] },
                { label: "Company Size", value: companySize, set: setCompanySize, opts: ["Startup (1-50)", "Small (51-200)", "Medium (201-1000)", "Large (1000+)", "Enterprise (10K+)"] },
              ].map((item) => (
                <details data-filter-dropdown="true" key={item.label} className="relative shrink-0">
                  <summary className={FILTER_TRIGGER_INACTIVE_CLASS}>
                    {item.label} <ChevronDown className="h-4 w-4" />
                  </summary>
                  <div data-filter-menu="true" className="absolute left-0 top-11 z-20 w-56 rounded-xl border border-[#DADCE0] bg-white p-2 shadow-lg">
                    {item.opts.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          item.set(
                            (item.label === "Date Posted"
                              ? (opt === "Any time" ? "any" : opt === "Past 24h" ? "1" : opt === "Past week" ? "7" : "30")
                              : opt) as never
                          )
                        }
                        className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-[#F8F9FA]"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </details>
              ))}

              <details data-filter-dropdown="true" className="relative shrink-0">
                <summary className={FILTER_TRIGGER_INACTIVE_CLASS}>
                  Salary <ChevronDown className="h-4 w-4" />
                </summary>
                <div data-filter-menu="true" className="absolute left-0 top-11 z-20 w-72 rounded-xl border border-[#DADCE0] bg-white p-3 shadow-lg">
                  <div className="mb-2 flex gap-2">
                    <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(Number(e.target.value || 0))} className="h-9 w-full rounded-lg border border-[#DADCE0] px-2 text-sm" />
                    <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(Number(e.target.value || 500))} className="h-9 w-full rounded-lg border border-[#DADCE0] px-2 text-sm" />
                  </div>
                  <input type="range" min={0} max={500} value={salaryMin} onChange={(e) => setSalaryMin(Number(e.target.value))} className="w-full" />
                  <input type="range" min={0} max={500} value={salaryMax} onChange={(e) => setSalaryMax(Number(e.target.value))} className="w-full" />
                  <div className="mt-2 flex items-center gap-2">
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-8 rounded-lg border border-[#DADCE0] px-2 text-xs">
                      <option>USD</option><option>EUR</option><option>GBP</option><option>INR</option>
                    </select>
                    <button type="button" onClick={() => setSalaryPeriod("year")} className={`rounded-md px-2 py-1 text-xs ${salaryPeriod === "year" ? "bg-[#1A73E8] text-white" : "bg-[#F8F9FA]"}`}>Per year</button>
                    <button type="button" onClick={() => setSalaryPeriod("hour")} className={`rounded-md px-2 py-1 text-xs ${salaryPeriod === "hour" ? "bg-[#1A73E8] text-white" : "bg-[#F8F9FA]"}`}>Per hour</button>
                  </div>
                </div>
              </details>

              <details data-filter-dropdown="true" className="relative shrink-0">
                <summary className={FILTER_TRIGGER_INACTIVE_CLASS}>
                  Industry {industries.size > 0 ? `· ${industries.size}` : ""} <ChevronDown className="h-4 w-4" />
                </summary>
                <div data-filter-menu="true" className="absolute left-0 top-11 z-20 w-64 rounded-xl border border-[#DADCE0] bg-white p-3 shadow-lg">
                  <input placeholder="Search industry..." className="mb-2 h-9 w-full rounded-lg border border-[#DADCE0] px-3 text-sm" />
                  {["Technology", "Finance", "Healthcare", "Marketing", "Design", "Legal", "Education", "Retail"].map((ind) => (
                    <label key={ind} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[#F8F9FA]">
                      <input
                        type="checkbox"
                        checked={industries.has(ind)}
                        onChange={() => setIndustries((prev) => {
                          const next = new Set(prev);
                          if (next.has(ind)) next.delete(ind);
                          else next.add(ind);
                          return next;
                        })}
                      />
                      {ind}
                    </label>
                  ))}
                </div>
              </details>

              <details data-filter-dropdown="true" className="relative shrink-0">
                <summary className={FILTER_TRIGGER_INACTIVE_CLASS}>
                  Source {sources.size > 0 ? `· ${sources.size}` : ""} <ChevronDown className="h-4 w-4" />
                </summary>
                <div data-filter-menu="true" className="absolute left-0 top-11 z-20 w-60 rounded-xl border border-[#DADCE0] bg-white p-3 shadow-lg">
                  {platformsInFeed.map((src) => (
                    <label key={src} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[#F8F9FA]">
                      <input type="checkbox" checked={sources.has(src)} onChange={() => togglePlatform(src)} />
                      {SOURCE_STYLES[src].label}
                    </label>
                  ))}
                </div>
              </details>

              <button type="button" onClick={() => setIsMoreFiltersOpen(true)} className={`${FILTER_TRIGGER_INACTIVE_CLASS} shrink-0`}>
                <SlidersHorizontal className="h-4 w-4" /> More Filters
              </button>
            </div>
          </section>

          {hasActiveFilters ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#8E8E93]">Active filters:</span>
              {activeFilterChips.map((chip) => (
                <span key={chip.key} className="inline-flex items-center gap-1 rounded-2xl bg-[#E8F0FE] px-2 py-1 pl-3 text-xs text-[#1A73E8] transition-all duration-200 wg-chip-enter">
                  {chip.label}
                  <button type="button" onClick={() => removeChip(chip.key)} className="text-[#1A73E8] hover:text-[#1557B0]">
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ))}
              <button type="button" onClick={clearFilters} className="ml-1 text-sm font-medium text-[#D93025]">
                Clear all filters
              </button>
            </div>
          ) : null}

          <p className="mt-3 text-sm text-[#3A3A3C]" aria-live="polite">
            Showing <span className="font-semibold text-[#1A73E8]">{filtered.length.toLocaleString()} matched jobs</span> out of{" "}
            <span className="text-[#8E8E93]">{jobs.length.toLocaleString()} total</span>
          </p>
          <p className="sr-only" aria-live="polite">
            {activeFilterCount === 0 ? "No active filters." : `${activeFilterCount} active filters applied.`}
          </p>
        </>
      ) : null}

      <Drawer
        anchor="bottom"
        open={isMobileFiltersOpen}
        onClose={() => setIsMobileFiltersOpen(false)}
        sx={{ display: { md: "none" } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Filters</Typography>
            <Button onClick={() => setIsMobileFiltersOpen(false)} size="small">Close</Button>
          </Box>
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField
              size="small"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search job titles, companies..."
              fullWidth
            />
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 1 }}>
              {DATE_OPTIONS.map((d) => (
                <Button
                  key={d.id}
                  variant={dateWindow === d.id ? "contained" : "outlined"}
                  onClick={() => setDateWindow(d.id)}
                  sx={{ textTransform: "none", borderRadius: "16px" }}
                >
                  {d.label}
                </Button>
              ))}
            </Box>
            <Button
              variant="outlined"
              onClick={() => {
                clearFilters();
                setIsMobileFiltersOpen(false);
              }}
            >
              Clear all filters
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={isMoreFiltersOpen}
        onClose={() => setIsMoreFiltersOpen(false)}
      >
        <Box sx={{ p: 3, width: { xs: "100vw", sm: 420 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">Advanced Filters</Typography>
            <Button onClick={() => setIsMoreFiltersOpen(false)}>Close</Button>
          </Box>
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField size="small" label="Skills required" placeholder="Type skill..." fullWidth />
            <TextField size="small" label="Company" placeholder="Search company..." fullWidth />
            <Box>
              <Typography variant="caption" color="text.secondary">Benefits</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                {["Health", "401k", "Equity", "Remote-first"].map((b) => (
                  <Chip key={b} label={b} variant="outlined" />
                ))}
              </Box>
            </Box>
            <FormControlLabel control={<Checkbox />} label="Visa sponsorship" />
            <FormControlLabel control={<Checkbox />} label="Easy Apply" />
          </Box>
        </Box>
      </Drawer>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="min-w-0">
      {jobs.length > 0 ? (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
          <ToggleButtonGroup
            exclusive
            value={viewMode}
            onChange={(_, next) => {
              if (next) setViewMode(next);
            }}
            size="small"
            aria-label="Choose jobs list view"
          >
            <ToggleButton value="list" aria-label="List view"><LayoutList size={16} /></ToggleButton>
            <ToggleButton value="grid" aria-label="Grid view"><LayoutGrid size={16} /></ToggleButton>
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="jobs-sort-label">Sort</InputLabel>
            <Select
              labelId="jobs-sort-label"
              label="Sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <MenuItem value="best">Best Match</MenuItem>
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="salary_desc">Salary: High to Low</MenuItem>
              <MenuItem value="salary_asc">Salary: Low to High</MenuItem>
              <MenuItem value="company_asc">Company Name A-Z</MenuItem>
            </Select>
          </FormControl>
        </Box>
      ) : null}

      {showSkeleton ? (
        <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
          {Array.from({ length: skeletonCount }).map((_, idx) => (
            <article key={`skeleton-${idx}`} className="rounded-xl border border-[#DADCE0] bg-white p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="h-12 w-12 rounded-lg wg-skeleton-shimmer" />
                  <div className="space-y-2">
                    <div className="h-4 w-48 rounded wg-skeleton-shimmer" />
                    <div className="h-3 w-32 rounded wg-skeleton-shimmer" />
                    <div className="h-3 w-40 rounded wg-skeleton-shimmer" />
                  </div>
                </div>
                <div className="h-6 w-20 rounded-2xl wg-skeleton-shimmer" />
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                <div className="h-6 w-28 rounded-xl wg-skeleton-shimmer" />
                <div className="h-6 w-24 rounded-xl wg-skeleton-shimmer" />
                <div className="h-6 w-24 rounded-xl wg-skeleton-shimmer" />
              </div>
              <div className="mb-3 flex gap-2">
                <div className="h-5 w-16 rounded-xl wg-skeleton-shimmer" />
                <div className="h-5 w-16 rounded-xl wg-skeleton-shimmer" />
                <div className="h-5 w-20 rounded-xl wg-skeleton-shimmer" />
              </div>
              <div className="h-9 w-36 rounded-[18px] wg-skeleton-shimmer" />
            </article>
          ))}
        </div>
      ) : (
      <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
        {shouldVirtualize ? null : visibleJobs.map((job, i) => {
          const src = SOURCE_STYLES[job.source];
          const applyHref = job.applyUrl?.trim();
          const canApply = Boolean(applyHref);
          const [salaryMinK, salaryMaxK] = getSalaryBand(job);
          const score = getMatchScore(job, skillHints);
          const isSaved = savedJobs.has(job.id);
          const isNew = (new Date().getTime() - new Date(job.postedAtIso || 0).getTime()) < 86400000;
          const isFresh = (new Date().getTime() - new Date(job.postedAtIso || 0).getTime()) < 86400000 * 3;
          const isExpanded = expandedJobId === job.id;
          const reqs = [
            { label: "React", status: "ok" },
            { label: "Node.js", status: "ok" },
            { label: "AWS", status: "warn" },
            { label: "Docker", status: "miss" },
          ] as const;
          const MatchIcon = score >= 90 ? Target : score >= 75 ? BadgeCheck : Zap;
          const matchBadge =
            score >= 90
              ? { bg: "#E6F4EA", fg: "#1E8E3E", label: `${score}% Match` }
              : score >= 75
                ? { bg: "#E8F0FE", fg: "#1A73E8", label: `${score}% Match` }
                : score >= 60
                  ? { bg: "#FEF7E0", fg: "#F9AB00", label: `${score}% Match` }
                  : { bg: "#F8F9FA", fg: "#8E8E93", label: `${score}% Match` };

          return (
            <Card
              key={job.id}
              style={{ animationDelay: `${50 * i}ms` }}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileDetailJobId(job.id);
                } else {
                  setExpandedJobId((prev) => (prev === job.id ? null : job.id));
                }
              }}
              className={`group relative cursor-pointer rounded-xl border border-[#DADCE0] bg-[#FFFFFF] p-5 transition-all duration-200 ease-in hover:border-[#1A73E8] hover:shadow-[0_4px_16px_rgba(26,115,232,0.12)] wg-job-card-enter ${viewMode === "grid" ? "flex min-h-[320px] flex-col" : ""}`}
              component="article"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div
                    className={`${viewMode === "grid" ? "h-10 w-10" : "h-12 w-12"} relative shrink-0 overflow-hidden rounded-lg border border-[#DADCE0] bg-gradient-to-br from-[#E8F0FE] to-[#F8F9FA]`}
                    aria-label={`${job.company} logo placeholder`}
                  >
                    <Building2 className="absolute left-1.5 top-1.5 h-3.5 w-3.5 text-[#5F6368]" aria-hidden />
                    <span className="absolute bottom-1 right-1 text-[10px] font-semibold tracking-wide text-[#3A3A3C]">
                      {companyInitials(job.company)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[#1D1D1F] transition-colors group-hover:text-[#1A73E8]">{job.title}</h3>
                    <p className="mt-1 text-sm font-medium text-[#3A3A3C]">{job.company}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-[13px] text-[#8E8E93]">
                      <MapPin className="h-3 w-3" /> {job.location} · {getJobType(job)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="group/score relative inline-flex items-center rounded-2xl px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: matchBadge.bg, color: matchBadge.fg }}>
                    <MatchIcon className="mr-1 inline h-3.5 w-3.5" />
                    {matchBadge.label}
                    <span className="pointer-events-none absolute right-0 top-full z-20 mt-1 hidden w-48 rounded-lg border border-[#DADCE0] bg-white px-2 py-1 text-[11px] font-normal text-[#3A3A3C] shadow-lg group-hover/score:block">
                      Skills 60% · Experience 20% · Location 20%
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBouncingBookmarkId(job.id);
                      window.setTimeout(() => setBouncingBookmarkId(null), 250);
                      setSavedJobs((prev) => {
                        const next = new Set(prev);
                        if (next.has(job.id)) next.delete(job.id);
                        else next.add(job.id);
                        return next;
                      });
                    }}
                    title="Save job"
                    className={`rounded-md p-1 text-[#8E8E93] transition hover:bg-[#E8F0FE] hover:text-[#1A73E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-1 ${bouncingBookmarkId === job.id ? "wg-bookmark-bounce" : ""}`}
                  >
                    {isSaved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-xl border border-[#DADCE0] bg-[#F8F9FA] px-2.5 py-1 text-xs text-[#3A3A3C]"><Banknote className="h-3.5 w-3.5" /> ${salaryMinK}K - ${salaryMaxK}K</span>
                <span className="inline-flex items-center gap-1 rounded-xl border border-[#DADCE0] bg-[#F8F9FA] px-2.5 py-1 text-xs text-[#3A3A3C]"><GraduationCap className="h-3.5 w-3.5" /> {getExperience(job)}</span>
                <span className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs ${isFresh ? "border-[#E6F4EA] bg-[#E6F4EA] text-[#1E8E3E]" : "border-[#DADCE0] bg-[#F8F9FA] text-[#8E8E93]"}`}><CalendarDays className="h-3.5 w-3.5" /> {job.postedAgo}</span>
                <span className="rounded-xl bg-[#F0F4FF] px-2.5 py-1 text-xs text-[#1A73E8]">via {src.label}</span>
                {canApply ? <span className="inline-flex items-center gap-1 rounded-xl bg-[#E6F4EA] px-2.5 py-1 text-xs text-[#1E8E3E]"><ArrowUpRight className="h-3.5 w-3.5" /> Easy Apply</span> : null}
                {isNew ? <span className="inline-flex items-center gap-1 rounded-xl bg-[#FCE8E6] px-2.5 py-1 text-xs text-[#D93025] wg-new-badge-pulse"><Sparkles className="h-3.5 w-3.5" /> New</span> : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {job.matchedSkills.slice(0, 3).map((s) => (
                    <span key={s} className="rounded-xl bg-[#E8F0FE] px-2.5 py-0.5 text-xs text-[#1A73E8]">{s}</span>
                  ))}
                  {job.matchedSkills.length > 3 ? <span className="rounded-xl bg-[#E8F0FE] px-2.5 py-0.5 text-xs text-[#1A73E8]">+{job.matchedSkills.length - 3} more</span> : null}
                  <span className="rounded-xl bg-[#FEF7E0] px-2.5 py-0.5 text-xs text-[#F9AB00]">Missing: AWS, Docker</span>
                </div>
                <div className="flex items-center gap-2">
                  {canApply ? (
                    <a
                      href={applyHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[18px] bg-[#1A73E8] px-5 text-sm font-medium text-white transition hover:scale-[1.02] hover:bg-[#1557B0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2"
                    >
                      <Zap className="h-4 w-4" />
                      Quick Apply
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedJobId((prev) => (prev === job.id ? null : job.id));
                    }}
                    className="text-sm font-medium text-[#1A73E8] opacity-0 transition group-hover:opacity-100"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <div className="mt-4 space-y-3 border-t border-[#DADCE0] pt-4">
                  <div className="max-h-[200px] overflow-auto text-sm leading-6 text-[#3A3A3C]">
                    {job.matchLabel}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere, sem vitae bibendum luctus, risus justo ultricies lorem, vitae aliquet dui nunc id mi. Curabitur luctus mi in sem feugiat varius.
                  </div>
                  <ul className="space-y-1 text-sm">
                    {reqs.map((r) => (
                      <li key={r.label} className="flex items-center gap-2">
                        {r.status === "ok" ? (
                          <Check className="h-4 w-4 text-[#1E8E3E]" />
                        ) : r.status === "warn" ? (
                          <TriangleAlert className="h-4 w-4 text-[#F9AB00]" />
                        ) : (
                          <X className="h-4 w-4 text-[#D93025]" />
                        )}
                        <span className="text-[#3A3A3C]">{r.label}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#8E8E93]">
                    <span>Company size: 201-1000</span>
                    <span>Industry: SaaS</span>
                    <span>Founded: 2017</span>
                    <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-[#F9AB00]" /> 4.2</span>
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-[#1A73E8]">View company</a>
                  </div>
                  {canApply ? (
                    <a
                      href={applyHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1A73E8] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1557B0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Apply Now
                    </a>
                  ) : null}
                </div>
              ) : null}

              {viewMode === "grid" ? (
                <div className="mt-auto pt-4">
                  <div className="mb-3 border-t border-[#DADCE0]" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8E8E93]">Posted {job.postedAgo}</span>
                    {canApply ? (
                      <a href={applyHref} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 rounded-[18px] bg-[#1A73E8] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#1557B0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Apply
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </Card>
          );
        })
        }
      </div>
      )}

      {sortedJobs.length > visible ? (
        <div className="space-y-3">
          <p className="text-[13px] text-[#8E8E93]">
            Showing {rangeStart}-{rangeEnd} of {totalMatched.toLocaleString()} matched jobs
          </p>
          <button
            type="button"
            onClick={loadMoreJobs}
            disabled={isLoadingMore}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#DADCE0] bg-white px-5 py-3 text-sm font-medium text-[#1A73E8] transition hover:bg-[#F8F9FA] disabled:cursor-wait disabled:opacity-70"
          >
            {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isLoadingMore ? "Loading..." : `Load ${Math.min(PAGE_SIZE, sortedJobs.length - visible)} more jobs`}
          </button>
          <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
            <input
              id="auto-load-jobs"
              type="checkbox"
              checked={autoLoadEnabled}
              onChange={(e) => setAutoLoadEnabled(e.target.checked)}
            />
            <label htmlFor="auto-load-jobs">Auto-load more when nearing end</label>
          </div>
          <div ref={autoLoadRef} aria-hidden className="h-1 w-full" />
        </div>
      ) : null}

      {sortedJobs.length <= visible && sortedJobs.length > 0 ? (
        <p className="text-[13px] text-[#8E8E93]">
          Showing {rangeStart}-{rangeEnd} of {totalMatched.toLocaleString()} matched jobs
        </p>
      ) : null}

      {!showSkeleton && filtered.length === 0 && jobs.length > 0 && skillHints.length > 0 ? (
        <div className="rounded-xl border border-[#DADCE0] bg-white px-6 py-10 text-center">
          <SearchX className="mx-auto h-20 w-20 text-[#DADCE0]" />
          <h3 className="mt-4 text-[20px] font-semibold text-[#1D1D1F]">No jobs found</h3>
          <p className="mt-2 text-sm text-[#8E8E93]">Try adjusting your filters or search terms</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 items-center rounded-[20px] border border-[#1A73E8] px-5 text-sm font-medium text-[#1A73E8]"
            >
              Clear all filters
            </button>
            <button
              type="button"
              onClick={() => {
                clearFilters();
                setVisible(PAGE_SIZE);
              }}
              className="text-sm font-medium text-[#1A73E8] underline underline-offset-2"
            >
              Browse all jobs
            </button>
          </div>
        </div>
      ) : null}

      {!showSkeleton && filtered.length === 0 && jobs.length > 0 && skillHints.length === 0 ? (
        <div className="rounded-xl border border-[#DADCE0] bg-white px-6 py-10 text-center">
          <UserSearch className="mx-auto h-20 w-20 text-[#1A73E8]" />
          <h3 className="mt-4 text-[20px] font-semibold text-[#1D1D1F]">Complete your profile to see matches</h3>
          <div className="mx-auto mt-3 max-w-xs">
            <div className="mb-1 flex items-center justify-between text-xs text-[#8E8E93]">
              <span>Profile progress</span>
              <span>78% complete</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#E8F0FE]">
              <div className="h-full w-[78%] bg-[#1A73E8]" />
            </div>
          </div>
          <div className="mx-auto mt-4 flex max-w-sm flex-col items-start gap-2 text-sm">
            <Link href="/create-profile#skills" className="inline-flex items-center gap-1 text-[#1A73E8]">Add your skills <ArrowRight className="h-3.5 w-3.5" /></Link>
            <Link href="/create-profile#salary" className="inline-flex items-center gap-1 text-[#1A73E8]">Add expected salary <ArrowRight className="h-3.5 w-3.5" /></Link>
            <Link href="/create-profile#location" className="inline-flex items-center gap-1 text-[#1A73E8]">Add location preference <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <Link
            href="/create-profile"
            className="mt-5 inline-flex h-10 items-center rounded-[20px] bg-[#1A73E8] px-5 text-sm font-medium text-white hover:bg-[#1557B0]"
          >
            Complete Profile
          </Link>
        </div>
      ) : null}
      </div>

      <aside className="hidden space-y-4 lg:sticky lg:top-[132px] lg:block">
        <section className="rounded-xl border border-[#DADCE0] bg-white px-4 py-4">
          <h3 className="text-base font-semibold text-[#1D1D1F]">Your Match Profile</h3>
          <p className="mt-1 text-xs text-[#8E8E93]">Based on your profile and preferences</p>
          <div className="mt-3 space-y-2">
            {matchBreakdown.map((item) => (
              <div key={`side-${item.label}`}>
                <div className="mb-1 flex items-center justify-between text-xs text-[#3A3A3C]">
                  <span>{item.label}</span>
                  <span>{item.score}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#E8F0FE]">
                  <div className="h-full rounded-full" style={{ width: `${item.score}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-[#DADCE0] bg-white px-4 py-4">
          <h3 className="text-sm font-semibold text-[#1D1D1F]">Job Alerts</h3>
          <p className="mt-1 text-xs text-[#8E8E93]">Active Alerts</p>
          <div className="mt-3 space-y-2 text-xs">
            <div className="rounded-lg bg-[#F8F9FA] px-3 py-2 text-[#3A3A3C]">Senior React Engineer - Daily digest</div>
            <div className="rounded-lg bg-[#F8F9FA] px-3 py-2 text-[#3A3A3C]">Remote TypeScript Roles - Weekly</div>
          </div>
        </section>
      </aside>
      </div>

      <p className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-center text-xs leading-relaxed text-slate-600">
        Ingest jobs with{" "}
        <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] text-slate-800">job_aggregator</code> using the
        same <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">DATABASE_URL</code> as Supabase.{" "}
        <Link
          href="/create-profile"
          className="font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          Refresh resume
        </Link>{" "}
        to tune keyword overlap ranking.
      </p>

      {mobileDetailJobId ? (
        <div className="fixed inset-0 z-[125] bg-white p-4 md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#1D1D1F]">Job Details</h3>
            <button type="button" onClick={() => setMobileDetailJobId(null)}>
              <X className="h-5 w-5 text-[#5F6368]" />
            </button>
          </div>
          {(() => {
            const job = jobs.find((j) => j.id === mobileDetailJobId);
            if (!job) return <p className="text-sm text-[#8E8E93]">Job not available.</p>;
            return (
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-[#1D1D1F]">{job.title}</h4>
                <p className="text-sm text-[#3A3A3C]">{job.company}</p>
                <p className="text-sm text-[#8E8E93]">{job.location}</p>
                <p className="max-h-[45vh] overflow-auto text-sm leading-6 text-[#3A3A3C]">
                  {job.matchLabel}. This full-screen mobile sheet lets candidates read role details without leaving the list flow.
                </p>
                {job.applyUrl ? (
                  <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1A73E8] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1557B0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2">
                    <ExternalLink className="h-4 w-4" />
                    Apply Now
                  </a>
                ) : null}
              </div>
            );
          })()}
        </div>
      ) : null}

      {showScrollTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-[110] inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#DADCE0] bg-white text-[#5F6368] transition hover:bg-[#F8F9FA] hover:shadow-md"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      ) : null}
    </section>
  );
}
