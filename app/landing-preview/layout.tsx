import type { ReactNode } from "react";

/** Preview alias layout — redirects to `/`. */
export default function LandingPreviewLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
