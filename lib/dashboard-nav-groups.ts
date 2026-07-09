import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  Brain,
  ClipboardList,
  EyeOff,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Route,
  Search,
} from "lucide-react";
import type { DashboardRouteId } from "@/lib/dashboard-routes";

export type NavItem = {
  id: DashboardRouteId | "interview-vault" | "settings";
  label: string;
  icon: LucideIcon;
  href?: string;
  description?: string;
  /** Supportive micro-copy on hover — coach tone, not corporate */
  benefitHint?: string;
};

export type NavGroup = {
  id: string;
  label: string;
  subtitle?: string;
  items: NavItem[];
  /** Section can be toggled open/closed */
  collapsible?: boolean;
  /** Collapsed by default when profile completeness is below threshold */
  defaultCollapsedForNewUsers?: boolean;
  /** Pinned to the bottom of the sidebar */
  pinned?: boolean;
};

export const NEW_USER_PROFILE_THRESHOLD = 60;

export const DASHBOARD_NAV_GROUPS: NavGroup[] = [
  {
    id: "primary",
    label: "",
    items: [
      {
        id: "home",
        label: "Dashboard",
        icon: LayoutDashboard,
        benefitHint: "Your job search overview",
      },
      {
        id: "jobs",
        label: "Find Jobs",
        icon: Search,
        benefitHint: "Browse 19,000+ live opportunities",
      },
      {
        id: "hidden-jobs",
        label: "Saved Jobs",
        icon: Bookmark,
        benefitHint: "Jobs you're excited about",
      },
      {
        id: "job-discovery",
        label: "Unlisted Jobs",
        icon: EyeOff,
        benefitHint: "Exclusive unadvertised roles",
      },
    ],
  },
  {
    id: "intelligence",
    label: "AI Tools",
    subtitle: "AI-powered tools",
    collapsible: true,
    defaultCollapsedForNewUsers: true,
    items: [
      {
        id: "resume-intelligence",
        label: "Resume AI",
        icon: Brain,
        benefitHint: "Make your resume stand out",
      },
      {
        id: "applications",
        label: "My Applications",
        icon: ClipboardList,
        benefitHint: "Track your progress",
      },
      {
        id: "workgraph-direct",
        label: "Career Path",
        icon: Route,
        benefitHint: "See your growth trajectory",
      },
      {
        id: "interview-vault",
        label: "Interview Stories",
        icon: MessageSquare,
        href: "/interview-vault",
        benefitHint: "Learn from real interview experiences",
      },
      {
        id: "vault",
        label: "Interview Prep",
        icon: FileText,
        benefitHint: "Practice and gain confidence",
      },
    ],
  },
];

export function isNavRouteId(id: string): id is DashboardRouteId {
  return id !== "interview-vault" && id !== "settings" || id === "settings";
}
