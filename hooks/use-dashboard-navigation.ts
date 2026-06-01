"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_DASHBOARD_ROUTE,
  type DashboardRouteId,
  resolveDashboardRouteFromSearchParams,
} from "@/lib/dashboard-routes";

export function useDashboardNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeRoute = useMemo(
    (): DashboardRouteId => resolveDashboardRouteFromSearchParams(searchParams),
    [searchParams],
  );

  const navigate = useCallback(
    (route: DashboardRouteId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (route === DEFAULT_DASHBOARD_ROUTE) {
        params.delete("view");
      } else {
        params.set("view", route);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { activeRoute, navigate };
}
