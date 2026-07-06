"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProfileCardProps = {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  id?: string;
  neutral?: boolean;
};

const paddingMap = {
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6",
};

/** @deprecated Import { Card } from "@/components/ui/card" with variant="profile" */
export default function ProfileCard({
  children,
  className = "",
  padding = "md",
  id,
  neutral = false,
}: ProfileCardProps) {
  return (
    <Card id={id} variant="profile" neutral={neutral} className={cn("shadow-sm hover:shadow-md", className)}>
      <CardContent className={cn("p-0", paddingMap[padding])}>{children}</CardContent>
    </Card>
  );
}
