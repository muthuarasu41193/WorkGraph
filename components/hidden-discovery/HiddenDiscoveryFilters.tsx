"use client";

import { Search } from "lucide-react";
import type { HiddenJobsFilters } from "@/hooks/use-hidden-jobs";
import { HIDDEN_OPPORTUNITY_SOURCES } from "@/lib/hidden-opportunities/types";
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
        "grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5",
        className,
      )}
    >
      <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
        <Label htmlFor="hidden-jobs-search">Search</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="hidden-jobs-search"
            placeholder="Title, company, skills…"
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Source</Label>
        <Select
          value={filters.source || "all"}
          onValueChange={(v) => onChange({ source: v === "all" ? "" : (v as HiddenJobsFilters["source"]) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {HIDDEN_OPPORTUNITY_SOURCES.map((src) => (
              <SelectItem key={src} value={src}>
                {src}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Country / region</Label>
        <Input
          placeholder="e.g. US, UK, Canada"
          value={filters.country}
          onChange={(e) => onChange({ country: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
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

      <div className="flex flex-col justify-end gap-3 sm:col-span-2 lg:col-span-1">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={filters.remote}
            onCheckedChange={(checked) => onChange({ remote: checked === true })}
          />
          Remote only
        </label>
        <div className="space-y-1.5">
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
