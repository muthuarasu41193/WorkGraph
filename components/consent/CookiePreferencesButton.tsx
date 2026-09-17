"use client";

import { openConsentManager } from "@/lib/consent";
import { cn } from "@/lib/utils";

export function CookiePreferencesButton({
  className,
  children = "Cookie preferences",
}: {
  className?: string;
  children?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => openConsentManager()}
      className={cn(
        "inline-flex items-center text-sm text-fg-tertiary underline-offset-4 transition-colors hover:text-brand hover:underline",
        className,
      )}
    >
      {children}
    </button>
  );
}
