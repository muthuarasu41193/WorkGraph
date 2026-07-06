import type { Metadata } from "next";
import Link from "next/link";
import {
  AppShell,
  AppShellBody,
  AppShellContent,
  AppShellHeader,
  AppShellMain,
} from "@/components/layout/AppShell";
import { WorkGraphLogo } from "@/components/brand/WorkGraphLogo";
import VaultNavLinks from "@/components/vault/VaultNavLinks";
import WorkGraphProviders from "@/components/providers/WorkGraphProviders";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Interview Vault | WorkGraph",
  description: "Buy and sell real interview experiences from candidates who got the offer.",
};

export default function InterviewVaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkGraphProviders>
      <AppShell className="bg-background">
        <AppShellHeader className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4">
            <Link href="/interview-vault" className="flex shrink-0 items-center gap-2">
              <WorkGraphLogo className="h-7 w-auto" />
              <span className="hidden text-body font-semibold sm:inline">Interview Vault</span>
            </Link>
            <VaultNavLinks />
          </div>
        </AppShellHeader>

        <AppShellBody>
          <AppShellMain className="mx-auto w-full max-w-6xl">
            <AppShellContent>{children}</AppShellContent>
          </AppShellMain>
        </AppShellBody>
      </AppShell>
      <Toaster />
    </WorkGraphProviders>
  );
}
