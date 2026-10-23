export type ShellDest = {
  href: string
  label: string
  short: string
  /** Shown in the mobile tab bar. At most five. */
  tab: boolean
}

/**
 * Primary destinations. Profile, insights, prep, and settings keep their existing URLs.
 * Jobs, tracker, and onboarding are new routes inside this shell.
 */
export const SHELL_DESTINATIONS: ShellDest[] = [
  { href: "/jobs", label: "Jobs", short: "Jobs", tab: true },
  { href: "/tracker", label: "Tracker", short: "Tracker", tab: true },
  { href: "/interview-vault", label: "Prep", short: "Prep", tab: true },
  { href: "/insights", label: "Insights", short: "Insights", tab: true },
  { href: "/profile", label: "Profile", short: "Profile", tab: true },
  { href: "/profile?view=settings", label: "Settings", short: "Settings", tab: false },
]

export function shellTitle(pathname: string): string {
  if (pathname.startsWith("/jobs/")) return "Job"
  if (pathname.startsWith("/jobs")) return "Jobs"
  if (pathname.startsWith("/tracker")) return "Tracker"
  if (pathname.startsWith("/onboarding")) return "Onboarding"
  if (pathname.startsWith("/insights")) return "Insights"
  return "WorkGraph"
}

export function shellActive(pathname: string, href: string, search = ""): boolean {
  const params = new URLSearchParams(search)
  if (href.startsWith("/profile?view=settings")) {
    return pathname === "/profile" && params.get("view") === "settings"
  }
  if (href === "/profile") {
    return pathname === "/profile" && params.get("view") !== "settings"
  }
  const path = href.split("?")[0] ?? href
  return pathname === path || pathname.startsWith(`${path}/`)
}

/** Subsequence match. Exact includes rank above a loose fuzzy hit. */
export function fuzzyScore(query: string, text: string): number {
  const q = query.trim().toLowerCase()
  const t = text.toLowerCase()
  if (!q) return 1
  const at = t.indexOf(q)
  if (at >= 0) return 100 - Math.min(at, 90)
  let qi = 0
  for (let i = 0; i < t.length && qi < q.length; i += 1) {
    if (t[i] === q[qi]) qi += 1
  }
  return qi === q.length ? 10 : 0
}
