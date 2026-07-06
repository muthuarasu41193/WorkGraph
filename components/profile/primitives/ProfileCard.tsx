"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProfileCardProps = {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  id?: string;
  /** No colored left accent (default is primary accent) */
  neutral?: boolean;
};

const paddingMap = {
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6",
};

export default function ProfileCard({
  children,
  className = "",
  padding = "md",
  id,
  neutral = false,
}: ProfileCardProps) {
  return (
    <Card
      id={id}
      className={cn(
        "wg-profile-card border-border shadow-sm transition-shadow hover:shadow-md",
        neutral ? "wg-profile-card--neutral border-l-border" : "border-l-primary border-l-[3px]",
        className
      )}
    >
      <CardContent className={cn("p-0", paddingMap[padding])}>{children}</CardContent>
    </Card>
  );
}
