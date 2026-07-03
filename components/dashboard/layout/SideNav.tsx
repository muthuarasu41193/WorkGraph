"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV_GROUPS } from "@/lib/dashboard-nav-groups";
import type { DashboardRouteId } from "@/lib/dashboard-routes";
import { dashboardHref } from "@/lib/dashboard-routes";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";

type Props = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
};

export default function SideNav({ collapsed = false, onToggleCollapse, mobile, onNavigate }: Props) {
  const { activeRoute, navigate } = useDashboardNavigation();
  const router = useRouter();

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

  return (
    <aside
      className={cn(
        "wg-dash-sidenav flex h-full flex-col border-r",
        !mobile && "sticky top-[var(--dash-topnav-h)] hidden h-[calc(100dvh-var(--dash-topnav-h))] md:flex",
        collapsed ? "w-[var(--dash-sidebar-collapsed-w)]" : "w-[var(--dash-sidebar-w)]",
      )}
      aria-label="Dashboard navigation"
    >
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {DASHBOARD_NAV_GROUPS.map((group) => (
          <div key={group.id} className={cn("mb-4", group.label && "mb-5")}>
            {group.label && !collapsed ? (
              <p className="wg-dash-nav-group-label mb-2">{group.label}</p>
            ) : group.label && collapsed ? (
              <div className="mb-2 h-px bg-[var(--dash-border)]" aria-hidden />
            ) : null}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.id);
                return (
                  <li key={item.id}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        onClick={() => onNavigate?.()}
                        className={cn(
                          "group flex w-full min-h-[40px] items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                          "text-[var(--dash-text-secondary)] hover:bg-gray-50 hover:text-[var(--dash-text)]",
                          collapsed && "justify-center px-2",
                        )}
                      >
                        <Icon
                          className="h-[18px] w-[18px] shrink-0 stroke-[1.75] text-[var(--dash-text-secondary)] group-hover:text-[var(--dash-text)]"
                          aria-hidden
                        />
                        {!collapsed ? (
                          <span className="truncate">{item.label}</span>
                        ) : (
                          <span className="sr-only">{item.label}</span>
                        )}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        title={collapsed ? item.label : undefined}
                        onClick={() => handleNavClick(item.id, item.href)}
                        onMouseEnter={() => {
                          if (item.id === "job-discovery") {
                            void fetch("/api/hidden-jobs?sort=relevant", { priority: "low" } as RequestInit);
                          }
                        }}
                        className={cn(
                          "group flex w-full min-h-[40px] items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                          active
                            ? "wg-dash-nav-active font-semibold"
                            : "text-[var(--dash-text-secondary)] hover:bg-gray-50 hover:text-[var(--dash-text)]",
                          collapsed && "justify-center px-2",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0 stroke-[1.75]",
                            active
                              ? "text-[var(--dash-accent)]"
                              : "text-[var(--dash-text-secondary)] group-hover:text-[var(--dash-text)]",
                          )}
                          aria-hidden
                        />
                        {!collapsed ? (
                          <span className="truncate">{item.label}</span>
                        ) : (
                          <span className="sr-only">{item.label}</span>
                        )}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!mobile && onToggleCollapse ? (
        <div className="hidden border-t border-[var(--dash-border)] p-2 lg:block">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-center text-[var(--dash-text-secondary)]"
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
