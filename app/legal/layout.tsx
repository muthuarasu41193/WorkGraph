/* LEGAL REVIEW REQUIRED — DO NOT SHIP WITHOUT COUNSEL SIGN-OFF. */

import Footer from "@/components/layout/Footer";
import { Logo } from "@/components/ui/Logo";
import { LegalNav } from "@/components/legal/LegalDocument";
import { getRealCounts } from "@/lib/social-proof";

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const counts = await getRealCounts();
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border-default bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <Logo />
          <LegalNav />
        </div>
      </header>
      <main>{children}</main>
      <Footer signups={counts.signups} />
    </div>
  );
}
