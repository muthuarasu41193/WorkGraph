"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { NAV_ITEMS } from "@/lib/constants";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { useLandingHeader } from "./LandingHeaderContext";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DASHBOARD_MQ } from "@/lib/dashboard-responsive";

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div className="relative size-5" aria-hidden>
      <motion.span
        className="absolute left-0 block h-0.5 w-5 rounded-full bg-current"
        animate={open ? { top: 9, rotate: 45 } : { top: 4, rotate: 0 }}
        transition={{ duration: 0.2 }}
        style={{ transformOrigin: "center" }}
      />
      <motion.span
        className="absolute left-0 top-[9px] block h-0.5 w-5 rounded-full bg-current"
        animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.15 }}
      />
      <motion.span
        className="absolute left-0 block h-0.5 w-5 rounded-full bg-current"
        animate={open ? { top: 9, rotate: -45 } : { top: 14, rotate: 0 }}
        transition={{ duration: 0.2 }}
        style={{ transformOrigin: "center" }}
      />
    </div>
  );
}

function NavLink({
  href,
  label,
  active,
  index,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  index: number;
  onNavigate: (href: string) => void;
}) {
  const isHash = href.startsWith("#");

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={href}
        onClick={(e) => {
          if (isHash) {
            e.preventDefault();
            onNavigate(href);
          }
        }}
        className={cn(
          "relative text-sm font-medium transition-colors",
          active
            ? "text-fg-primary dark:text-white"
            : "text-fg-secondary hover:text-fg-primary dark:text-slate-400 dark:hover:text-white",
        )}
        aria-current={active ? "page" : undefined}
      >
        {label}
        {active && (
          <motion.span
            layoutId="nav-active-indicator"
            className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-brand"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </Link>
    </motion.li>
  );
}

export default function Navbar() {
  const { scrolled } = useScrollPosition({ threshold: 12 });
  const prefersReducedMotion = useReducedMotion();
  const { headerOffset } = useLandingHeader();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const isMdUp = useMediaQuery(DASHBOARD_MQ.mdUp);

  useEffect(() => {
    const sectionIds = NAV_ITEMS.filter((item) => item.href.startsWith("#")).map((item) =>
      item.href.slice(1),
    );

    const observers = sectionIds
      .map((id) => {
        const element = document.getElementById(id);
        if (!element) return null;

        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) setActiveSection(id);
          },
          { rootMargin: "-30% 0px -55% 0px", threshold: 0 },
        );

        observer.observe(element);
        return observer;
      })
      .filter(Boolean) as IntersectionObserver[];

    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (isMdUp) setMobileOpen(false);
  }, [isMdUp]);

  const handleNavigate = useCallback((href: string) => {
    if (href.startsWith("#")) {
      const target = document.querySelector(href);
      target?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
      setActiveSection(href.slice(1));
    }
    setMobileOpen(false);
  }, [prefersReducedMotion]);

  return (
    <>
        <nav
          aria-label="Main navigation"
          className={cn(
            "h-16 transition-all duration-300 ease-in-out",
            scrolled
              ? "border-b border-border-default/80 bg-surface/90 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90"
              : "border-b border-transparent bg-transparent",
          )}
        >
            <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 md:px-6 min-[1025px]:px-8">
            <Logo />

            <ul className="hidden items-center gap-8 md:flex" role="list">
              {NAV_ITEMS.map((item, index) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  active={
                    item.href.startsWith("#")
                      ? activeSection === item.href.slice(1)
                      : false
                  }
                  index={index}
                  onNavigate={handleNavigate}
                />
              ))}
            </ul>

            <div className="hidden items-center gap-3 md:flex">
              <Button
                variant="ghost"
                size="sm"
                className="text-fg-secondary hover:text-fg-primary"
                asChild
              >
                <Link href="/login">Sign in</Link>
              </Button>
              <Button
                size="sm"
                className="h-10 rounded-full bg-brand px-5 text-white hover:bg-brand-700"
                asChild
              >
                <Link href="/signup">Get early access</Link>
              </Button>
            </div>

            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-lg text-fg-primary transition-colors hover:bg-black/5 md:hidden dark:text-white dark:hover:bg-surface/10"
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              <HamburgerIcon open={mobileOpen} />
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-label="Mobile navigation"
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: `calc(100dvh - ${headerOffset}px)`,
                opacity: 1,
              }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-border-default bg-surface md:hidden dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex h-full flex-col px-4 py-6 sm:px-6">
                <ul className="flex flex-col gap-1" role="list">
                  {NAV_ITEMS.map((item, index) => (
                    <motion.li
                      key={item.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <Link
                        href={item.href}
                        onClick={(e) => {
                          if (item.href.startsWith("#")) {
                            e.preventDefault();
                            handleNavigate(item.href);
                          } else {
                            setMobileOpen(false);
                          }
                        }}
                        className={cn(
                          "block rounded-xl px-4 py-3.5 text-lg font-medium transition-colors",
                          item.href.startsWith("#") && activeSection === item.href.slice(1)
                            ? "bg-brand-50 text-brand"
                            : "text-fg-primary hover:bg-surface-active dark:text-white dark:hover:bg-slate-900",
                        )}
                      >
                        {item.label}
                      </Link>
                    </motion.li>
                  ))}
                </ul>

                <div className="mt-auto flex flex-col gap-3 border-t border-border-default pt-6 dark:border-slate-800">
                  <Button variant="outline" size="lg" className="h-12 w-full rounded-full" asChild>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    className="h-12 w-full rounded-full bg-brand text-white hover:bg-brand-700"
                    asChild
                  >
                    <Link href="/signup" onClick={() => setMobileOpen(false)}>
                      Get early access
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </>
  );
}
