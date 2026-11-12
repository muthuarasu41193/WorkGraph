import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "WorkGraph landing preview",
  description:
    "Isolated Stiro-inspired landing preview for WorkGraph. Search the live job index.",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Minimal chrome for the landing redesign preview.
 * Intentionally outside `(marketing)` so the live homepage chrome is untouched.
 */
export default function LandingPreviewLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
