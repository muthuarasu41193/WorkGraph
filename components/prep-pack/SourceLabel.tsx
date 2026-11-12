import { PREP_SOURCE_LABELS, type PrepSourceKind } from "@/lib/prep-pack";
import { cn } from "@/lib/utils";

const STYLES: Record<PrepSourceKind, string> = {
  job_description: "border-hairline bg-surface text-ink-muted",
  role_template: "border-hairline bg-surface text-ink-muted",
  firsthand_guide: "border-brand/30 bg-brand/5 text-brand",
  estimate: "border-caution/30 bg-caution/5 text-ink-muted",
};

export function SourceLabel({
  source,
  className,
}: {
  source: PrepSourceKind;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-[var(--radius-tag)] border px-2 py-0.5 text-role-caption",
        STYLES[source],
        className,
      )}
    >
      {PREP_SOURCE_LABELS[source]}
    </span>
  );
}
