"use client";

import SourceIcon from "@/components/icons/SourceIcon";
import { cn } from "@/lib/utils";
import type { JobSourceIconKey } from "@/lib/source-icons";

export type CommunitySourceFilter = "all" | "reddit" | "linkedin";

const CHIPS: {
  id: CommunitySourceFilter;
  label: string;
  iconSource?: JobSourceIconKey;
}[] = [
  { id: "all", label: "All" },
  { id: "reddit", label: "Reddit", iconSource: "reddit" },
  { id: "linkedin", label: "LinkedIn", iconSource: "linkedin" },
];

type Props = {
  value: CommunitySourceFilter;
  onChange: (next: CommunitySourceFilter) => void;
  className?: string;
};

export default function CommunitySourceFilterChips({ value, onChange, className }: Props) {
  return (
    <div
      className={cn("flex flex-wrap gap-[var(--space-2)]", className)}
      role="tablist"
      aria-label="Filter community posts by source"
    >
      {CHIPS.map((chip) => {
        const active = value === chip.id;
        return (
          <button
            key={chip.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(chip.id)}
            className={cn(
              "inline-flex h-8 items-center gap-[var(--space-2)] rounded-[var(--radius-control)] border px-[var(--space-3)] text-role-caption font-medium transition-colors",
              active
                ? "border-accent bg-accent-wash text-accent"
                : "border-hairline bg-surface-sunken text-ink-muted hover:bg-surface-raised hover:text-ink",
            )}
          >
            {chip.iconSource ? <SourceIcon source={chip.iconSource} size={14} /> : null}
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
