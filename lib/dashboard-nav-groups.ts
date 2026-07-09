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
  /** Micro-copy shown on hover — reduces anxiety, builds excitement */
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
        description: "Your career overview and momentum",
      },
      {
        id: "jobs",
        label: "Job Discovery",
        icon: Search,
        description: "Browse roles matched to your profile",
      },
      {
        id: "hidden-jobs",
        label: "Saved Jobs",
        icon: Bookmark,
        description: "Roles you saved for later",
      },
      {
        id: "job-discovery",
        label: "Hidden Jobs",
        icon: EyeOff,
        description: "Opportunities outside traditional job boards",
      },
    ],
  },
  {
    id: "intelligence",
    label: "Career Intelligence",
    subtitle: "5 AI-powered tools",
    collapsible: true,
    defaultCollapsedForNewUsers: true,
    items: [
      {
        id: "resume-intelligence",
        label: "Resume Intelligence",
        icon: Brain,
        description: "AI-powered resume analysis",
        benefitHint: "Get 3x more callbacks",
      },
      {
        id: "applications",
        label: "Application Intelligence",
        icon: ClipboardList,
        description: "Track your application pipeline",
        benefitHint: "Never lose track of an application",
      },
      {
        id: "workgraph-direct",
        label: "Career Path",
        icon: Route,
        description: "AI insights for your next move",
        benefitHint: "See your next best career move",
      },
      {
        id: "interview-vault",
        label: "Interview Vault",
        icon: MessageSquare,
        href: "/interview-vault",
        description: "Real interview experiences from the community",
        benefitHint: "200+ practice questions",
      },
      {
        id: "vault",
        label: "Prep Materials",
        icon: FileText,
        description: "Your personal interview prep notes",
        benefitHint: "Keep all your prep in one place",
      },
    ],
  },
];

export function isNavRouteId(id: string): id is DashboardRouteId {
  return id !== "interview-vault" && id !== "settings" || id === "settings";
}
