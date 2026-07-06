"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, Store } from "lucide-react";
import { WorkGraphLogo } from "@/components/brand/WorkGraphLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/interview-vault", label: "Marketplace", icon: Store },
  { href: "/interview-vault/sell", label: "Sell Experience", icon: PlusCircle },
  { href: "/interview-vault/dashboard", label: "Dashboard", icon: LayoutDashboard },
] as const;

export default function VaultNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/interview-vault" className="flex items-center gap-2 shrink-0">
          <WorkGraphLogo className="h-7 w-auto" />
          <span className="hidden text-body font-semibold sm:inline">Interview Vault</span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Interview Vault">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/interview-vault" && pathname.startsWith(href));
            return (
              <Button key={href} variant={active ? "secondary" : "ghost"} size="sm" asChild>
                <Link href={href} className={cn("gap-2", active && "font-medium")}>
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
