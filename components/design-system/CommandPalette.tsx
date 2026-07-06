"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
      label: "Job Discovery",
      icon: Briefcase,
      group: "Navigate",
      action: () => {
        onNavigate("jobs");
        onOpenChange(false);
      },
    },
    {
      id: "job-discovery",
      label: "Hidden Jobs",
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

  const filtered = query.trim()
    ? items.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  const groups = [...new Set(filtered.map((i) => i.group))];

  useEffect(() => {
    if (query.trim() && onSearch) onSearch(query);
  }, [query, onSearch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="sr-only">Command palette</DialogTitle>
          <div className="relative">
            <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands, pages, jobs..."
              className="border-0 bg-transparent pl-8 shadow-none focus-visible:ring-0"
              autoFocus
            />
            <kbd className="absolute right-0 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-2 py-1 text-caption font-medium sm:inline">
              ESC
            </kbd>
          </div>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto p-2">
          {groups.map((group) => (
            <div key={group} className="mb-2">
              <p className="px-2 py-2 text-caption font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {group}
              </p>
              {filtered
                .filter((item) => item.group === group)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.action}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-body transition-colors",
                        "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--text-primary)]">{item.label}</p>
                        {item.description ? (
                          <p className="truncate text-caption text-[var(--text-secondary)]">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
            </div>
          ))}
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-body text-[var(--text-secondary)]">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : null}
        </div>
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
