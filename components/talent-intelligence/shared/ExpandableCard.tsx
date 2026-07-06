"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <CardHeader className="pb-2">
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full items-start justify-between gap-3 px-0 py-0 text-left shadow-none hover:bg-transparent"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-heading-s">
              {icon}
              {title}
            </CardTitle>
            {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
          </div>
          <span className="mt-1 shrink-0 text-muted-foreground" aria-hidden>
            {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </span>
        </Button>
      </CardHeader>
      {open ? <CardContent className="pt-0">{children}</CardContent> : null}
    </Card>
  );
}
