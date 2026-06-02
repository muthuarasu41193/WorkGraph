import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  ClipboardList,
  EyeOff,
  FileText,
  Home,
  Newspaper,
  Radar,
  User,
} from "lucide-react";

/** Dashboard sections — synced to `?view=` on /profile (Next.js App Router). */
export type DashboardRouteId =
  | "home"
  | "jobs"
  | "applications"
  | "hidden-jobs"
  | "job-discovery"
  | "vault"
  | "profile"
  | "job-news";

export type DashboardRoute = {
  id: DashboardRouteId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  description: string;
};

export const DASHBOARD_ROUTES: DashboardRoute[] = [
  {
    id: "home",
    label: "Home",
    shortLabel: "Home",
    icon: Home,
    description: "Your dashboard overview and top matches",
  },
  {
    id: "jobs",
    label: "Jobs",
    shortLabel: "Jobs",
    icon: Briefcase,
    description: "Browse live job listings matched to your profile",
  },
  {
    id: "applications",
    label: "Applications",
    shortLabel: "Tracker",
    icon: ClipboardList,
    description: "Kanban pipeline for every role you have applied to",
  },
  {
    id: "job-discovery",
    label: "Hidden Jobs Discovery",
    shortLabel: "Discover",
    icon: Radar,
    description: "Hiring posts from Reddit, Hacker News, and GitHub (not ATS job boards)",
  },
  {
    id: "hidden-jobs",
    label: "Dismissed Jobs",
    shortLabel: "Dismissed",
    icon: EyeOff,
    description: "Roles you hid from your Jobs feed — restore anytime",
  },
  {
    id: "vault",
    label: "Prep Vault",
    shortLabel: "Prep",
    icon: FileText,
    description: "Local interview prep notes stored on this device",
  },
  {
    id: "profile",
    label: "Profile",
    shortLabel: "Profile",
    icon: User,
    description: "Edit skills, experience, and career details",
  },
  {
    id: "job-news",
    label: "Job News",
    shortLabel: "News",
    icon: Newspaper,
    description: "Hiring posts from Reddit, X, LinkedIn, and more",
  },
];

export const DEFAULT_DASHBOARD_ROUTE: DashboardRouteId = "home";

export function isDashboardRouteId(value: string | null | undefined): value is DashboardRouteId {
  return DASHBOARD_ROUTES.some((route) => route.id === value);
}

const JOB_LIST_LAYOUT_VALUES = new Set(["list", "grid"]);

/** Reads `?view=` for dashboard routing; ignores legacy list/grid layout values. */
export function resolveDashboardRouteFromSearchParams(
  params: Pick<URLSearchParams, "get">,
): DashboardRouteId {
  const view = params.get("view");
  if (isDashboardRouteId(view)) return view;
  if (view && JOB_LIST_LAYOUT_VALUES.has(view)) return "jobs";
  return DEFAULT_DASHBOARD_ROUTE;
}

export function resolveJobsLayoutFromSearchParams(
  params: Pick<URLSearchParams, "get">,
): "list" | "grid" {
  const layout = params.get("jobsLayout");
  if (layout === "list" || layout === "grid") return layout;
  const legacyView = params.get("view");
  if (legacyView === "list" || legacyView === "grid") return legacyView;
  return "list";
}

export function getDashboardRoute(id: DashboardRouteId): DashboardRoute {
  return DASHBOARD_ROUTES.find((route) => route.id === id) ?? DASHBOARD_ROUTES[0];
}

export function dashboardHref(id: DashboardRouteId, pathname = "/profile"): string {
  if (id === DEFAULT_DASHBOARD_ROUTE) return pathname;
  return `${pathname}?view=${id}`;
}
