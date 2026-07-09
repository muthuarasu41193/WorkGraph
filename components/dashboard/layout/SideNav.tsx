"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV_GROUPS, type NavGroup, type NavItem } from "@/lib/dashboard-nav-groups";
import type { DashboardRouteId } from "@/lib/dashboard-routes";
import { dashboardHref } from "@/lib/dashboard-routes";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { useSavedJobsBadge } from "@/hooks/use-saved-jobs-badge";
import { useDashboardContext } from "@/components/dashboard/DashboardProvider";
import { WorkGraphLogo } from "@/components/brand/WorkGraphLogo";
import CareerIntelligenceSection from "./CareerIntelligenceSection";
import JobSearchWellbeingCard from "./JobSearchWellbeingCard";
import SidebarBottom from "./SidebarBottom";
import SideNavItem from "./SideNavItem";
import { useWeeklyJobActivity } from "@/hooks/use-weekly-job-activity";
import "./sidenav.css";

type Props = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
};

export default function SideNav({
  collapsed = false,
  onToggleCollapse,
  mobile,
  onNavigate,
}: Props) {
  const { activeRoute, navigate } = useDashboardNavigation();
  const { profile, recommendedJobs, semanticJobMatches, jobPipeline, userId } = useDashboardContext();
  const router = useRouter();

  const completion = Math.min(100, Math.max(0, profile.profile_completeness));

  const matchCount = semanticJobMatches?.length ?? recommendedJobs.length;
  const savedJobsBadge = useSavedJobsBadge(matchCount, activeRoute);
  const { activity, message, visible: showWellbeing, hasActivity } = useWeeklyJobActivity({
    userId,
    jobPipeline,
    matchCount,
    activeRoute,
  });

  function handleNavClick(id: string, href?: string) {
    if (href) {
      router.push(href);
    } else {
      navigate(id as DashboardRouteId);
    }
    onNavigate?.();
  }

  function isActive(id: string): boolean {
    if (id === "interview-vault") return false;
    return activeRoute === id;
  }

  function getItemBadge(item: NavItem): string | null {
    if (item.id === "hidden-jobs") return savedJobsBadge;
    return null;
  }

  function renderNavItem(item: NavItem) {
    const active = isActive(item.id);
    const badge = getItemBadge(item);
    const prefetchHiddenJobs = () => {
      if (item.id === "job-discovery") {
        void fetch("/api/hidden-jobs?sort=relevant", { priority: "low" } as RequestInit);
      }
    };

    const common = {
      label: item.label,
      icon: item.icon,
      active,
      collapsed,
      badge,
      onMouseEnter: prefetchHiddenJobs,
    };

    if (item.href) {
      return (
        <li key={item.id}>
          <SideNavItem
            href={item.href}
            {...common}
            onClick={() => onNavigate?.()}
          />
        </li>
      );
    }

    return (
      <li key={item.id}>
        <SideNavItem
          {...common}
          onClick={() => handleNavClick(item.id, item.href)}
        />
      </li>
    );
  }

  function renderGroup(group: NavGroup) {
    if (group.id === "intelligence") {
      return (
        <CareerIntelligenceSection
          key={group.id}
          group={group}
          activeRoute={activeRoute}
          collapsed={collapsed}
          profileCompleteness={completion}
          appliedCount={jobPipeline.applied}
          onNavigate={onNavigate}
          onNavClick={handleNavClick}
        />
      );
    }

    return (
      <div key={group.id} className="mb-1">
        {group.label && !collapsed ? (
          <p className="wg-section-label">{group.label}</p>
        ) : null}
        <ul className="space-y-0.5 px-0">{group.items.map(renderNavItem)}</ul>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "wg-dash-sidenav flex h-full flex-col bg-white",
        !mobile && "sticky top-[var(--dash-topnav-h)] hidden h-[calc(100dvh-var(--dash-topnav-h))] border-r border-slate-100 md:flex",
        collapsed ? "w-[var(--dash-sidebar-collapsed-w)]" : "w-[var(--dash-sidebar-w)]",
      )}
      aria-label="Dashboard navigation"
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-gray-100 px-1",
          collapsed ? "justify-center px-2" : "px-3",
        )}
      >
        <Link
          href={dashboardHref("home")}
          className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          onClick={() => onNavigate?.()}
        >
          <WorkGraphLogo
            iconClassName="h-7 w-7"
            className={cn("gap-2", collapsed && "gap-0")}
            showWordmark={!collapsed}
          />
        </Link>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-4">
        <div className="space-y-1">{DASHBOARD_NAV_GROUPS.map(renderGroup)}</div>

        {!collapsed && showWellbeing ? (
          <div className="mt-4">
            <JobSearchWellbeingCard
              activity={activity}
              message={message}
              hasActivity={hasActivity}
            />
          </div>
        ) : null}
      </nav>

      {!mobile && onToggleCollapse ? (
        <div className="hidden shrink-0 px-2 pb-1 lg:block">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-center text-gray-400 hover:text-gray-600"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      ) : null}

      <SidebarBottom
        collapsed={collapsed}
        onNavigate={onNavigate}
      />
    </aside>
  );
}
