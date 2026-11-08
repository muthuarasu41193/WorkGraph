"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

export default function ExpandableCard({
  title,
  description,
  icon,
  defaultOpen = true,
  children,
  className,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={cn("wg-dash-section-card", className)}>
      <CardHeader className="pb-[var(--space-2)]">
        <button
          type="button"
          className="flex w-full items-start justify-between gap-[var(--space-3)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
        >
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-[var(--space-2)]">
              {icon}
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className="mt-[var(--space-1)]">{description}</CardDescription>
            ) : null}
          </div>
          <span className="mt-[var(--space-1)] shrink-0 text-muted-foreground" aria-hidden>
            {open ? <ChevronUp className={iconClass()} /> : <ChevronDown className={iconClass()} />}
          </span>
        </button>
      </CardHeader>
      {open ? <CardContent className="pt-0">{children}</CardContent> : null}
    </Card>
  );
}
