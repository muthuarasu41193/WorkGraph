import type { ReactNode } from "react";

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "none";
  duration?: number;
};

/** Kept so existing sections can render. Scroll-triggered motion is not used. */
export function FadeIn({ children, className }: FadeInProps) {
  return <div className={className}>{children}</div>;
}
