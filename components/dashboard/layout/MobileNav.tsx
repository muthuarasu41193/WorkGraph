"use client";

import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const { activeRoute, navigate } = useDashboardNavigation();

  return (
    <nav
      className="wg-dash-mobilenav fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden dark:border-slate-800 dark:bg-slate-950/95"
      aria-label="Mobile dashboard navigation"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-6 gap-0 px-1 pb-[env(safe-area-inset-bottom)]">
        {DASHBOARD_ROUTES.map((route) => {
          const Icon = route.icon;
          const active = activeRoute === route.id;
          return (
            <li key={route.id}>
              <button
                type="button"
                onClick={() => navigate(route.id)}
                className={cn(
                  "flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 text-[10px] font-medium transition-colors",
                  active ? "text-blue-600 dark:text-blue-400" : "text-slate-500",
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
