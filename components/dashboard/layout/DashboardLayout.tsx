"use client";

import { useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import TopNav from "./TopNav";
import SideNav from "./SideNav";
import MobileNav from "./MobileNav";
import "./dashboard-layout.css";

type Props = {
  children: ReactNode;
};

function DashboardLayoutInner({ children }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="wg-dash-root flex">
      <SideNav
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNav sidebarCollapsed={sidebarCollapsed} />

        <div className="wg-dash-main min-w-0 px-4 py-8 sm:px-6 md:px-8">
          <div className="wg-dash-content mx-auto w-full">{children}</div>
        </div>
      </div>

      <MobileNav />
      <Toaster />
    </div>
  );
}

export default function DashboardLayout(props: Props) {
  return <DashboardLayoutInner {...props} />;
}
