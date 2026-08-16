import type { SourceBrand } from "@/lib/brands";
import { SOURCE_LABELS } from "@/lib/brands";
import { SourceBrandIcon } from "@/components/brand/brand-icons";
import { cn } from "@/lib/utils";

const SOURCE_COLORS: Record<SourceBrand, string> = {
  reddit: "text-[#FF4500]",
  discord: "text-[#5865F2]",
  x: "text-fg-primary",
  slack: "text-[#4A154B]",
  linkedin: "text-[#0A66C2]",
  github: "text-[#24292F]",
};

type SourceBadgeProps = {
  source: SourceBrand;
  className?: string;
  compact?: boolean;
};

export function SourceBadge({ source, className, compact }: SourceBadgeProps) {
  const label = SOURCE_LABELS[source];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border-default bg-surface font-medium text-fg-secondary",
        compact ? "px-1.5 py-0.5 text-xs" : "px-2 py-0.5 text-xs",
        className,
      )}
    >
      <SourceBrandIcon
        brand={source}
        className={cn(compact ? "size-3" : "size-3.5", SOURCE_COLORS[source])}
      />
      {label}
    </span>
  );
}
