"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { CircleHelp, MoreHorizontal, Moon, Settings, Sun } from "lucide-react";
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

const HELP_URL = "mailto:support@workgraph.app?subject=WorkGraph%20Help%20%26%20Support";
const CMDK_HINT_DAYS = 7;

type Props = {
  collapsed?: boolean;
  onNavigate?: () => void;
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

function UtilityButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
    >
      {children}
    </button>
  );
}

export default function SidebarBottom({
  collapsed = false,
  onNavigate,
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
      <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
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
        <AvatarFallback className="bg-blue-50 text-xs font-medium text-blue-700">
          {getInitials(profile.full_name)}
        </AvatarFallback>
      </Avatar>
      <span
        className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500"
        aria-hidden
      />
    </span>
  );

  const utilityRow = (
    <div className={cn("flex items-center", collapsed ? "flex-col gap-1" : "justify-center gap-2")}>
      <UtilityButton label="Settings" onClick={goSettings}>
        <Settings className="h-4 w-4" strokeWidth={1.75} />
      </UtilityButton>
      <UtilityButton
        label="Help & Support"
        onClick={() => window.open(HELP_URL, "_blank", "noopener,noreferrer")}
      >
        <CircleHelp className="h-4 w-4" strokeWidth={1.75} />
      </UtilityButton>
      <UtilityButton
        label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        onClick={onToggleTheme}
      >
        <motion.span
          key={isDark ? "light" : "dark"}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="inline-flex"
        >
          {isDark ? (
            <Sun className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <Moon className="h-4 w-4" strokeWidth={1.75} />
          )}
        </motion.span>
      </UtilityButton>
    </div>
  );

  if (collapsed) {
    return (
      <div className="sidebar-bottom px-2 pb-2 pt-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="mx-auto flex rounded-full outline-none transition-colors duration-150 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-500/40"
              aria-label="Account menu"
            >
              {avatarNode}
            </button>
          </DropdownMenuTrigger>
          {userMenu}
        </DropdownMenu>
        <div className="mt-2">{utilityRow}</div>
      </div>
    );
  }

  return (
    <div className="sidebar-bottom px-3 pb-3 pt-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="group/user -mx-2 flex w-[calc(100%+16px)] items-center gap-2.5 rounded-lg p-2 text-left transition-colors duration-150 hover:bg-gray-50"
          >
            {avatarNode}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-gray-800">{displayName}</span>
              <span className="block truncate text-xs text-gray-400">{roleLabel}</span>
            </span>
            <MoreHorizontal
              className="h-4 w-4 shrink-0 text-gray-400 opacity-0 transition-opacity duration-150 group-hover/user:opacity-100"
              aria-hidden
            />
          </button>
        </DropdownMenuTrigger>
        {userMenu}
      </DropdownMenu>

      <div className="mt-2">{utilityRow}</div>

      {showCmdKHint ? (
        <p className="mt-2 text-center text-[10px] text-gray-300">
          Press {isMac ? "⌘K" : "Ctrl+K"} to search
        </p>
      ) : null}
    </div>
  );
}
