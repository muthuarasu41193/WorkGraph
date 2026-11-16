"use client";

import Link from "next/link";
import { BookOpen, MessageSquare } from "lucide-react";
import type { DashboardRouteId } from "@/lib/dashboard-routes";
import { getDashboardRoute } from "@/lib/dashboard-routes";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/lib/focus-ring";

type MobileDest =
  | { kind: "route"; id: DashboardRouteId }
  | { kind: "href"; href: string; label: string; shortLabel: string; icon: typeof BookOpen };

/** Prep pack and Interview Vault lead; jobs remain reachable. */
const MOBILE_DESTS: MobileDest[] = [
  { kind: "route", id: "home" },
  {
    kind: "href",
    href: "/prep-pack",
    label: "Prep pack",
    shortLabel: "Prep",
    icon: BookOpen,
  },
  {
    kind: "href",
    href: "/interview-vault",
    label: "Interview Vault",
    shortLabel: "Vault",
    icon: MessageSquare,
  },
  { kind: "route", id: "jobs" },
  { kind: "route", id: "applications" },
  { kind: "route", id: "profile" },
];

export default function MobileNav() {
  const { activeRoute, navigate } = useDashboardNavigation();

  return (
    <nav
      className="wg-dash-mobilenav fixed bottom-0 left-0 right-0 z-modal border-t border-[var(--wg-border)] bg-surface/95 backdrop-blur-xl md:hidden"
      aria-label="Mobile dashboard navigation"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-6 gap-0 px-1 pb-[env(safe-area-inset-bottom)]">
        {MOBILE_DESTS.map((dest) => {
          if (dest.kind === "href") {
            const Icon = dest.icon;
            return (
              <li key={dest.href}>
                <Link
                  href={dest.href}
                  className={cn(
                    "flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1.5 text-role-caption transition-colors duration-base ease-exit",
                    FOCUS_RING,
                    "text-fg-secondary hover:bg-[var(--wg-bg-secondary)]",
                  )}
                  aria-label={dest.label}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  <span className="max-w-full truncate leading-none">{dest.shortLabel}</span>
                </Link>
              </li>
            );
          }

          const route = getDashboardRoute(dest.id);
          const Icon = route.icon;
          const active = activeRoute === dest.id;
          return (
            <li key={dest.id}>
              <button
                type="button"
                onClick={() => navigate(dest.id)}
                className={cn(
                  "flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1.5 text-role-caption transition-colors duration-base ease-exit",
                  FOCUS_RING,
                  active
                    ? "bg-brand-50 text-brand"
                    : "text-fg-secondary hover:bg-[var(--wg-bg-secondary)]",
                )}
                aria-current={active ? "page" : undefined}
                aria-label={route.label}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.25]")} aria-hidden />
                <span className="max-w-full truncate leading-none">{route.shortLabel}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
