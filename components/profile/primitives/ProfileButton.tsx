"use client";

import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProfileButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "link" | "outline";

type ProfileButtonProps = Omit<ButtonProps, "variant"> & {
  variant?: ProfileButtonVariant;
  icon?: ReactNode;
};

const variantMap: Record<ProfileButtonVariant, ButtonProps["variant"]> = {
  primary: "primary",
  secondary: "secondary",
  ghost: "ghost",
  danger: "danger",
  success: "success",
  link: "link",
  outline: "secondary",
};

/** @deprecated Prefer Button from @/components/ui/button */
export default function ProfileButton({
  variant = "primary",
  children,
  icon,
  className,
  size = "md",
  ...props
}: ProfileButtonProps) {
  return (
    <Button
      variant={variantMap[variant]}
      size={size}
      className={cn(className)}
      {...props}
    >
      {icon}
      {children}
    </Button>
  );
}
