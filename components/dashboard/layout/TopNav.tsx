"use client";

import Link from "next/link";
import { Bell, Command, Menu, Moon, Plus, Sun } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import CommandPalette, { useCommandPalette } from "@/components/design-system/CommandPalette";
import GlobalSearch from "./GlobalSearch";
import SideNav from "./SideNav";
import { signOutClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDashboardContext } from "@/components/dashboard/DashboardProvider";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { useState } from "react";
import { WorkGraphLogo } from "@/components/brand/WorkGraphLogo";
import { dashboardHref } from "@/lib/dashboard-routes";

type Props = {
  sidebarCollapsed?: boolean;
  onToggleTheme?: () => void;
  isDark?: boolean;
};

export default function TopNav({ sidebarCollapsed, onToggleTheme, isDark }: Props) {
  const { profile, liveListings } = useDashboardContext();
  const { navigate } = useDashboardNavigation();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();

  const initials =
    profile.full_name
      ?.split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "WG";

  return (
    <>
      <header className="wg-dash-topnav sticky top-0 z-50 h-[var(--dash-topnav-h)] border-b">
        <div className="flex h-full items-center gap-2 px-3 md:gap-3 md:px-5">
          <div className="flex shrink-0 items-center gap-2">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="border-b px-4 py-4 text-left">
                  <SheetTitle>WorkGraph</SheetTitle>
                </SheetHeader>
                <SideNav mobile onNavigate={() => setMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            <Link
              href="/profile"
              className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <WorkGraphLogo iconClassName="h-7 w-7" className="gap-2" />
            </Link>
          </div>

          <div
            className={cn(
              "mx-auto hidden max-w-md flex-1 md:block",
              sidebarCollapsed && "max-w-xl",
            )}
          >
            <GlobalSearch />
          </div>

          <div className="flex flex-1 md:hidden">
            <GlobalSearch compact />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
            {liveListings > 0 ? (
              <Badge
                variant="secondary"
                className="hidden rounded-md border-0 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 lg:inline-flex"
              >
                <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                {liveListings.toLocaleString()} live
              </Badge>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="hidden h-8 gap-1.5 px-2 text-xs text-[var(--dash-text-secondary)] lg:inline-flex"
              onClick={() => setCmdOpen(true)}
            >
              <Command className="h-3.5 w-3.5" />
              <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-medium">⌘K</kbd>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden h-9 w-9 sm:inline-flex"
              onClick={() => navigate("jobs")}
              aria-label="Quick action: explore jobs"
            >
              <Plus className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--dash-accent)] ring-2 ring-white" />
            </Button>

            {onToggleTheme ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden h-9 w-9 sm:inline-flex"
                onClick={onToggleTheme}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Account menu"
                >
                  <Avatar size="default">
                    <AvatarFallback className="bg-[var(--dash-accent-soft)] text-xs font-semibold text-[var(--dash-accent)]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-medium">{profile.full_name || "Your account"}</p>
                  <p className="text-xs font-normal text-muted-foreground">
                    {profile.headline || "AI Career Intelligence"}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={dashboardHref("profile")}>Edit profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={dashboardHref("settings")}>Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/interview-vault">Interview Vault</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOutClient();
                    router.push("/login");
                    router.refresh();
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onNavigate={navigate}
      />
    </>
  );
}
