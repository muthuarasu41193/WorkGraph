"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV_GROUPS, type NavGroup, type NavItem } from "@/lib/dashboard-nav-groups";
import type { NavFeedbackKind, NavFeedbackRoute } from "@/lib/nav-feedback-events";
import type { DashboardRouteId } from "@/lib/dashboard-routes";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { useNavFeedbackListener } from "@/hooks/use-nav-feedback-listener";
import { useDashboardContext } from "@/components/dashboard/DashboardProvider";
import { useNavUiStore } from "@/stores/nav-ui-store";
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

const FEEDBACK_ROUTE_IDS: Partial<Record<DashboardRouteId | string, NavFeedbackRoute>> = {
  applications: "applications",
  "hidden-jobs": "hidden-jobs",
};

function resolveSuccessKind(
  itemId: string,
  successState: Partial<Record<NavFeedbackRoute, NavFeedbackKind>>,
): NavFeedbackKind | null {
  const route = FEEDBACK_ROUTE_IDS[itemId];
  return route ? (successState[route] ?? null) : null;
}

export default function SideNav({
  collapsed = false,
  onToggleCollapse,
  mobile,
  onNavigate,
}: Props) {
  const { activeRoute, navigate } = useDashboardNavigation();
  const { profile, recommendedJobs, semanticJobMatches, jobPipeline, userId } = useDashboardContext();
  const router = useRouter();
  const pendingRoute = useNavUiStore((s) => s.pendingRoute);
  const setPendingRoute = useNavUiStore((s) => s.setPendingRoute);
  const successState = useNavUiStore((s) => s.successState);

  useNavFeedbackListener();

  const completion = Math.min(100, Math.max(0, profile.profile_completeness));

  const matchCount = semanticJobMatches?.length ?? recommendedJobs.length;
  const savedJobsCount = jobPipeline.saved > 0 ? jobPipeline.saved : null;
  const { activity, message, visible: showWellbeing, hasActivity } = useWeeklyJobActivity({
    userId,
    jobPipeline,
    matchCount,
    activeRoute,
  });

  useEffect(() => {
    if (pendingRoute && pendingRoute === activeRoute) {
      setPendingRoute(null);
    }
  }, [activeRoute, pendingRoute, setPendingRoute]);

  function handleNavClick(id: string, href?: string) {
    if (!href) {
      setPendingRoute(id);
    }
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

  function getItemCount(item: NavItem): number | null {
    if (item.id === "hidden-jobs") return savedJobsCount;
    return null;
  }

  function renderNavItem(item: NavItem) {
    const active = isActive(item.id);
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
      countSuffix: getItemCount(item),
      benefitHint: item.benefitHint,
      loading: pendingRoute === item.id && !active,
      successKind: resolveSuccessKind(item.id, successState),
      onMouseEnter: prefetchHiddenJobs,
    };

    if (item.href) {
      return (
        <li key={item.id}>
          <SideNavItem
            href={item.href}
            {...common}
            onClick={() => {
              setPendingRoute(item.id);
              onNavigate?.();
            }}
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

  function renderGroup(group: NavGroup, index: number) {
    if (group.id === "intelligence") {
      return (
        <CareerIntelligenceSection
          key={group.id}
          group={group}
          activeRoute={activeRoute}
          collapsed={collapsed}
          profileCompleteness={completion}
          appliedCount={jobPipeline.applied}
          pendingRoute={pendingRoute}
          successState={successState}
          onNavigate={onNavigate}
          onNavClick={handleNavClick}
        />
      );
    }

    return (
      <div key={group.id} className={cn("mb-1", index > 0 && "mt-3 border-t border-slate-100 pt-2")}>
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
      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-3">
        <div className="space-y-1">{DASHBOARD_NAV_GROUPS.map(renderGroup)}</div>

        {!collapsed && showWellbeing ? (
          <JobSearchWellbeingCard
            activity={activity}
            message={message}
            hasActivity={hasActivity}
          />
        ) : null}
      </nav>

      {!mobile && onToggleCollapse ? (
        <div className="hidden shrink-0 px-2 pb-1 lg:block">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-center text-slate-400 hover:text-slate-600"
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
        profileSuccess={successState.profile === "check"}
      />
    </aside>
  );
}
