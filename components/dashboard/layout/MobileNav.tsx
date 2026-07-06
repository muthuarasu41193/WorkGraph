"use client";

import { Button } from "@/components/ui/button";
import type { DashboardRouteId } from "@/lib/dashboard-routes";
import { getDashboardRoute } from "@/lib/dashboard-routes";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { cn } from "@/lib/utils";

const MOBILE_ROUTES: DashboardRouteId[] = [
  "home",
  "jobs",
  "job-discovery",
  "resume-intelligence",
  "applications",
  "profile",
];

export default function MobileNav() {
  const { activeRoute, navigate } = useDashboardNavigation();

  return (
    <nav
      className="wg-dash-mobilenav fixed bottom-0 left-0 right-0 z-50 border-t md:hidden"
      aria-label="Mobile dashboard navigation"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-6 gap-0 px-1 pb-[env(safe-area-inset-bottom)]">
        {MOBILE_ROUTES.map((routeId) => {
          const route = getDashboardRoute(routeId);
          const Icon = route.icon;
          const active = activeRoute === routeId;
          return (
            <li key={routeId}>
              <button
                type="button"
                onClick={() => navigate(routeId)}
                className={cn(
                  "wg-dash-mobilenav-item",
                  active && "wg-dash-mobilenav-item--active",
                )}
                aria-current={active ? "page" : undefined}
                aria-label={route.label}
              >
                <Icon className="wg-dash-mobilenav-icon" aria-hidden />
                <span className="wg-dash-mobilenav-label">{route.shortLabel}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
