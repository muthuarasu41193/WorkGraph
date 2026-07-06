"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "info" | "muted";

const toneVariants: Record<Tone, React.ComponentProps<typeof Badge>["variant"]> = {
  default: "secondary",
  success: "default",
  warning: "outline",
  info: "outline",
  muted: "outline",
};

const toneStyles: Record<Tone, string> = {
  default: "",
  success: "border-success/20 bg-success-subtle text-success-foreground dark:border-success/20 dark:bg-success-subtle/40 dark:text-success",
  warning: "border-warning/20 bg-warning-subtle text-warning-foreground dark:border-warning/20 dark:bg-warning-subtle/40 dark:text-warning-foreground",
  info: "border-border bg-muted text-foreground",
  muted: "text-muted-foreground",
};

export default function ProfileBadge({
  children,
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <Badge variant={toneVariants[tone]} className={cn(toneStyles[tone], className)}>
      {children}
    </Badge>
  );
}
