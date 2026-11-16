"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Brain,
  Briefcase,
  ClipboardList,
  LayoutDashboard,
  Radar,
  Search,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { DashboardRouteId } from "@/lib/dashboard-routes";

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  group: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (route: DashboardRouteId) => void;
  onSearch?: (query: string) => void;
};

export default function CommandPalette({ open, onOpenChange, onNavigate, onSearch }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const items: CommandItem[] = [
    {
      id: "home",
      label: "Dashboard",
      description: "Career intelligence overview",
      icon: LayoutDashboard,
      group: "Navigate",
      action: () => {
        onNavigate("home");
        onOpenChange(false);
      },
    },
    {
      id: "jobs",
      label: "Jobs",
      icon: Briefcase,
      group: "Navigate",
      action: () => {
        onNavigate("jobs");
        onOpenChange(false);
      },
    },
    {
      id: "job-discovery",
      label: "Community posts",
      icon: Radar,
      group: "Navigate",
      action: () => {
        onNavigate("job-discovery");
        onOpenChange(false);
      },
    },
    {
      id: "resume-intelligence",
      label: "Resume Intelligence",
      icon: Brain,
      group: "Intelligence",
      action: () => {
        onNavigate("resume-intelligence");
        onOpenChange(false);
      },
    },
    {
      id: "applications",
      label: "Applications",
      icon: ClipboardList,
      group: "Intelligence",
      action: () => {
        onNavigate("applications");
        onOpenChange(false);
      },
    },
    {
      id: "workgraph-direct",
      label: "Career Intelligence",
      icon: Sparkles,
      group: "Intelligence",
      action: () => {
        onNavigate("workgraph-direct");
        onOpenChange(false);
      },
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      group: "Account",
      action: () => {
        onNavigate("profile");
        onOpenChange(false);
      },
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      group: "Account",
      action: () => {
        onNavigate("settings");
        onOpenChange(false);
      },
    },
    {
      id: "interview-vault",
      label: "Interview Vault",
      icon: Briefcase,
      group: "External",
      action: () => {
        router.push("/interview-vault");
        onOpenChange(false);
      },
    },
  ];

  const groups = [...new Set(items.map((i) => i.group))];

  useEffect(() => {
    if (query.trim() && onSearch) onSearch(query);
  }, [query, onSearch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Command palette</DialogTitle>
        </DialogHeader>
        <Command
          className="bg-surface-raised text-ink"
          label="Command palette"
          loop
        >
          <div className="relative border-b border-hairline px-4 py-3">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
              aria-hidden
            />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search commands, pages, jobs..."
              className="h-11 w-full border-0 bg-transparent pl-7 pr-12 text-role-body text-ink outline-none placeholder:text-ink-subtle"
            />
            <kbd className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-control border border-hairline bg-surface-sunken px-1.5 py-0.5 text-role-caption font-medium text-ink-muted sm:inline">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="flex flex-col items-center px-3 py-8 text-center">
              <Search className="mb-2 size-6 text-ink-subtle" aria-hidden />
              <p className="text-sm font-medium text-ink">No results</p>
              <p className="mt-0.5 text-role-caption text-ink-subtle">
                Nothing matches &ldquo;{query}&rdquo;. Try another search.
              </p>
            </Command.Empty>
            {groups.map((group) => (
              <Command.Group
                key={group}
                heading={group}
                className="mb-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-ink-subtle"
              >
                {items
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <Command.Item
                        key={item.id}
                        value={`${item.label} ${item.description ?? ""} ${item.group}`}
                        onSelect={() => item.action()}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-3 rounded-control px-3 py-2.5 text-left text-sm outline-none",
                          "data-[selected=true]:bg-surface-sunken",
                        )}
                      >
                        <Icon className={iconClass("inline", "shrink-0 text-ink-subtle")} />
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{item.label}</p>
                          {item.description ? (
                            <p className="truncate text-xs text-ink-subtle">{item.description}</p>
                          ) : null}
                        </div>
                      </Command.Item>
                    );
                  })}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen, toggle };
}
