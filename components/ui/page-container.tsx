import * as React from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = React.ComponentProps<"div"> & {
  /** Vertical rhythm between page sections (default 32px). */
  gap?: "section" | "none";
};

/**
 * Centered page content shell: max-width 1120px, horizontal pad 32px (16px mobile).
 */
export function PageContainer({
  className,
  gap = "section",
  ...props
}: PageContainerProps) {
  return (
    <div
      data-slot="page-container"
      className={cn(
        "mx-auto w-full min-w-0",
        "max-w-[var(--layout-page-max)]",
        "px-[var(--layout-page-pad-mobile)] md:px-[var(--layout-page-pad)]",
        gap === "section" && "flex flex-col gap-[var(--layout-section-gap)]",
        className,
      )}
      {...props}
    />
  );
}
