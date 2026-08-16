import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";
import { PageShell } from "@/components/layout/PageShell";
import { PageTransition } from "@/components/layout/PageTransition";
import JsonLd from "@/components/seo/JsonLd";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { ThemeScript } from "@/components/theme/ThemeScript";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: true,
});

const SEO_TITLE = "WorkGraph — Find Jobs That Never Hit LinkedIn";
const SEO_DESCRIPTION =
  "AI-powered job intelligence platform. Discover hidden jobs from Reddit, Discord & 50+ private sources. AI match scoring, Interview Vault, and earn by selling your guides.";

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  metadataBase: new URL(SITE.url),
  alternates: {
    canonical: SITE.url,
  },
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    url: SITE.url,
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
    card: "summary_large_image",
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(inter.variable, jetbrainsMono.variable)} suppressHydrationWarning>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
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
