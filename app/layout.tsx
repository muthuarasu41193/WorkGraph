import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";
import { metadataBaseUrl, routeShareMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/PageShell";
import { PageTransition } from "@/components/layout/PageTransition";
import JsonLd from "@/components/seo/JsonLd";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { ThemeScript } from "@/components/theme/ThemeScript";

// Google Fonts sometimes returns extensionless /l/font?kit= URLs. Next.js 16.2
// then fails the production build with "next/font/google queries have exactly
// one entry". These are the same latin files that request would have downloaded.
const publicSans = localFont({
  src: [
    { path: "./fonts/public-sans-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/public-sans-latin.woff2", weight: "500", style: "normal" },
    { path: "./fonts/public-sans-latin.woff2", weight: "600", style: "normal" },
    { path: "./fonts/public-sans-latin.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-public",
  preload: true,
  adjustFontFallback: "Arial",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const newsreader = localFont({
  src: [
    { path: "./fonts/newsreader-latin.woff2", weight: "500", style: "normal" },
    { path: "./fonts/newsreader-latin.woff2", weight: "600", style: "normal" },
    { path: "./fonts/newsreader-latin.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-display-face",
  preload: false,
  adjustFontFallback: "Times New Roman",
  fallback: ["ui-serif", "Georgia", "serif"],
});

const jetbrainsMono = localFont({
  src: [
    { path: "./fonts/jetbrains-mono-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/jetbrains-mono-latin.woff2", weight: "500", style: "normal" },
    { path: "./fonts/jetbrains-mono-latin.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  variable: "--font-jetbrains",
  preload: false,
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
});

const SEO_TITLE = "WorkGraph — Find Jobs That Never Hit LinkedIn";
const SEO_DESCRIPTION =
  "AI-powered job intelligence platform. Discover hidden jobs from Reddit, Discord & 50+ private sources. AI match scoring, Interview Vault, and earn by selling your guides.";

const share = routeShareMetadata("./");

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  metadataBase: metadataBaseUrl(),
  alternates: share.alternates,
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    url: share.openGraph?.url,
    siteName: SITE.name,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SEO_TITLE,
      },
    ],
  },
  twitter: {
    ...share.twitter,
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(publicSans.variable, newsreader.variable, jetbrainsMono.variable)} suppressHydrationWarning>
      <body className={cn(publicSans.className, "min-h-dvh bg-background text-foreground antialiased")}>
        <ThemeScript />
        <ThemeProvider>
          <JsonLd />
          <PageTransition>
            {children}
          </PageTransition>
          <PageShell />
        </ThemeProvider>
      </body>
    </html>
  );
}
