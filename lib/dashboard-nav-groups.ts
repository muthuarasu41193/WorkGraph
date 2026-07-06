import type { LucideIcon } from "lucide-react";
import {
  Brain,
  Briefcase,
  ClipboardList,
  EyeOff,
  FileText,
  Home,
  LayoutDashboard,
  Radar,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import type { DashboardRouteId } from "@/lib/dashboard-routes";

export type NavItem = {
  id: DashboardRouteId | "interview-vault" | "settings";
  label: string;
  icon: LucideIcon;
  href?: string;
  description?: string;
  /** Second key after `g` for go-to navigation (e.g. `g` then `h`) */
  shortcut?: string;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export const DASHBOARD_NAV_GROUPS: NavGroup[] = [
  {
    id: "main",
    label: "",
    items: [
      {
        id: "home",
        label: "Dashboard",
        icon: LayoutDashboard,
        description: "Career intelligence overview",
        shortcut: "h",
      },
    ],
  },
  {
    id: "jobs",
    label: "Jobs",
    items: [
      {
        id: "jobs",
        label: "Job Discovery",
        icon: Briefcase,
        description: "Browse matched job listings",
        shortcut: "j",
      },
      {
        id: "job-discovery",
        label: "Hidden Jobs",
        icon: Radar,
        description: "Discover roles outside traditional job boards",
        shortcut: "d",
      },
      {
        id: "hidden-jobs",
        label: "Saved Jobs",
        icon: EyeOff,
        description: "Roles you saved or dismissed",
        shortcut: "s",
      },
    ],
  },
  {
    id: "intelligence",
    label: "Career Intelligence",
    items: [
      {
        id: "resume-intelligence",
        label: "Resume Intelligence",
        icon: Brain,
        description: "AI-powered resume analysis",
        shortcut: "r",
      },
      {
        id: "applications",
        label: "Application Intelligence",
        icon: ClipboardList,
        description: "Track and optimize applications",
        shortcut: "a",
      },
      {
        id: "workgraph-direct",
        label: "Career Intelligence",
        icon: Sparkles,
        description: "AI insights for smarter career decisions",
        shortcut: "i",
      },
      {
        id: "interview-vault",
        label: "Interview Vault",
        icon: Home,
        href: "/interview-vault",
        description: "Interview experiences marketplace",
        shortcut: "v",
      },
      {
        id: "vault",
        label: "Prep Vault",
        icon: FileText,
        description: "Local interview prep notes",
        shortcut: "p",
      },
    ],
  },
  {
    id: "account",
    label: "",
    items: [
      {
        id: "profile",
        label: "Profile",
        icon: User,
        description: "Skills, experience, and resume",
        shortcut: "u",
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        description: "Account and preferences",
        shortcut: ",",
      },
    ],
  },
];

export function isNavRouteId(id: string): id is DashboardRouteId {
  return id !== "interview-vault" && id !== "settings" || id === "settings";
}

/** Flat lookup for `g` chord shortcuts */
export const NAV_SHORTCUTS: Record<
  string,
  { id: string; href?: string }
> = Object.fromEntries(
  DASHBOARD_NAV_GROUPS.flatMap((group) =>
    group.items
      .filter((item) => item.shortcut)
      .map((item) => [item.shortcut!, { id: item.id, href: item.href }]),
  ),
);
