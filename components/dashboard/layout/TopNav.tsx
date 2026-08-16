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
import { useState } from "react";
import { WorkGraphLogo } from "@/components/brand/WorkGraphLogo";
import { dashboardHref } from "@/lib/dashboard-routes";

const ICON_BTN =
  "size-9 rounded-lg border-transparent enabled:hover:scale-100";

type Props = {
  sidebarCollapsed?: boolean;
};

export default function TopNav({ sidebarCollapsed: _sidebarCollapsed }: Props) {
  const { profile, liveListings } = useDashboardContext();
  const { navigate } = useDashboardNavigation();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const hasUnread = true;
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();

  const initials =
    profile.full_name
      ?.split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "WG";

  return (
    <>
      <header className="wg-dash-topnav sticky top-0 z-50 h-[var(--dash-topnav-h)] shrink-0 border-b border-slate-100 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex h-full items-center gap-2 px-3 md:gap-3 md:px-5">
          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(ICON_BTN, "hover:bg-slate-100 md:hidden")}
                  aria-label="Open navigation menu"
                >
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>WorkGraph</SheetTitle>
                </SheetHeader>
                <SideNav mobile onNavigate={() => setMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            <Link
              href="/profile"
              className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            >
              <WorkGraphLogo iconClassName="h-7 w-7" className="gap-2" />
            </Link>
          </div>

          <div className="mx-auto hidden w-full max-w-[560px] flex-1 md:block">
            <GlobalSearch onOpenCommandPalette={() => setCmdOpen(true)} />
          </div>

          <div className="flex flex-1 md:hidden">
            <GlobalSearch compact onOpenCommandPalette={() => setCmdOpen(true)} />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {liveListings > 0 ? (
              <span className="hidden h-7 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 lg:inline-flex">
                <span className="wg-live-dot size-1.5 rounded-full bg-emerald-500" aria-hidden />
                <span className="text-[12.5px] font-medium text-emerald-700">
                  <span className="tabular-nums">{liveListings.toLocaleString()}</span> live
                </span>
              </span>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(ICON_BTN, "hidden hover:bg-slate-100 sm:inline-flex")}
              onClick={() => setCmdOpen(true)}
              aria-label="Open command palette (⌘K)"
            >
              <Command className="size-4 text-slate-600" />
            </Button>

            <Button
              type="button"
              size="icon"
              className={cn(
                ICON_BTN,
                "hidden bg-red-600 text-white shadow-sm sm:inline-flex enabled:hover:bg-red-700 enabled:hover:shadow-sm",
              )}
              onClick={() => navigate("jobs")}
              aria-label="Quick action: explore jobs"
            >
              <Plus className="size-4 text-white" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(ICON_BTN, "relative hover:bg-slate-100")}
              aria-label={hasUnread ? "Notifications, unread" : "Notifications"}
            >
              <Bell className="size-4 text-slate-600" />
              {hasUnread ? (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
              ) : null}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full outline-none transition duration-200 hover:ring-2 hover:ring-white hover:ring-offset-2 hover:ring-offset-slate-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100"
                  aria-label="Account menu"
                >
                  <Avatar className="size-8">
                    {profile.photo_url ? (
                      <AvatarImage src={profile.photo_url} alt={profile.full_name || "Account"} />
                    ) : null}
                    <AvatarFallback className="bg-red-50 text-xs font-semibold text-red-700">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-56 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100"
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
