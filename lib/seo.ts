import type { Metadata } from "next";
import { getSiteUrl, siteUrl } from "./site-url";

/** Root for Next.js metadata URL resolution (canonical, OG, Twitter images). */
export function metadataBaseUrl(): URL {
  return new URL(getSiteUrl());
}

/**
 * Per-route canonical, Open Graph URL, and Twitter card derived from NEXT_PUBLIC_SITE_URL.
 * Use `"./"` so child pages resolve against their own path + metadataBase.
 */
export function routeShareMetadata(
  path: string = "./",
): Pick<Metadata, "alternates" | "openGraph" | "twitter"> {
  const url = path === "./" ? "./" : siteUrl(path);
  return {
    alternates: {
      canonical: url,
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
