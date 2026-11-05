import type { Metadata } from "next";
import { locales, routing } from "@/i18n/routing";
import { getSiteUrl, siteUrl } from "./site-url";

/** Root for Next.js metadata URL resolution (canonical, OG, Twitter images). */
export function metadataBaseUrl(): URL {
  return new URL(getSiteUrl());
}

function hreflangLanguages(path: string): Record<string, string> {
  const base = getSiteUrl().replace(/\/$/, "");
  const clean = path === "./" || path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] =
      locale === routing.defaultLocale ? `${base}${clean || "/"}` : `${base}/${locale}${clean}`;
  }
  languages["x-default"] = `${base}${clean || "/"}`;
  return languages;
}

/**
 * Per-route canonical, Open Graph URL, Twitter card, and hreflang alternates.
 * Use `"./"` so child pages resolve against their own path + metadataBase.
 */
export function routeShareMetadata(
  path: string = "./",
): Pick<Metadata, "alternates" | "openGraph" | "twitter"> {
  const url = path === "./" ? "./" : siteUrl(path);
  return {
    alternates: {
      canonical: url,
      languages: hreflangLanguages(path === "./" ? "/" : path),
    },
    openGraph: {
      url,
    },
    twitter: {
      card: "summary_large_image",
      // Relative image resolves against metadataBase (NEXT_PUBLIC_SITE_URL).
      images: ["/opengraph-image"],
    },
  };
}
