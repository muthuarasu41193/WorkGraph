"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type ProfileCardProps = {
  children: ReactNode;
  className?: string;
  /** Subtle hover lift for interactive cards */
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
  id?: string;
};

const paddingMap = {
  sm: "p-4 sm:p-5",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export default function ProfileCard({
  children,
  className = "",
  hover = false,
  padding = "md",
  id,
}: ProfileCardProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={[
        "rounded-2xl border border-[var(--wg-color-border)] bg-[var(--wg-color-surface)]",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]",
        "dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_12px_32px_-16px_rgba(0,0,0,0.45)]",
        paddingMap[padding],
        className,
      ].join(" ")}
    >
      {children}
    </motion.section>
  );
}
