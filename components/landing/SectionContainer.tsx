import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionContainerProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  as?: "section" | "div";
  ariaLabel?: string;
};

export function SectionContainer({
  children,
  className,
  id,
  as: Tag = "section",
  ariaLabel,
}: SectionContainerProps) {
  return (
    <Tag
      id={id}
      aria-label={ariaLabel}
      className={cn("px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24", className)}
    >
      <div className="mx-auto w-full max-w-landing">{children}</div>
    </Tag>
  );
}
