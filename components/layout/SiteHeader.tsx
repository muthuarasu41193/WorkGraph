"use client";

import type { ReactNode } from "react";
import { LandingHeaderProvider, useLandingHeader } from "./LandingHeaderContext";

function HeaderSpacer() {
  const { headerOffset } = useLandingHeader();
  return <div aria-hidden style={{ height: headerOffset }} />;
}

export function SiteHeader({ children }: { children: ReactNode }) {
  return (
    <LandingHeaderProvider>
      <header className="fixed inset-x-0 top-0 z-50">{children}</header>
      <HeaderSpacer />
    </LandingHeaderProvider>
  );
}
