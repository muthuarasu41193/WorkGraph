import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

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
  return PUBLIC_PATHS.map((path, index) => ({
    url: siteUrl(path),
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : index < 4 ? 0.8 : 0.6,
  }));
}
