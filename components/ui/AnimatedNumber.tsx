"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type AnimatedNumberProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
  /** Start counting immediately (e.g. hero mockup) instead of waiting for viewport */
  immediate?: boolean;
};

function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

export function AnimatedNumber({
  value,
  suffix = "",
  prefix = "",
  duration = 1.6,
  className,
  immediate = false,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(prefersReducedMotion ? value : 0);
  const shouldAnimate = immediate || inView;

  useEffect(() => {
    if (!shouldAnimate) return;

    if (prefersReducedMotion) {
      setDisplay(value);
      return;
    }

    const startTime = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [shouldAnimate, value, duration, prefersReducedMotion]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {formatNumber(display)}
      {suffix}
    </span>
  );
}
