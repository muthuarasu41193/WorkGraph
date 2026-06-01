import { create } from "zustand";
import {
  DEFAULT_DASHBOARD_ROUTE,
  type DashboardRouteId,
  resolveDashboardRouteFromSearchParams,
} from "@/lib/dashboard-routes";

function emptyMounted(): Partial<Record<DashboardRouteId, true>> {
  return { [DEFAULT_DASHBOARD_ROUTE]: true };
}

type ProfileNavState = {
  activeRoute: DashboardRouteId;
  mountedRoutes: Partial<Record<DashboardRouteId, true>>;
  hydrated: boolean;
  setActiveRoute: (route: DashboardRouteId) => void;
  hydrateFromUrl: () => void;
};

export const useProfileNavStore = create<ProfileNavState>((set) => ({
  activeRoute: DEFAULT_DASHBOARD_ROUTE,
  mountedRoutes: emptyMounted(),
  hydrated: false,
  setActiveRoute: (route) =>
    set((state) => ({
      activeRoute: route,
      mountedRoutes: { ...state.mountedRoutes, [route]: true },
    })),
  hydrateFromUrl: () => {
    if (typeof window === "undefined") return;
    const route = resolveDashboardRouteFromSearchParams(new URLSearchParams(window.location.search));
    set({
      activeRoute: route,
      mountedRoutes: { ...emptyMounted(), [route]: true },
      hydrated: true,
    });
  },
}));

export function readRouteFromLocation(): DashboardRouteId {
  if (typeof window === "undefined") return DEFAULT_DASHBOARD_ROUTE;
  return resolveDashboardRouteFromSearchParams(new URLSearchParams(window.location.search));
}
