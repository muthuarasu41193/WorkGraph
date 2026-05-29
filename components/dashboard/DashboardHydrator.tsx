"use client";

import { useDashboardData } from "../../hooks/use-dashboard-data";

/** Loads self-hosted dashboard metrics into Zustand when WorkGraph API is configured. */
export default function DashboardHydrator() {
  useDashboardData();
  return null;
}
