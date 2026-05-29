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
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200",
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
