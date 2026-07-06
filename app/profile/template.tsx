"use client";

import { motion } from "@/lib/motion";

/** Subtle page enter for profile sub-routes — shell chrome stays static. */
export default function ProfileTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={motion.pageEnter}>{children}</div>;
}
