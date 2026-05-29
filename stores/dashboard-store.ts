import { create } from "zustand";
import type { DashboardSnapshot, WalletSummary } from "../packages/shared/types/phase3";

type DashboardTab = "overview" | "community" | "wallet";

type DashboardState = {
  activeTab: DashboardTab;
  dashboard: DashboardSnapshot | null;
  wallet: WalletSummary | null;
  setActiveTab: (tab: DashboardTab) => void;
  setDashboardData: (dashboard: DashboardSnapshot | null, wallet: WalletSummary | null) => void;
  reset: () => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  activeTab: "overview",
  dashboard: null,
  wallet: null,
  setActiveTab: (activeTab) => set({ activeTab }),
  setDashboardData: (dashboard, wallet) => set({ dashboard, wallet }),
  reset: () => set({ activeTab: "overview", dashboard: null, wallet: null }),
}));
