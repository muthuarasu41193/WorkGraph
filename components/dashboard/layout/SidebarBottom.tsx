"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, HelpCircle, Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProfileTheme } from "@/components/profile/theme/ProfileThemeProvider";
import { signOutClient } from "@/lib/auth/client";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { useDashboardContext } from "@/components/dashboard/DashboardProvider";
import { cn } from "@/lib/utils";
import NavBenefitTooltip from "./NavBenefitTooltip";

const HELP_URL = "mailto:support@getworkgraph.com?subject=WorkGraph%20Help%20%26%20Support";
const CMDK_HINT_DAYS = 7;
const PROFILE_HINT = "Strengthen your presence";

type Props = {
  collapsed?: boolean;
  onNavigate?: () => void;
  profileSuccess?: boolean;
};

function getInitials(fullName: string | null): string {
  if (!fullName?.trim()) return "WG";
  return fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function shouldShowCmdKHint(createdAt: string | undefined): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  const ageMs = Date.now() - created;
  return ageMs >= 0 && ageMs < CMDK_HINT_DAYS * 24 * 60 * 60 * 1000;
}

export default function SidebarBottom({
  collapsed = false,
  onNavigate,
  profileSuccess = false,
}: Props) {
  const { profile } = useDashboardContext();
  const { navigate } = useDashboardNavigation();
  const { theme, toggle: onToggleTheme } = useProfileTheme();
  const router = useRouter();
  const [isMac, setIsMac] = useState(true);
  const isDark = theme === "dark";

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  const displayName = profile.full_name?.trim() || "Your account";
  const roleLabel = profile.headline?.trim() || "Job seeker";
  const showCmdKHint = useMemo(
    () => !collapsed && shouldShowCmdKHint(profile.created_at),
    [collapsed, profile.created_at],
  );

  function goSettings() {
    navigate("settings");
    onNavigate?.();
  }

  function goProfile() {
    navigate("profile");
    onNavigate?.();
  }

  async function handleSignOut() {
    await signOutClient();
    router.push("/login");
    router.refresh();
  }

  const userMenu = (
    <DropdownMenuContent align={collapsed ? "center" : "end"} side="top" className="w-52">
      <DropdownMenuItem onClick={goProfile}>View Profile</DropdownMenuItem>
      <DropdownMenuItem onClick={goSettings}>Account Settings</DropdownMenuItem>
      <DropdownMenuItem onClick={goSettings}>Billing</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => window.open(HELP_URL, "_blank", "noopener,noreferrer")}>
        <HelpCircle className="mr-2 size-4" strokeWidth={1.75} />
        Help & Support
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onToggleTheme}>
        {isDark ? (
          <Sun className="mr-2 size-4" strokeWidth={1.75} />
        ) : (
          <Moon className="mr-2 size-4" strokeWidth={1.75} />
        )}
        {isDark ? "Light mode" : "Dark mode"}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleSignOut} className="text-slate-600 focus:text-slate-800">
        Sign Out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  const avatarNode = (
    <span className="relative shrink-0">
      <Avatar className="size-[34px]">
        {profile.photo_url ? (
          <AvatarImage src={profile.photo_url} alt={displayName} />
        ) : null}
        <AvatarFallback className="bg-slate-100 text-xs font-medium text-slate-700">
          {getInitials(profile.full_name)}
        </AvatarFallback>
      </Avatar>
      {profileSuccess ? (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-2 ring-white"
          aria-label="Profile updated"
        >
          <Check className="size-2.5" strokeWidth={2.5} />
        </span>
      ) : (
        <span className="wg-sidenav-online" aria-hidden />
      )}
    </span>
  );

  if (collapsed) {
    return (
      <div className="sidebar-bottom px-2 pb-1 pt-2">
        <NavBenefitTooltip hint={PROFILE_HINT}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="mx-auto flex rounded-full outline-none transition-colors duration-150 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand-200"
                aria-label="Profile — Strengthen your presence"
              >
                {avatarNode}
              </button>
            </DropdownMenuTrigger>
            {userMenu}
          </DropdownMenu>
        </NavBenefitTooltip>
      </div>
    );
  }

  return (
    <div className="sidebar-bottom">
      <NavBenefitTooltip hint={PROFILE_HINT}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="wg-sidenav-profile group/user"
              aria-label="Profile — Strengthen your presence"
            >
              {avatarNode}
              <span className="min-w-0 flex-1">
                <span className="wg-sidenav-profile__name">{displayName}</span>
                <span className="wg-sidenav-profile__role">{roleLabel}</span>
              </span>
              <ChevronRight
                className={cn("nav-icon", "wg-sidenav-profile__chevron")}
                strokeWidth={1.75}
                aria-hidden
              />
            </button>
          </DropdownMenuTrigger>
          {userMenu}
        </DropdownMenu>
      </NavBenefitTooltip>

      {showCmdKHint ? (
        <p className="mt-1.5 px-2 text-center text-[11px] text-slate-300">
          Press {isMac ? "⌘K" : "Ctrl+K"} to search
        </p>
      ) : null}
    </div>
  );
}
