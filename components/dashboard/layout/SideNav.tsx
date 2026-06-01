"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";

type Props = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
};

export default function SideNav({ collapsed = false, onToggleCollapse, mobile, onNavigate }: Props) {
  const { activeRoute, navigate } = useDashboardNavigation();

  return (
    <aside
      className={cn(
        "wg-dash-sidenav flex h-full flex-col border-r",
        !mobile && "sticky top-[60px] hidden h-[calc(100dvh-60px)] md:flex",
        collapsed ? "w-[72px]" : "w-[240px]",
      )}
      aria-label="Dashboard navigation"
    >
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {DASHBOARD_ROUTES.map((route) => {
            const Icon = route.icon;
            const active = activeRoute === route.id;
            return (
              <li key={route.id}>
                <button
                  type="button"
                  title={collapsed ? route.label : undefined}
                  onClick={() => {
                    navigate(route.id);
                    onNavigate?.();
                  }}
                  onMouseEnter={() => {
                    if (route.id === "job-discovery") {
                      void fetch("/api/hidden-jobs?sort=relevant", { priority: "low" } as RequestInit);
                    }
                  }}
                  className={cn(
                    "group flex w-full min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "wg-dash-nav-active font-semibold"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-2",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0 stroke-[1.75]",
                      active ? "text-[var(--dash-accent)]" : "text-foreground/55 group-hover:text-foreground",
                    )}
                    aria-hidden
                  />
                  {!collapsed ? (
                    <span className="truncate">{route.label}</span>
                  ) : (
                    <span className="sr-only">{route.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {!mobile && onToggleCollapse ? (
        <div className="hidden border-t border-border p-2 lg:block">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
