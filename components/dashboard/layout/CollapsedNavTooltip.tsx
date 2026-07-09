"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const TOOLTIP_DELAY_MS = 400;

type Props = {
  label: string;
  enabled?: boolean;
  children: ReactNode;
};

export default function CollapsedNavTooltip({ label, enabled = true, children }: Props) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleEnter() {
    if (!enabled) return;
    timeoutRef.current = setTimeout(() => setVisible(true), TOOLTIP_DELAY_MS);
  }

  function handleLeave() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  }

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      {visible ? (
        <span className="wg-nav-tooltip" role="tooltip">
          {label}
        </span>
      ) : null}
    </div>
  );
}
