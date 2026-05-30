"use client";

import Link from "next/link";
import { Bell, Menu, Moon, Sun } from "lucide-react";
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
import GlobalSearch from "./GlobalSearch";
import SideNav from "./SideNav";
import { signOutClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDashboardContext } from "@/components/dashboard/DashboardProvider";
import { useState } from "react";

type Props = {
  sidebarCollapsed?: boolean;
  onToggleTheme?: () => void;
  isDark?: boolean;
};

export default function TopNav({ sidebarCollapsed, onToggleTheme, isDark }: Props) {
  const { profile, liveListings } = useDashboardContext();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials =
    profile.full_name
      ?.split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "WG";

  return (
    <header className="wg-dash-topnav sticky top-0 z-50 h-[60px] border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex h-full items-center gap-3 px-3 md:gap-4 md:px-5">
        {/* Logo + mobile menu */}
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

          <Link href="/profile" className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-sm font-bold text-white shadow-sm">
              WG
            </span>
            <span className="hidden font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:inline">
              WorkGraph
            </span>
          </Link>
        </div>

        {/* Search — desktop center, mobile below in flex-1 */}
        <div className={cn("mx-auto hidden max-w-xl flex-1 md:block", sidebarCollapsed && "max-w-2xl")}>
          <GlobalSearch />
        </div>

        <div className="flex flex-1 md:hidden">
          <GlobalSearch compact />
        </div>

        {/* Actions */}
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {liveListings > 0 ? (
            <Badge variant="secondary" className="hidden rounded-md px-2 py-0.5 text-[11px] font-semibold lg:inline-flex">
              {liveListings.toLocaleString()} live jobs
            </Badge>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative h-11 w-11"
            aria-label="Notifications"
            onClick={() => {
              /* placeholder — wire to real notifications later */
            }}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950" />
          </Button>

          {onToggleTheme ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden h-11 w-11 sm:inline-flex"
              onClick={onToggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Account menu"
              >
                <Avatar size="lg">
                  <AvatarFallback className="bg-blue-100 text-sm font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="font-medium">{profile.full_name || "Your account"}</p>
                <p className="text-xs font-normal text-muted-foreground">{profile.headline || "Job seeker"}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile?view=profile">Edit profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile?view=vault">Interview Vault</Link>
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
  );
}
