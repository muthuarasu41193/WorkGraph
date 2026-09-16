import type { Metadata } from "next";
import VaultNav from "@/components/vault/VaultNav";
import WorkGraphProviders from "@/components/providers/WorkGraphProviders";
import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/layout/Footer";
import { routeShareMetadata } from "@/lib/seo";

const VAULT_TITLE = "Interview Vault | WorkGraph";
const VAULT_DESCRIPTION =
  "Buy and sell real interview experiences from candidates who got the offer.";
const share = routeShareMetadata("./");

export const metadata: Metadata = {
  title: VAULT_TITLE,
  description: VAULT_DESCRIPTION,
  alternates: share.alternates,
  openGraph: {
    title: VAULT_TITLE,
    description: VAULT_DESCRIPTION,
    url: share.openGraph?.url,
  },
  twitter: {
    ...share.twitter,
    title: VAULT_TITLE,
    description: VAULT_DESCRIPTION,
  },
};

export default function InterviewVaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkGraphProviders>
      <div className="min-h-dvh bg-background">
        <VaultNav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <Footer />
      </div>
      <Toaster />
    </WorkGraphProviders>
  );
}
