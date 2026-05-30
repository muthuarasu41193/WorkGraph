import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  EyeOff,
  FileText,
  Home,
  Newspaper,
  User,
} from "lucide-react";

/** Dashboard sections — synced to `?view=` on /profile (Next.js App Router). */
export type DashboardRouteId =
  | "home"
  | "jobs"
  | "hidden-jobs"
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
    id: "hidden-jobs",
    label: "Hidden Jobs",
    shortLabel: "Hidden",
    icon: EyeOff,
    description: "Roles you chose to hide — restore anytime",
  },
  {
    id: "vault",
    label: "Interview Vault",
    shortLabel: "Vault",
    icon: FileText,
    description: "Notes, questions, and prep for upcoming interviews",
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

export function getDashboardRoute(id: DashboardRouteId): DashboardRoute {
  return DASHBOARD_ROUTES.find((route) => route.id === id) ?? DASHBOARD_ROUTES[0];
}

export function dashboardHref(id: DashboardRouteId, pathname = "/profile"): string {
  if (id === DEFAULT_DASHBOARD_ROUTE) return pathname;
  return `${pathname}?view=${id}`;
}
