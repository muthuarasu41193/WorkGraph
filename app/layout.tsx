import type { Metadata } from "next";
import { JetBrains_Mono, Newsreader, Public_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";
import { metadataBaseUrl, routeShareMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/PageShell";
import { PageTransition } from "@/components/layout/PageTransition";
import JsonLd from "@/components/seo/JsonLd";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { ThemeScript } from "@/components/theme/ThemeScript";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-public",
  display: "swap",
  preload: true,
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-face",
  display: "swap",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
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
