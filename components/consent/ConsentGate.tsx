"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  CONSENT_CHANGED_EVENT,
  readConsent,
  shouldLoadCategory,
  type ConsentCategory,
} from "@/lib/consent";

/**
 * Renders children only after the given optional category is granted.
 * Strictly necessary content may render immediately. Analytics and marketing
 * stay null until a current consent record grants that category.
 */
export function ConsentGate({
  category,
  children,
}: {
  category: ConsentCategory;
  children: ReactNode;
}) {
  const [allowed, setAllowed] = useState(() =>
    category === "strictlyNecessary" ? true : false,
  );

  useEffect(() => {
    const sync = () => setAllowed(shouldLoadCategory(readConsent(), category));
    sync();
    window.addEventListener(CONSENT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, sync);
  }, [category]);

  if (!allowed) return null;
  return <>{children}</>;
}
