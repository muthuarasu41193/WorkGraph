"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV_GROUPS, type NavItem } from "@/lib/dashboard-nav-groups";
import type { DashboardRouteId } from "@/lib/dashboard-routes";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";

type Props = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
};

function formatShortcut(key?: string) {
  if (!key) return null;
  if (key === ",") return "g ,";
  return `g ${key}`;
}

type NavItemProps = {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onActivate: () => void;
  tabIndex: number;
  onFocus: () => void;
};

function SideNavItem({ item, active, collapsed, onActivate, tabIndex, onFocus }: NavItemProps) {
  const Icon = item.icon;
  const shortcutLabel = formatShortcut(item.shortcut);

  const className = cn(
    "wg-dash-nav-item wg-motion-sidebar-item group",
    active && "wg-dash-nav-item--active",
    collapsed && "wg-dash-nav-item--collapsed",
  );

  const inner = (
    <>
      <span className="wg-dash-nav-icon" aria-hidden>
        <Icon className="wg-dash-nav-icon-svg" />
      </span>
      {!collapsed ? (
        <>
          <span className="wg-dash-nav-label">{item.label}</span>
          {shortcutLabel ? (
            <kbd className="wg-dash-nav-kbd" aria-hidden>
              {shortcutLabel}
            </kbd>
          ) : null}
        </>
      ) : (
        <span className="sr-only">{item.label}</span>
      )}
    </>
  );

  const node = item.href ? (
    <Link
      href={item.href}
      className={className}
      tabIndex={tabIndex}
      onFocus={onFocus}
      onClick={onActivate}
      aria-current={active ? "page" : undefined}
    >
      {inner}
    </Link>
  ) : (
    <button
      type="button"
      className={className}
      tabIndex={tabIndex}
      onFocus={onFocus}
      onClick={onActivate}
      onMouseEnter={() => {
        if (item.id === "job-discovery") {
          void fetch("/api/hidden-jobs?sort=relevant", { priority: "low" } as RequestInit);
        }
      }}
      aria-current={active ? "page" : undefined}
    >
      {inner}
    </button>
  );

  if (!collapsed) return node;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{node}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        <span>{item.label}</span>
        {shortcutLabel ? (
          <span className="ml-2 text-background/70">{shortcutLabel}</span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

export default function SideNav({ collapsed = false, onToggleCollapse, mobile, onNavigate }: Props) {
  const { activeRoute, navigate } = useDashboardNavigation();
  const router = useRouter();
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const flatItems = DASHBOARD_NAV_GROUPS.flatMap((group) => group.items);

  const isActive = useCallback(
    (item: NavItem): boolean => {
      if (item.href) return pathname.startsWith(item.href);
      return activeRoute === item.id;
    },
    [activeRoute, pathname],
  );

  function handleNavClick(item: NavItem) {
    if (item.href) {
      router.push(item.href);
    } else {
      navigate(item.id as DashboardRouteId);
    }
    onNavigate?.();
  }

  function handleNavKeyDown(e: KeyboardEvent<HTMLElement>) {
    const items = navRef.current?.querySelectorAll<HTMLElement>(".wg-dash-nav-item");
    if (!items?.length) return;

    let next = focusedIndex;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      next = Math.min(next + 1, items.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      next = Math.max(next - 1, 0);
    } else {
      return;
    }

    setFocusedIndex(next);
    items[next]?.focus();
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          "wg-dash-sidenav wg-motion-sidebar",
          collapsed && "wg-dash-sidenav--collapsed",
          mobile && "wg-dash-sidenav--mobile",
        )}
        aria-label="Dashboard navigation"
      >
        <nav
          ref={navRef}
          className="wg-dash-sidenav-nav"
          onKeyDown={handleNavKeyDown}
        >
          {DASHBOARD_NAV_GROUPS.map((group, groupIndex) => (
            <section
              key={group.id}
              className={cn("wg-dash-nav-group", groupIndex > 0 && "wg-dash-nav-group--spaced")}
              aria-label={group.label || undefined}
            >
              {group.label ? (
                collapsed ? (
                  <div className="wg-dash-nav-group-divider" aria-hidden />
                ) : (
                  <h2 className="wg-dash-nav-group-label">{group.label}</h2>
                )
              ) : null}

              <ul className="wg-dash-nav-list">
                {group.items.map((item) => {
                  const itemIndex = flatItems.findIndex((entry) => entry.id === item.id);
                  const active = isActive(item);
                  return (
                    <li key={item.id}>
                      <SideNavItem
                        item={item}
                        active={active}
                        collapsed={collapsed}
                        onActivate={() => handleNavClick(item)}
                        tabIndex={itemIndex === focusedIndex ? 0 : -1}
                        onFocus={() => setFocusedIndex(itemIndex)}
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>

        {!mobile && onToggleCollapse ? (
          <div className="wg-dash-sidenav-footer">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="wg-dash-sidenav-toggle"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar ([)" : "Collapse sidebar ([)"}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" aria-hidden />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="wg-dash-sidenav-toggle-label">Collapse</span>
                  <kbd className="wg-dash-nav-kbd ml-auto" aria-hidden>
                    [
                  </kbd>
                </>
              )}
            </Button>
          </div>
        ) : null}
      </aside>
    </TooltipProvider>
  );
}
