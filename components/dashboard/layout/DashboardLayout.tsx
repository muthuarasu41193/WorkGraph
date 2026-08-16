"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useMediaQuery } from "@/hooks/use-media-query";
import TopNav from "./TopNav";
import SideNav from "./SideNav";
import MobileNav from "./MobileNav";
import "./dashboard-layout.css";

type Props = {
  children: ReactNode;
};

function DashboardLayoutInner({ children }: Props) {
  const isDesktop = useMediaQuery("(min-width: 1025px)");
  const [userCollapsed, setUserCollapsed] = useState<boolean | null>(null);

  useEffect(() => {
    setUserCollapsed(null);
  }, [isDesktop]);

  const sidebarCollapsed = userCollapsed ?? !isDesktop;

  return (
    <div className="wg-dash-root flex max-w-full overflow-x-clip">
      <SideNav
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setUserCollapsed(!sidebarCollapsed)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-x-clip overflow-y-hidden">
        <TopNav />

        <div className="wg-dash-main min-w-0 max-w-full px-4 py-6 lg:px-8 lg:py-8">
          <div className="wg-dash-content mx-auto w-full min-w-0 max-w-full">{children}</div>
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
