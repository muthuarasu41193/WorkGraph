"use client";

import { BackToTop } from "@/components/ui/BackToTop";
import { CookieBanner } from "@/components/ui/CookieBanner";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

export function PageShell() {
  return (
    <>
      <ScrollProgress />
      <BackToTop />
      <CookieBanner />
    </>
  );
}
