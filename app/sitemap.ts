import type { MetadataRoute } from "next";

import { listRolesWithPublishedGuides } from "@/lib/prep-pack/role-pages";
import { siteUrl } from "@/lib/site-url";

const PUBLIC_PATHS = [
  "/",
  "/prep-pack",
  "/interview-vault",
  "/jobs",
  "/waitlist",
  "/login",
  "/signup",
  "/create-profile",
  "/discovery",
  "/upload",
  "/employer/signup",
  "/pricing",
  "/sources",
  "/trust",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
  "/legal/acceptable-use",
  "/legal/dpa",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const staticEntries = PUBLIC_PATHS.map((path, index) => ({
    url: siteUrl(path),
    lastModified,
    changeFrequency: path === "/" || path === "/prep-pack" ? ("weekly" as const) : ("monthly" as const),
    priority: path === "/" || path === "/prep-pack" ? 1 : index < 4 ? 0.8 : 0.6,
  }));

  const roles = await listRolesWithPublishedGuides();
  const roleEntries = roles.map(({ role }) => ({
    url: siteUrl(`/roles/${role.id}`),
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...roleEntries];
}
