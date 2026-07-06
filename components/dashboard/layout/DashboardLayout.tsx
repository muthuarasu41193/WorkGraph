"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { AppShell } from "@/components/layout";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { useSidebarShortcuts } from "@/hooks/use-sidebar-shortcuts";
import TopNav from "./TopNav";
import SideNav from "./SideNav";
import MobileNav from "./MobileNav";
import "./dashboard-layout.css";

const SIDEBAR_COLLAPSED_KEY = "wg-sidebar-collapsed";

type Props = {
  children: ReactNode;
  isDark?: boolean;
  onToggleTheme?: () => void;
};

export default function DashboardLayout({ children, isDark, onToggleTheme }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const { navigate } = useDashboardNavigation();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === "true") setSidebarCollapsed(true);
    } catch {
      /* ignore storage errors */
    }
    setHydrated(true);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  }, []);

  useSidebarShortcuts({
    onToggleCollapse: toggleSidebar,
    navigate,
    enabled: hydrated,
  });

  return (
    <AppShell className="wg-dash-root">
      <AppShell.Header>
        <TopNav
          sidebarCollapsed={sidebarCollapsed}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
        />
      </AppShell.Header>

      <AppShell.Body>
        <SideNav
          collapsed={hydrated ? sidebarCollapsed : false}
          onToggleCollapse={toggleSidebar}
        />

        <AppShell.Main>
          <AppShell.Content>{children}</AppShell.Content>
        </AppShell.Main>
      </AppShell.Body>

      <AppShell.Footer>
        <MobileNav />
      </AppShell.Footer>
      <Toaster />
    </AppShell>
  );
}
