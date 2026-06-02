import type { Metadata } from "next";
import VaultNav from "@/components/vault/VaultNav";
import WorkGraphProviders from "@/components/providers/WorkGraphProviders";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Interview Vault | WorkGraph",
  description: "Buy and sell real interview experiences from candidates who got the offer.",
};

export default function InterviewVaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkGraphProviders>
      <div className="min-h-dvh bg-background">
        <VaultNav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </div>
      <Toaster />
    </WorkGraphProviders>
  );
}
