"use client";

import { Search } from "lucide-react";
import type { HiddenJobsFilters } from "@/hooks/use-hidden-jobs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type Props = {
  filters: HiddenJobsFilters;
  onChange: (patch: Partial<HiddenJobsFilters>) => void;
  className?: string;
};

const DATE_OPTIONS = [
  { label: "Any time", value: "" },
  { label: "Last 24 hours", value: "1" },
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
];

export default function HiddenDiscoveryFilters({ filters, onChange, className }: Props) {
  return (
    <div
      className={cn(
        "grid gap-[var(--layout-stack-tight)] rounded-[var(--radius-card)] border border-hairline bg-surface-raised p-[var(--layout-card-pad-mobile)] sm:grid-cols-2 lg:grid-cols-4 md:p-[var(--layout-card-pad)]",
        className,
      )}
    >
      <div className="space-y-[var(--space-2)] sm:col-span-2 lg:col-span-2">
        <Label htmlFor="hidden-jobs-search">Search</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-muted" />
          <Input
            id="hidden-jobs-search"
            placeholder="Title, company, skills…"
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-[var(--space-2)]">
        <Label>Country / region</Label>
        <Input
          placeholder="e.g. US, UK, Canada"
          value={filters.country}
          onChange={(e) => onChange({ country: e.target.value })}
        />
      </div>

      <div className="space-y-[var(--space-2)]">
        <Label>Date posted</Label>
        <Select
          value={filters.postedWithinDays ? String(filters.postedWithinDays) : "any"}
          onValueChange={(v) =>
            onChange({ postedWithinDays: v === "any" ? null : Number.parseInt(v, 10) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Any time" />
          </SelectTrigger>
          <SelectContent>
            {DATE_OPTIONS.map((opt) => (
              <SelectItem key={opt.label} value={opt.value || "any"}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col justify-end gap-[var(--space-3)] sm:col-span-2 lg:col-span-4 lg:flex-row lg:items-end lg:justify-between">
        <label className="flex cursor-pointer items-center gap-[var(--space-2)] text-role-body">
          <Checkbox
            checked={filters.remote}
            onCheckedChange={(checked) => onChange({ remote: checked === true })}
          />
          Remote only
        </label>
        <div className="w-full space-y-[var(--space-2)] sm:max-w-xs">
          <Label>Sort</Label>
          <Select
            value={filters.sort}
            onValueChange={(v) => onChange({ sort: v === "newest" ? "newest" : "relevant" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevant">Most Relevant</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
