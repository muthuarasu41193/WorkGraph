"use client";

import { Suspense, useState, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toaster";
import TopNav from "./TopNav";
import SideNav from "./SideNav";
import MobileNav from "./MobileNav";
import "./dashboard-layout.css";

type Props = {
  children: ReactNode;
  isDark?: boolean;
  onToggleTheme?: () => void;
};

function DashboardLayoutInner({ children, isDark, onToggleTheme }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="wg-dash-root flex min-h-dvh flex-col">
      <TopNav
        sidebarCollapsed={sidebarCollapsed}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
      />

      <div className="flex flex-1">
        <SideNav
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />

        <div className="wg-dash-main min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-6 md:px-6">
          <div className="wg-dash-content mx-auto w-full">{children}</div>
        </div>
      </div>

      <MobileNav />
      <Toaster />
    </div>
  );
}

function DashboardLayoutFallback() {
  return (
    <div className="wg-dash-root p-6">
      <Skeleton className="mb-4 h-[60px] w-full rounded-lg" />
      <div className="flex gap-4">
        <Skeleton className="hidden h-96 w-60 rounded-lg md:block" />
        <Skeleton className="h-96 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

export default function DashboardLayout(props: Props) {
  return (
    <Suspense fallback={<DashboardLayoutFallback />}>
      <DashboardLayoutInner {...props} />
    </Suspense>
  );
}
