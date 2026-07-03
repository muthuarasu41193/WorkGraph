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
      },
      {
        id: "job-discovery",
        label: "Hidden Jobs",
        icon: Radar,
        description: "Discover roles outside traditional job boards",
      },
      {
        id: "hidden-jobs",
        label: "Saved Jobs",
        icon: EyeOff,
        description: "Roles you saved or dismissed",
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
      },
      {
        id: "applications",
        label: "Application Intelligence",
        icon: ClipboardList,
        description: "Track and optimize applications",
      },
      {
        id: "workgraph-direct",
        label: "Career Intelligence",
        icon: Sparkles,
        description: "AI insights for smarter career decisions",
      },
      {
        id: "interview-vault",
        label: "Interview Vault",
        icon: Home,
        href: "/interview-vault",
        description: "Interview experiences marketplace",
      },
      {
        id: "vault",
        label: "Prep Vault",
        icon: FileText,
        description: "Local interview prep notes",
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
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        description: "Account and preferences",
      },
    ],
  },
];

export function isNavRouteId(id: string): id is DashboardRouteId {
  return id !== "interview-vault" && id !== "settings" || id === "settings";
}
