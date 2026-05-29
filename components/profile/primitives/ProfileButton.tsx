"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline";

type ProfileButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: ReactNode;
  size?: React.ComponentProps<typeof Button>["size"];
};

const variantMap: Record<Variant, React.ComponentProps<typeof Button>["variant"]> = {
  primary: "default",
  secondary: "secondary",
  ghost: "ghost",
  outline: "outline",
};

export default function ProfileButton({
  variant = "primary",
  children,
  icon,
  className = "",
  size = "default",
  ...props
}: ProfileButtonProps) {
  return (
    <Button
      variant={variantMap[variant]}
      size={size}
      className={cn("font-semibold transition-shadow hover:shadow-sm", className)}
      {...props}
    >
      {icon}
      {children}
    </Button>
  );
}
