import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type SectionProps = React.ComponentProps<"section"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional text link shown opposite the title. */
  action?: { href: string; label: string };
  /** Accessible heading id when provided. */
  titleId?: string;
  /** Extra node beside the title (badges, live pills). */
  titleAddon?: React.ReactNode;
};

/**
 * Page section: title row + optional action, then content.
 * Title-to-content gap is 12px (--layout-section-title-gap).
 */
export function Section({
  title,
  description,
  action,
  titleId,
  titleAddon,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      data-slot="section"
      aria-labelledby={titleId}
      className={cn("flex flex-col gap-[var(--layout-section-title-gap)]", className)}
      {...props}
    >
      <div className="flex flex-wrap items-end justify-between gap-[var(--space-3)]">
        <div className="min-w-0 flex flex-col gap-[var(--layout-stack-tight)]">
          <div className="flex flex-wrap items-center gap-[var(--space-2)]">
            <h2 id={titleId} className="text-role-subheading text-ink">
              {title}
            </h2>
            {titleAddon}
          </div>
          {description ? (
            <p className="text-role-caption text-ink-muted">{description}</p>
          ) : null}
        </div>
        {action ? (
          <Link
            href={action.href}
            className="text-role-button shrink-0 text-accent transition-colors hover:underline underline-offset-4"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
