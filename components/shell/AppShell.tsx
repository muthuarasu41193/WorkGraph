"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Menu, Search } from "lucide-react"
import { SkipLink } from "@/components/a11y/SkipLink"
import { ShellCommandPalette } from "@/components/shell/ShellCommandPalette"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { signOutClient } from "@/lib/auth/client"
import { readShellScroll, saveShellScroll, shellScrollId } from "@/lib/shell-scroll"
import { SHELL_DESTINATIONS, shellActive, shellTitle } from "@/lib/shell-nav"
import { cn } from "@/lib/utils"

const COLLAPSE_KEY = "wg-shell-collapsed"

function subscribeCollapse(onStoreChange: () => void) {
  window.addEventListener("wg-shell-collapse", onStoreChange)
  return () => window.removeEventListener("wg-shell-collapse", onStoreChange)
}

function collapsedSnapshot() {
  return window.localStorage.getItem(COLLAPSE_KEY) === "1"
}

export function AppShell({
  userId,
  email,
  children,
}: {
  userId: string | null
  email: string | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const router = useRouter()
  const collapsed = useSyncExternalStore(subscribeCollapse, collapsedSnapshot, () => false)
  const [palette, setPalette] = useState(false)
  const [help, setHelp] = useState(false)
  const [chord, setChord] = useState<"g" | null>(null)
  const helpCloseRef = useRef<HTMLButtonElement>(null)
  const tabs = SHELL_DESTINATIONS.filter((dest) => dest.tab)

  function toggleCollapsed() {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "0" : "1")
    window.dispatchEvent(new Event("wg-shell-collapse"))
  }

  useEffect(() => {
    const id = shellScrollId(pathname, search)
    const top = readShellScroll(id)
    if (top != null) window.scrollTo(0, top)
    return () => {
      saveShellScroll(id, window.scrollY)
    }
  }, [pathname, search])

  useEffect(() => {
    if (!help) return
    helpCloseRef.current?.focus()
  }, [help])

  useEffect(() => {
    function onHelpRequest() {
      setHelp(true)
    }
    window.addEventListener("wg-shell-help", onHelpRequest)
    return () => window.removeEventListener("wg-shell-help", onHelpRequest)
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing = Boolean(
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable),
      )
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setPalette(true)
        return
      }
      if (event.key === "Escape") {
        setPalette(false)
        setHelp(false)
        setChord(null)
        return
      }
      if (typing) return
      if (event.key === "?") {
        event.preventDefault()
        setHelp(true)
        return
      }
      if (event.key === "/") {
        event.preventDefault()
        setPalette(true)
        document.getElementById("shell-search")?.focus()
        return
      }
      if (event.key === "g") {
        setChord("g")
        return
      }
      if (chord === "g" && event.key === "j") {
        setChord(null)
        router.push("/jobs")
        return
      }
      if (chord === "g" && event.key === "t") {
        setChord(null)
        router.push("/tracker")
        return
      }
      if (chord === "g") setChord(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [chord, router])

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-surface text-ink">
        <SkipLink />
        <div className="flex min-h-screen">
          <aside
            className={cn(
              "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-hairline bg-surface-raised md:flex",
              collapsed ? "w-16" : "w-56",
            )}
          >
            <div className="flex min-h-11 items-center justify-between px-3">
              {collapsed ? null : <p className="text-role-body-small font-semibold">WorkGraph</p>}
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control hover:bg-surface-sunken"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={toggleCollapsed}
              >
                <Menu className="size-4" />
              </button>
            </div>
            <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 px-2">
              {SHELL_DESTINATIONS.map((dest) => {
                const active = shellActive(pathname, dest.href, search)
                const link = (
                  <Link
                    href={dest.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-2 rounded-control px-2 text-role-body-small",
                      active ? "bg-accent-wash font-medium text-accent" : "text-ink hover:bg-surface-sunken",
                    )}
                  >
                    <span className="inline-flex size-6 items-center justify-center text-role-caption">{dest.short.slice(0, 1)}</span>
                    {collapsed ? null : dest.label}
                  </Link>
                )
                if (!collapsed) return <div key={dest.href}>{link}</div>
                return (
                  <Tooltip key={dest.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{dest.label}</TooltipContent>
                  </Tooltip>
                )
              })}
            </nav>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-nav flex min-h-14 flex-wrap items-center gap-2 border-b border-hairline bg-surface px-3">
              <h1 className="min-w-0 max-w-full flex-1 truncate text-role-subheading">{shellTitle(pathname)}</h1>
              <button
                id="shell-search"
                type="button"
                className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-control border border-hairline px-3 text-role-caption text-ink-muted"
                aria-label="Search"
                onClick={() => setPalette(true)}
              >
                <Search className="size-4" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden text-role-caption sm:inline">⌘K</kbd>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-h-11 max-w-48 truncate">
                    {email ? email : "Account"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {userId ? (
                    <>
                      <DropdownMenuItem onSelect={() => router.push("/profile")}>Profile</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => router.push("/profile?view=settings")}>Settings</DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          void signOutClient().then(() => router.push("/"))
                        }}
                      >
                        Sign out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onSelect={() => router.push("/login?next=/jobs")}>Sign in</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </header>
            <div id="main-content" tabIndex={-1} className="min-w-0 flex-1 pb-24 outline-none md:pb-6">{children}</div>
          </div>
        </div>
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-nav flex border-t border-hairline bg-surface-raised pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          {tabs.map((dest) => {
            const active = shellActive(pathname, dest.href, search)
            return (
              <Link
                key={dest.href}
                href={dest.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 flex-1 flex-col items-center justify-center text-role-caption",
                  active ? "border-t-2 border-accent font-semibold text-accent" : "text-ink-muted",
                )}
              >
                {dest.short}
              </Link>
            )
          })}
        </nav>
        <ShellCommandPalette open={palette} onOpenChange={setPalette} />
        {help ? (
          <div
            className="fixed inset-0 z-modal flex items-end justify-center bg-scrim/40 p-4 md:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shell-shortcuts-title"
            onKeyDown={(event) => {
              if (event.key !== "Tab") return
              const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea")]
              const first = focusable[0]
              const last = focusable[focusable.length - 1]
              if (!first || !last) return
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
              }
            }}
          >
            <div className="w-full max-w-md rounded-overlay border border-hairline bg-surface-raised p-4 shadow-overlay">
              <h2 id="shell-shortcuts-title" className="text-role-subheading">Shortcuts</h2>
              <ul className="mt-3 space-y-2 text-role-body-small">
                <li>⌘K or Ctrl K opens search</li>
                <li>/ opens search</li>
                <li>g then j opens jobs</li>
                <li>g then t opens the tracker</li>
                <li>? opens this list</li>
                <li>Escape closes the open layer</li>
              </ul>
              <Button ref={helpCloseRef} className="mt-4 min-h-11" onClick={() => setHelp(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  )
}
