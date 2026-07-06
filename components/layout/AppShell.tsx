"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { WorkGraphLogo } from "@/components/brand/WorkGraphLogo";
import { shellClasses } from "@/lib/tokens/layout";
import { stickyBarClass } from "@/lib/tokens/classes";
import { cn } from "@/lib/utils";
import "./app-shell.css";

/* ─── Root ─── */

type AppShellProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "auth";
};

function AppShellRoot({ children, className, variant = "default" }: AppShellProps) {
  return (
    <div
      className={cn(
        "wg-app-shell flex min-h-dvh flex-col",
        variant === "auth" && "wg-app-shell--auth",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ─── Header (app chrome) ─── */

type HeaderProps = {
  children: ReactNode;
  className?: string;
};

function AppShellHeader({ children, className }: HeaderProps) {
  return (
    <div className={cn("wg-app-shell-header", className)} role="banner">
      {children}
    </div>
  );
}

/* ─── Body (sidebar + main row) ─── */

type BodyProps = {
  children: ReactNode;
  className?: string;
};

function AppShellBody({ children, className }: BodyProps) {
  return <div className={cn("wg-app-shell-body flex flex-1", className)}>{children}</div>;
}

/* ─── Sidebar ─── */

type SidebarProps = {
  children: ReactNode;
  className?: string;
  sticky?: boolean;
  hiddenBelow?: "sm" | "md" | "lg";
};

function AppShellSidebar({
  children,
  className,
  sticky = true,
  hiddenBelow = "md",
}: SidebarProps) {
  const hiddenClass =
    hiddenBelow === "sm"
      ? "hidden sm:block"
      : hiddenBelow === "lg"
        ? "hidden lg:block"
        : "hidden md:block";

  return (
    <aside
      className={cn(
        "wg-app-shell-sidebar",
        sticky && "wg-app-shell-sidebar--sticky",
        hiddenClass,
        className,
      )}
    >
      {children}
    </aside>
  );
}

/* ─── Main content column ─── */

type MainProps = {
  children: ReactNode;
  className?: string;
  padded?: boolean;
};

function AppShellMain({ children, className, padded = true }: MainProps) {
  return (
    <div
      className={cn(
        "wg-app-shell-main",
        padded && "wg-app-shell-main--padded px-4 py-6 sm:px-6 md:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ─── Scrollable region (sticky children or pinned header/filters) ─── */

type ScrollAreaProps = {
  children: ReactNode;
  className?: string;
};

function AppShellScrollArea({ children, className }: ScrollAreaProps) {
  return <div className={cn("wg-app-shell-scroll", className)}>{children}</div>;
}

/* ─── Page header (title area — sticky or pinned) ─── */

type PageHeaderProps = {
  children: ReactNode;
  className?: string;
  sticky?: boolean;
  padding?: boolean;
};

function AppShellPageHeader({
  children,
  className,
  sticky = false,
  padding = true,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "wg-app-shell-page-header",
        sticky && "wg-app-shell-page-header--sticky",
        padding && "px-4 py-5 sm:px-6 md:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ─── Sticky / pinned filters bar ─── */

type FiltersProps = {
  children: ReactNode;
  className?: string;
  sticky?: boolean;
  padding?: boolean;
};

function AppShellFilters({
  children,
  className,
  sticky = true,
  padding = true,
}: FiltersProps) {
  return (
    <div
      className={cn(
        "wg-app-shell-filters",
        sticky && "wg-app-shell-filters--sticky",
        sticky && stickyBarClass,
        padding && "px-4 sm:px-6 md:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ─── Page content (scrollable body below header/filters) ─── */

type ContentProps = {
  children: ReactNode;
  className?: string;
  scroll?: boolean;
  constrained?: boolean;
};

function AppShellContent({
  children,
  className,
  scroll = true,
  constrained = true,
}: ContentProps) {
  return (
    <div
      className={cn(
        "wg-app-shell-content",
        scroll && "wg-app-shell-content--scroll",
        className,
      )}
    >
      {constrained ? (
        <div className={cn(shellClasses.content, "wg-app-shell-content-inner")}>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/* ─── Footer (mobile nav, etc.) ─── */

type FooterProps = {
  children: ReactNode;
  className?: string;
  fixed?: boolean;
};

function AppShellFooter({ children, className, fixed = true }: FooterProps) {
  return (
    <footer className={cn(fixed && "wg-app-shell-footer", className)}>{children}</footer>
  );
}

/* ─── Auth variant helpers ─── */

type AuthPanelProps = {
  panelEyebrow?: string;
  panelHeadline: string;
  panelDescription?: string;
  highlights?: readonly string[];
};

type AuthProps = AuthPanelProps & {
  children: ReactNode;
  wide?: boolean;
};

function AppShellAuth({
  panelEyebrow,
  panelHeadline,
  panelDescription,
  highlights,
  children,
  wide,
}: AuthProps) {
  return (
    <AppShellRoot variant="auth" className="flex min-h-dvh flex-col antialiased lg:flex-row">
      <AppShellHeader className="wg-app-shell-auth-panel relative h-auto border-b px-6 py-8 lg:hidden">
        <div className="pointer-events-none absolute inset-0 wg-auth-grid opacity-[0.35]" aria-hidden />
        <div className="relative flex items-center gap-3">
          <Link
            href="/"
            className="outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <WorkGraphLogo />
          </Link>
        </div>
        <p className="relative mt-4 text-body font-medium text-foreground">{panelHeadline}</p>
      </AppShellHeader>

      <AppShellSidebar
        sticky={false}
        hiddenBelow="lg"
        className="wg-app-shell-auth-panel relative min-h-dvh w-auto flex-[1.05] border-r lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-16 xl:px-16"
      >
        <div className="pointer-events-none absolute inset-0 wg-auth-grid opacity-[0.35]" aria-hidden />
        <div className="relative">
          <Link
            href="/"
            className="inline-flex rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <WorkGraphLogo />
          </Link>

          <div className="mt-16 max-w-lg space-y-5 xl:mt-20">
            {panelEyebrow ? <p className="wg-label-mono">{panelEyebrow}</p> : null}
            <h1 className="text-pretty text-heading-xl leading-[1.15] text-foreground xl:text-[2.125rem]">
              {panelHeadline}
            </h1>
            {panelDescription ? (
              <p className="text-pretty text-body-lg text-muted-foreground">{panelDescription}</p>
            ) : null}
            {highlights && highlights.length > 0 ? (
              <ul className="space-y-3 pt-2">
                {highlights.map((item) => (
                  <li key={item} className="flex gap-3 text-body leading-snug text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <p className="relative mt-12 max-w-md text-caption leading-relaxed text-muted-foreground lg:mt-0">
          Profiles tuned for recruiters and ATS scans — refine anytime after sign-in.
        </p>
      </AppShellSidebar>

      <AppShellMain
        padded={false}
        className={cn(
          "wg-app-shell-auth-content px-5 pb-12 pt-8 sm:px-10 lg:px-16 lg:pb-16 xl:px-20",
          wide ? "justify-start lg:pt-16 xl:pt-16" : "justify-center lg:pt-16",
        )}
      >
        <div className={`wg-auth-enter mx-auto w-full ${wide ? "max-w-xl" : "max-w-[400px]"}`}>
          {children}
        </div>
      </AppShellMain>
    </AppShellRoot>
  );
}

/* ─── Page scaffold (header + optional filters + scrollable content) ─── */

type PageProps = {
  children: ReactNode;
  className?: string;
  /** Pin header/filters; only content scrolls */
  pinned?: boolean;
};

function AppShellPage({ children, className, pinned = true }: PageProps) {
  if (pinned) {
    return (
      <div className={cn("wg-app-shell-main flex min-h-0 flex-1 flex-col", className)}>
        {children}
      </div>
    );
  }

  return <AppShellScrollArea className={className}>{children}</AppShellScrollArea>;
}

export const AppShell = Object.assign(AppShellRoot, {
  Header: AppShellHeader,
  Body: AppShellBody,
  Sidebar: AppShellSidebar,
  Main: AppShellMain,
  ScrollArea: AppShellScrollArea,
  Page: AppShellPage,
  PageHeader: AppShellPageHeader,
  Filters: AppShellFilters,
  Content: AppShellContent,
  Footer: AppShellFooter,
  Auth: AppShellAuth,
});

export {
  AppShellRoot,
  AppShellHeader,
  AppShellBody,
  AppShellSidebar,
  AppShellMain,
  AppShellScrollArea,
  AppShellPage,
  AppShellPageHeader,
  AppShellFilters,
  AppShellContent,
  AppShellFooter,
  AppShellAuth,
};

export default AppShell;

export type {
  AppShellProps,
  AuthPanelProps,
  ContentProps,
  FiltersProps,
  MainProps,
  PageHeaderProps,
  PageProps,
  SidebarProps,
};
