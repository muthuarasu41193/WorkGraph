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
        "wg-dash-sidenav flex h-full flex-col border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950",
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
                  className={cn(
                    "group flex w-full min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-blue-600/10 to-indigo-600/5 text-blue-700 shadow-sm ring-1 ring-blue-600/15 dark:from-blue-500/15 dark:to-indigo-500/10 dark:text-blue-300 dark:ring-blue-500/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100",
                    collapsed && "justify-center px-2",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0 stroke-[1.75]",
                      active ? "text-blue-600 dark:text-blue-400" : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200",
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
