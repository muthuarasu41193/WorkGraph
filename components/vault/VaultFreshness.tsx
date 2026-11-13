"use client";

import { cn } from "@/lib/utils";

type Props = {
  lastConfirmedLabel: string;
  stale: boolean;
  staleLabel?: string | null;
  className?: string;
};

/** Displays last-confirmed freshness without using the word "verified". */
export default function VaultFreshness({
  lastConfirmedLabel,
  stale,
  staleLabel,
  className,
}: Props) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      <span>{lastConfirmedLabel}</span>
      {stale && staleLabel ? (
        <>
          <span aria-hidden="true"> · </span>
          <span className="font-medium text-caution" role="status">
            {staleLabel}
          </span>
        </>
      ) : null}
    </p>
  );
}
