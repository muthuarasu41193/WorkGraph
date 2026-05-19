"use client";

import { motion } from "framer-motion";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={["rounded-xl wg-skeleton-shimmer", className].join(" ")}
    />
  );
}

export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3 rounded-2xl border border-[var(--wg-color-border)] bg-[var(--wg-color-surface)] p-6"
    >
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-24 w-full" />
    </motion.div>
  );
}
