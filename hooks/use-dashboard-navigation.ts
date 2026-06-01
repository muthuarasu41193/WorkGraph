"use client";

import { startTransition, useCallback, useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  DEFAULT_DASHBOARD_ROUTE,
  type DashboardRouteId,
} from "@/lib/dashboard-routes";
import { readRouteFromLocation, useProfileNavStore } from "@/stores/profile-nav-store";

/**
 * Client-side dashboard tabs — updates URL with replaceState instead of Next router.push
 * so /profile does not re-run the server page on every tab click.
 */
export function useDashboardNavigation() {
  const pathname = usePathname();
  const activeRoute = useProfileNavStore((s) => s.activeRoute);
  const setActiveRoute = useProfileNavStore((s) => s.setActiveRoute);
  const hydrateFromUrl = useProfileNavStore((s) => s.hydrateFromUrl);

  const hydrated = useSyncExternalStore(
    () => () => {},
    () => useProfileNavStore.getState().hydrated,
    () => false,
  );

  useEffect(() => {
    hydrateFromUrl();
  }, [hydrateFromUrl]);

  useEffect(() => {
    const onPopState = () => {
      const route = readRouteFromLocation();
      startTransition(() => {
        setActiveRoute(route);
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [setActiveRoute]);

  const navigate = useCallback(
    (route: DashboardRouteId) => {
      if (route === activeRoute) return;

      startTransition(() => {
        setActiveRoute(route);
      });

      const params = new URLSearchParams(window.location.search);
      if (route === DEFAULT_DASHBOARD_ROUTE) {
        params.delete("view");
      } else {
        params.set("view", route);
      }
      const qs = params.toString();
      const nextUrl = qs ? `${pathname}?${qs}` : pathname;
      window.history.replaceState(window.history.state, "", nextUrl);
    },
    [activeRoute, pathname, setActiveRoute],
  );

  return { activeRoute: hydrated ? activeRoute : readRouteFromLocation(), navigate };
}
