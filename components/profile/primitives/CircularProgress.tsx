"use client";

import { motion } from "framer-motion";

type CircularProgressProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
};

export default function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  label,
  sublabel,
}: CircularProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <motion.div
      className="relative inline-flex flex-col items-center justify-center"
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--wg-color-border)"
          strokeWidth={strokeWidth}
          opacity={0.35}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--wg-color-primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-2xl font-bold tabular-nums tracking-tight text-[var(--wg-color-text-primary)]">
          {Math.round(clamped)}%
        </span>
        {label ? (
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--wg-color-text-tertiary)]">
            {label}
          </span>
        ) : null}
      </motion.div>
      {sublabel ? (
        <p className="mt-2 max-w-[8rem] text-center text-xs text-[var(--wg-color-text-secondary)]">{sublabel}</p>
      ) : null}
    </motion.div>
  );
}
