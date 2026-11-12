import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  BookOpen,
  EyeOff,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Search,
  Send,
  TrendingUp,
} from "lucide-react";
import type { DashboardRouteId } from "@/lib/dashboard-routes";

export type NavItem = {
  id: DashboardRouteId | "interview-vault" | "prepare" | "settings";
  label: string;
  icon: LucideIcon;
  href?: string;
  description?: string;
  /** Supportive micro-copy on hover — coach tone, not corporate */
  benefitHint?: string;
  /** Hide or prompt until the seeker has a usable profile/resume */
  requiresProfile?: boolean;
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
        id: "prepare",
        label: "Prep pack",
        icon: BookOpen,
        href: "/prepare",
        benefitHint: "Build a free interview prep pack",
      },
      {
        id: "jobs",
        label: "Find Jobs",
        icon: Search,
        benefitHint: "Browse roles in the catalog",
      },
      {
        id: "hidden-jobs",
        label: "Saved Jobs",
        icon: Bookmark,
        benefitHint: "Jobs you're excited about",
      },
      {
        id: "job-discovery",
        label: "Community posts",
        icon: EyeOff,
        benefitHint: "Hiring posts from Reddit, Hacker News, and GitHub",
      },
    ],
  },
  {
    id: "intelligence",
    label: "Interview & AI tools",
    subtitle: "Prep first, then tailor applications",
    collapsible: true,
    defaultCollapsedForNewUsers: true,
    items: [
      {
        id: "interview-vault",
        label: "Interview Vault",
        icon: MessageSquare,
        href: "/interview-vault",
        benefitHint: "Learn from firsthand interview guides",
      },
      {
        id: "vault",
        label: "Prep Materials",
        icon: BookOpen,
        benefitHint: "Local practice notes on this device",
      },
      {
        id: "resume-intelligence",
        label: "Resume Intelligence",
        icon: FileText,
        benefitHint: "Make your resume stand out",
      },
      {
        id: "cover-letters",
        label: "Cover Letters",
        icon: FileText,
        benefitHint: "AI-powered cover letter generation",
        requiresProfile: true,
      },
      {
        id: "applications",
        label: "My Applications",
        icon: Send,
        benefitHint: "Track your progress",
      },
      {
        id: "workgraph-direct",
        label: "Career Path",
        icon: TrendingUp,
        benefitHint: "See your growth trajectory",
      },
    ],
  },
];

export function isNavRouteId(id: string): id is DashboardRouteId {
  return id !== "interview-vault" && id !== "settings" || id === "settings";
}
