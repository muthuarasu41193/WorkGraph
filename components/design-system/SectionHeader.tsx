import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  eyebrow?: string;
  variant?: "default" | "bordered";
  className?: string;
};

export default function SectionHeader({
  title,
  description,
  action,
  icon: Icon,
  eyebrow,
  variant = "default",
  className,
}: SectionHeaderProps) {
  const bordered = variant === "bordered";

  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        bordered && "mb-5 border-b border-[var(--border-default)] pb-5 sm:mb-6",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow ? <p className="wg-label-mono">{eyebrow}</p> : null}
        <div className="flex items-center gap-3">
          {Icon ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] text-[var(--text-secondary)]">
              <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </span>
          ) : null}
          <h2 className="text-body-lg font-semibold tracking-tight text-[var(--text-primary)] sm:text-heading-s">
            {title}
          </h2>
        </div>
        {description ? (
          <p
            className={cn(
              "max-w-prose text-body text-[var(--text-secondary)]",
              bordered && Icon && "sm:pl-[2.625rem]",
              !bordered && "mt-0",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 sm:pb-1">{action}</div> : null}
    </header>
  );
}
