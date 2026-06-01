"use client";

import { type ReactNode } from "react";
import type { DashboardRouteId } from "@/lib/dashboard-routes";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { useProfileNavStore } from "@/stores/profile-nav-store";
import { cn } from "@/lib/utils";

type SectionMap = Record<DashboardRouteId, ReactNode>;

type Props = {
  sections: SectionMap;
};

export default function DashboardViewRouter({ sections }: Props) {
  const { activeRoute } = useDashboardNavigation();
  const mountedRoutes = useProfileNavStore((s) => s.mountedRoutes);

  return (
    <div className="wg-dash-views relative min-h-[320px]">
      {DASHBOARD_ROUTES.map((route) => {
        if (!mountedRoutes[route.id]) return null;
        const isActive = activeRoute === route.id;
        return (
          <div
            key={route.id}
            id={`dashboard-view-${route.id}`}
            className={cn(
              "wg-dash-view outline-none",
              isActive
                ? "animate-in fade-in-0 duration-150"
                : "hidden",
            )}
            hidden={!isActive}
            aria-hidden={!isActive}
          >
            {sections[route.id]}
          </div>
        );
      })}
    </div>
  );
}
