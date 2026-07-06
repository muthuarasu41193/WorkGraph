"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/layout";

type AuthSplitShellProps = {
  panelEyebrow?: string;
  panelHeadline: string;
  panelDescription?: string;
  highlights?: readonly string[];
  children: ReactNode;
  wide?: boolean;
};

export function AuthSplitShell({
  panelEyebrow,
  panelHeadline,
  panelDescription,
  highlights,
  children,
  wide,
}: AuthSplitShellProps) {
  return (
    <AppShell.Auth
      panelEyebrow={panelEyebrow}
      panelHeadline={panelHeadline}
      panelDescription={panelDescription}
      highlights={highlights}
      wide={wide}
    >
      {children}
    </AppShell.Auth>
  );
}
