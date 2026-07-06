"use client";

import { useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { AppShell } from "@/components/layout";
import TopNav from "./TopNav";
import SideNav from "./SideNav";
import MobileNav from "./MobileNav";
import "./dashboard-layout.css";

type Props = {
  children: ReactNode;
  isDark?: boolean;
  onToggleTheme?: () => void;
};

export default function DashboardLayout({ children, isDark, onToggleTheme }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
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
