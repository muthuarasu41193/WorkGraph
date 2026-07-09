"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const TOOLTIP_DELAY_MS = 400;

type Props = {
  label: string;
  hint?: string;
  enabled?: boolean;
  children: ReactNode;
};

export default function CollapsedNavTooltip({ label, hint, enabled = true, children }: Props) {
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
          {hint ? (
            <>
              <span className="block font-medium">{label}</span>
              <span className="mt-0.5 block text-[11px] font-normal text-slate-300">{hint}</span>
            </>
          ) : (
            label
          )}
        </span>
      ) : null}
    </div>
  );
}
