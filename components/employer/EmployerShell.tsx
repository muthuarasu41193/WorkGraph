"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Building2, LayoutDashboard, Plus, Radio, Users } from "lucide-react";
import { WorkGraphLogo } from "@/components/brand/WorkGraphLogo";
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
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-[var(--header-height)] max-w-[var(--container-wide)] items-center justify-between gap-4 px-[var(--page-padding-x)]">
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
      </header>

      <div className="mx-auto flex max-w-[var(--container-wide)] gap-0 px-[var(--page-padding-x)] py-[var(--page-padding-y)]">
        <aside className="hidden w-[var(--sidebar-width)] shrink-0 pr-6 md:block">
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
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
