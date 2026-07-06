"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/interview-vault", label: "Marketplace", icon: Store },
  { href: "/interview-vault/sell", label: "Sell Experience", icon: PlusCircle },
  { href: "/interview-vault/dashboard", label: "Dashboard", icon: LayoutDashboard },
] as const;

export default function VaultNavLinks() {
  const pathname = usePathname();

  return (
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
  );
}
