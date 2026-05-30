"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { DashboardContextValue } from "./DashboardContext";

const Ctx = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  value,
  children,
}: {
  value: DashboardContextValue;
  children: ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboardContext(): DashboardContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useDashboardContext must be used within DashboardProvider");
  }
  return ctx;
}
