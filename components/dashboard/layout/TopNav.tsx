"use client";

import Link from "next/link";
import { Bell, Command, Menu, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useMediaQuery } from "@/hooks/use-media-query";
import { DASHBOARD_MQ } from "@/lib/dashboard-responsive";
import { useEffect, useState } from "react";
import { WorkGraphLogo } from "@/components/brand/WorkGraphLogo";
import { dashboardHref } from "@/lib/dashboard-routes";

const ICON_BTN =
  "size-9 rounded-lg border-transparent enabled:hover:scale-100";

export default function TopNav() {
  const { profile, liveListings } = useDashboardContext();
  const { navigate } = useDashboardNavigation();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const isMdUp = useMediaQuery(DASHBOARD_MQ.mdUp);
  const hasUnread = true;
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();

  useEffect(() => {
    if (isMdUp) setMenuOpen(false);
  }, [isMdUp]);

  const initials =
    profile.full_name
      ?.split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "WG";

  return (
    <>
      <header className="wg-dash-topnav sticky top-0 z-modal h-[var(--dash-topnav-h)] shrink-0 overflow-x-clip border-b border-hairline bg-surface-raised/80 backdrop-blur-md">
        <div className="flex h-full items-center gap-2 px-3 md:gap-3 md:px-5">
          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(ICON_BTN, "wg-touch-target hover:bg-surface-sunken md:hidden")}
                  aria-label="Open navigation menu"
                >
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                showCloseButton={false}
                overlayClassName="md:hidden"
                className="w-[min(280px,85vw)] p-0 md:hidden data-[side=left]:data-open:slide-in-from-left-full"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>WorkGraph</SheetTitle>
                </SheetHeader>
                <SideNav mobile onNavigate={() => setMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            <Link
              href="/profile"
              className="wg-touch-target rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            >
              <WorkGraphLogo showWordmark={false} iconClassName="h-7 w-7" />
            </Link>
          </div>

          <div className="mx-auto hidden w-full max-w-[560px] min-w-0 flex-1 md:block">
            <GlobalSearch onOpenCommandPalette={() => setCmdOpen(true)} />
          </div>

          <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1.5">
            <div className="md:hidden">
              <GlobalSearch compact onOpenCommandPalette={() => setCmdOpen(true)} />
            </div>
            {liveListings > 0 ? (
              <span
                className="inline-flex h-7 max-w-full shrink-0 items-center gap-1 rounded-full border border-positive-wash bg-positive-wash px-2"
                aria-label={`${liveListings.toLocaleString()} live listings`}
              >
                <span className="wg-live-dot size-1.5 shrink-0 rounded-full bg-positive" aria-hidden />
                <span className="text-role-caption font-medium tabular-nums text-positive">
                  {liveListings.toLocaleString()}
                </span>
                <span className="hidden text-role-caption font-medium text-positive md:inline">
                  live
                </span>
              </span>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(ICON_BTN, "wg-touch-target hidden hover:bg-surface-sunken md:inline-flex")}
              onClick={() => setCmdOpen(true)}
              aria-label="Open command palette (⌘K)"
            >
              <Command className="size-4 text-ink-muted" />
            </Button>

            <Button
              type="button"
              size="icon"
              className={cn(
                ICON_BTN,
                "wg-touch-target hidden bg-danger text-accent-ink shadow-sm md:inline-flex enabled:hover:bg-danger enabled:hover:shadow-sm",
              )}
              onClick={() => navigate("jobs")}
              aria-label="Quick action: explore jobs"
            >
              <Plus className="size-4 text-accent-ink" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(ICON_BTN, "wg-touch-target relative hover:bg-surface-sunken")}
              aria-label={hasUnread ? "Notifications, unread" : "Notifications"}
            >
              <Bell className="size-4 text-ink-muted" />
              {hasUnread ? (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-surface-raised" />
              ) : null}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="wg-touch-target rounded-full outline-none transition duration-base hover:ring-2 hover:ring-surface-raised hover:ring-offset-2 hover:ring-offset-slate-100 focus-visible:ring-2 focus-visible:ring-surface-raised focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100"
                  aria-label="Account menu"
                >
                  <Avatar className="size-8">
                    {profile.photo_url ? (
                      <AvatarImage src={profile.photo_url} alt={profile.full_name || "Account"} />
                    ) : null}
                    <AvatarFallback className="bg-danger-wash text-xs font-semibold text-danger">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-56 duration-base data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100"
              >
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
