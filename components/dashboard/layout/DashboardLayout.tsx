"use client";

import { useCallback, useSyncExternalStore, type ReactNode } from "react";
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

function readCollapsedPreference(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

const collapsedListeners = new Set<() => void>();

function subscribeCollapsed(onStoreChange: () => void) {
  collapsedListeners.add(onStoreChange);
  const onStorage = () => onStoreChange();
  window.addEventListener("storage", onStorage);
  return () => {
    collapsedListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function emitCollapsedChange() {
  collapsedListeners.forEach((listener) => listener());
}

export default function DashboardLayout({ children, isDark, onToggleTheme }: Props) {
  const sidebarCollapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsedPreference,
    () => false,
  );
  const { navigate } = useDashboardNavigation();

  const toggleSidebar = useCallback(() => {
    const next = !readCollapsedPreference();
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
    } catch {
      /* ignore storage errors */
    }
    emitCollapsedChange();
  }, []);

  useSidebarShortcuts({
    onToggleCollapse: toggleSidebar,
    navigate,
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
        <SideNav collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />

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
