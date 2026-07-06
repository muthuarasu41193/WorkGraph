"use client";

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
      className="wg-dash-mobilenav fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-default)] bg-surface-primary/90 backdrop-blur-xl md:hidden"
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
                  "flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 text-caption font-medium transition-colors",
                  active ? "text-[var(--accent)]" : "text-[var(--text-secondary)]",
                )}
                aria-current={active ? "page" : undefined}
                aria-label={route.label}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.25]")} aria-hidden />
                <span className="max-w-full truncate leading-none">{route.shortLabel}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
