"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Building2, Plus, Radio, Users } from "lucide-react";
import { WorkGraphLogo } from "@/components/brand/WorkGraphLogo";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/employer/dashboard", label: "Signals", icon: Radio },
  { href: "/employer/dashboard?tab=inbox", label: "Pulse inbox", icon: Users },
  { href: "/employer/signals/new", label: "New signal", icon: Plus },
] as const;

type Props = {
  companyName?: string;
  children: ReactNode;
};

export default function EmployerShell({ companyName, children }: Props) {
  const pathname = usePathname();

  return (
    <AppShell className="bg-background">
      <AppShell.Header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-full max-w-[var(--container-wide)] items-center justify-between gap-4 px-[var(--page-padding-x)]">
          <div className="flex items-center gap-4">
            <Link href="/employer/dashboard" className="shrink-0">
              <WorkGraphLogo />
            </Link>
            <span className="hidden text-caption font-medium uppercase tracking-wider text-muted-foreground sm:inline">
              Employer
            </span>
          </div>
          <div className="flex items-center gap-2">
            {companyName ? (
              <span className="hidden items-center gap-2 text-body text-muted-foreground sm:flex">
                <Building2 className="h-4 w-4" aria-hidden />
                {companyName}
              </span>
            ) : null}
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile">Jobseeker view</Link>
            </Button>
          </div>
        </div>
      </AppShell.Header>

      <AppShell.Body className="mx-auto max-w-[var(--container-wide)] px-[var(--page-padding-x)] py-[var(--page-padding-y)]">
        <AppShell.Sidebar sticky={false} className="w-[var(--sidebar-width)] pr-6">
          <nav className="space-y-1" aria-label="Employer">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/employer/dashboard"
                  ? pathname === "/employer/dashboard"
                  : pathname.startsWith(item.href.split("?")[0]);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-[40px] items-center gap-2 rounded-lg px-3 py-2 text-body font-medium transition-colors",
                    active
                      ? "bg-brand-subtle text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <p className="mt-8 text-caption leading-relaxed text-muted-foreground">
            Hiring Signals are intent posts with fit criteria — not cloned job boards. Seekers connect with
            their WorkGraph profile, not a PDF portal.
          </p>
        </AppShell.Sidebar>

        <AppShell.Main padded={false}>
          <AppShell.Content scroll={false} constrained={false}>
            {children}
          </AppShell.Content>
        </AppShell.Main>
      </AppShell.Body>
      <Toaster />
    </AppShell>
  );
}
