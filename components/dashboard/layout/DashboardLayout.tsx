"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DASHBOARD_MQ } from "@/lib/dashboard-responsive";
import { SkipLink } from "@/components/a11y/SkipLink";
import { LegalNav } from "@/components/legal/LegalDocument";
import { PageContainer } from "@/components/ui/page-container";
import TopNav from "./TopNav";
import SideNav from "./SideNav";
import MobileNav from "./MobileNav";
import "./dashboard-layout.css";

type Props = {
  children: ReactNode;
};

function DashboardLayoutInner({ children }: Props) {
  const isDesktop = useMediaQuery(DASHBOARD_MQ.desktop);
  const [userCollapsed, setUserCollapsed] = useState<boolean | null>(null);

  useEffect(() => {
    setUserCollapsed(null);
  }, [isDesktop]);

  const sidebarCollapsed = userCollapsed ?? !isDesktop;

  return (
    <div className="wg-dash-root flex max-w-full overflow-x-clip">
      <SkipLink />
      <SideNav
        collapsed={sidebarCollapsed}
        userCollapsed={userCollapsed}
        onToggleCollapse={() => setUserCollapsed(!sidebarCollapsed)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-x-clip overflow-y-hidden">
        <TopNav />

        <main
          id="main-content"
          tabIndex={-1}
          className="wg-dash-main min-w-0 max-w-full py-[var(--space-4)] outline-none md:py-[var(--space-6)]"
        >
          <PageContainer gap="none" className="wg-dash-content">
            {children}
            <div className="mt-[var(--space-7)] border-t border-hairline pt-[var(--space-4)] md:hidden">
              <LegalNav />
            </div>
          </PageContainer>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}

export default function DashboardLayout(props: Props) {
  return <DashboardLayoutInner {...props} />;
}
