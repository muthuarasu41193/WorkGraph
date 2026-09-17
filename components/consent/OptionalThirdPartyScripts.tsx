"use client";

import { ConsentGate } from "@/components/consent/ConsentGate";

/**
 * Single mount point for non-essential third-party tags.
 * Add scripts inside the matching ConsentGate only — they must not load
 * until that category is stored as granted.
 */
export function OptionalThirdPartyScripts() {
  return (
    <>
      <ConsentGate category="analytics">{null}</ConsentGate>
      <ConsentGate category="marketing">{null}</ConsentGate>
    </>
  );
}
