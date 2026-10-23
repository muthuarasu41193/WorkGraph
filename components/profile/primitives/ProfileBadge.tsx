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
  success: "border-positive-wash bg-positive-wash text-positive   ",
  warning: "border-caution-wash bg-caution-wash text-caution   ",
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
