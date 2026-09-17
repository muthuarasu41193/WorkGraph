"use client";

import { ConsentManager } from "@/components/consent/ConsentManager";
import { OptionalThirdPartyScripts } from "@/components/consent/OptionalThirdPartyScripts";
import { BackToTop } from "@/components/ui/BackToTop";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

export function PageShell() {
  return (
    <>
      <ScrollProgress />
      <BackToTop />
      <ConsentManager />
      <OptionalThirdPartyScripts />
    </>
  );
}
