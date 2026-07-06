"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "info" | "muted";

const toneVariants: Record<Tone, React.ComponentProps<typeof Badge>["variant"]> = {
  default: "secondary",
  success: "success",
  warning: "warning",
  info: "info",
  muted: "muted",
};

/** @deprecated Import { Badge } from "@/components/ui/badge" with variant prop */
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
    <Badge variant={toneVariants[tone]} className={cn(className)}>
      {children}
    </Badge>
  );
}
