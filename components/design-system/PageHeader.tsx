"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export type PageHeaderBreadcrumb = {
  label: string;
  href?: string;
};

export type PageHeaderMetric = {
  label: string;
  value: string | number;
  accent?: boolean;
};

export type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  icon?: ReactNode;
  breadcrumbs?: PageHeaderBreadcrumb[];
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  metrics?: PageHeaderMetric[];
  footer?: ReactNode;
  /** Pin above scrollable content in AppShell.Page layouts. */
  pinned?: boolean;
  /** Stick below app chrome while scrolling. */
  sticky?: boolean;
  /** Horizontal padding; defaults to false when pinned, true when inline. */
  padding?: boolean;
  /** Center-align the title block (e.g. upload flows). */
  centered?: boolean;
  className?: string;
};

function PageHeaderMetrics({
  metrics,
  centered,
}: {
  metrics: PageHeaderMetric[];
  centered?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", centered && "justify-center")}>
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-body",
            metric.accent
              ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
              : "bg-surface-primary ring-1 ring-[var(--border-default)]",
          )}
        >
          <span className="font-semibold tabular-nums">{metric.value}</span>
          <span className="text-[var(--text-secondary)]">{metric.label}</span>
        </div>
      ))}
    </div>
  );
}

function PageHeaderBreadcrumbs({ items }: { items: PageHeaderBreadcrumb[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function PageHeaderContent({
  title,
  subtitle,
  eyebrow,
  icon,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  metrics,
  footer,
  centered,
  className,
}: Omit<PageHeaderProps, "pinned" | "sticky" | "padding">) {
  const hasActions = Boolean(primaryAction || secondaryActions);

  return (
    <header className={cn("wg-page-header wg-section-fade space-y-4", centered && "text-center", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? <PageHeaderBreadcrumbs items={breadcrumbs} /> : null}

      <div
        className={cn(
          "flex flex-col gap-4",
          centered ? "items-center" : "sm:flex-row sm:items-start sm:justify-between",
        )}
      >
        <div className={cn("min-w-0 space-y-2", centered && "max-w-2xl")}>
          {eyebrow ? (
            <p className="text-body font-medium text-[var(--text-secondary)]">{eyebrow}</p>
          ) : null}
          <div
            className={cn(
              "flex gap-2.5",
              centered ? "flex-col items-center" : "items-center",
            )}
          >
            {icon ? <span className="shrink-0 text-[var(--accent)] [&_svg]:h-7 [&_svg]:w-7">{icon}</span> : null}
            <h1 className="text-heading-l text-[var(--text-primary)] sm:text-heading-xl">{title}</h1>
          </div>
          {subtitle ? (
            <div
              className={cn(
                "text-body text-[var(--text-secondary)]",
                !centered && "max-w-2xl",
                centered && "text-pretty",
              )}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        {hasActions ? (
          <div
            className={cn(
              "flex shrink-0 flex-wrap items-center gap-2",
              centered ? "justify-center" : "sm:pt-1",
            )}
          >
            {secondaryActions}
            {primaryAction}
          </div>
        ) : null}
      </div>

      {metrics && metrics.length > 0 ? (
        <PageHeaderMetrics metrics={metrics} centered={centered} />
      ) : null}

      {footer}
    </header>
  );
}

export default function PageHeader({
  pinned = false,
  sticky = true,
  padding,
  className,
  ...props
}: PageHeaderProps) {
  const content = <PageHeaderContent {...props} className={pinned ? className : undefined} />;
  const shellPadding = padding ?? !pinned;

  const shell = (
    <div
      className={cn(
        pinned && "wg-app-shell-page-header flex-shrink-0",
        !pinned && sticky && "wg-app-shell-page-header wg-app-shell-page-header--sticky",
        shellPadding && pinned && "px-4 py-5 sm:px-6 md:px-8",
        shellPadding &&
          !pinned &&
          "-mx-4 px-4 py-5 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8",
        !sticky && !pinned && shellPadding && "py-5",
        pinned && sticky && "wg-app-shell-page-header--sticky",
        className,
      )}
    >
      {content}
    </div>
  );

  return shell;
}
