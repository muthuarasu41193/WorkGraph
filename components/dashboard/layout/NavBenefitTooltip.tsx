"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const HINT_DELAY_MS = 280;

type Props = {
  hint?: string;
  children: ReactNode;
};

/** Benefit micro-copy on hover — reduces anxiety, builds excitement. */
export default function NavBenefitTooltip({ hint, children }: Props) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!hint) return <>{children}</>;

  function handleEnter() {
    timeoutRef.current = setTimeout(() => setVisible(true), HINT_DELAY_MS);
  }

  function handleLeave() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  }

  return (
    <div className="relative w-full" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      {visible ? (
        <span className="wg-nav-benefit-hint" role="tooltip">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
