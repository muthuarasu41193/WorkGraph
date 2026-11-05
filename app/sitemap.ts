import type { MetadataRoute } from "next";
import { locales, routing } from "@/i18n/routing";
import { getSiteUrl, siteUrl } from "@/lib/site-url";

const PUBLIC_PATHS = [
  "/",
  "/waitlist",
  "/login",
  "/signup",
  "/create-profile",
  "/discovery",
  "/interview-vault",
  "/upload",
  "/employer/signup",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
  "/legal/acceptable-use",
  "/legal/dpa",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const base = getSiteUrl().replace(/\/$/, "");
  const entries: MetadataRoute.Sitemap = [];

  for (const path of PUBLIC_PATHS) {
    for (const locale of locales) {
      const localized =
        locale === routing.defaultLocale
          ? path
          : path === "/"
            ? `/${locale}`
            : `/${locale}${path}`;
      entries.push({
        url: path === localized ? siteUrl(path) : `${base}${localized}`,
        lastModified,
        changeFrequency: path === "/" ? "weekly" : "monthly",
        priority: path === "/" ? 1 : 0.6,
        alternates: {
          languages: Object.fromEntries(
            locales.map((code) => [
              code,
              code === routing.defaultLocale
                ? `${base}${path === "/" ? "/" : path}`
                : `${base}/${code}${path === "/" ? "" : path}`,
            ]),
          ),
        },
      });
    }
  }

  return entries;
}
