/**
 * Canonical public origin for SEO, sitemap, robots, and host redirects.
 * Set NEXT_PUBLIC_SITE_URL (no trailing slash), e.g. https://getworkgraph.com
 */

export const DEFAULT_SITE_URL = "https://getworkgraph.com";

/** Legacy / alternate hosts that must 308 to the canonical host. */
export const ALTERNATE_HOSTS = [
  "workgraph.ai",
  "www.workgraph.ai",
  "app.workgraph.ai",
  "www.app.workgraph.ai",
  "workgraph.app",
  "www.workgraph.app",
  "www.getworkgraph.com",
  "work-graph-fawn.vercel.app",
  "workgraph-landing.vercel.app",
] as const;

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function hostnameOf(hostHeader: string): string {
  const raw = hostHeader.trim().toLowerCase();
  if (raw.startsWith("[")) {
    const end = raw.indexOf("]");
    if (end !== -1) return raw.slice(0, end + 1);
  }
  return raw.split(":")[0] ?? raw;
}

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
  try {
    const withProtocol = raw.includes("://") ? raw : `https://${raw}`;
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return DEFAULT_SITE_URL;
    }
    return stripTrailingSlash(url.origin);
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function getSiteHost(): string {
  return new URL(getSiteUrl()).hostname;
}

/** Absolute URL on the canonical host. `path` may be `./` for the current route. */
export function siteUrl(path: string = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/" || path === "./") return base;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function isLocalHostname(hostname: string): boolean {
  const host = hostnameOf(hostname);
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]" ||
    host.endsWith(".localhost")
  );
}

export function isHostRedirectExempt(hostname: string, vercelEnv?: string | null): boolean {
  if (vercelEnv === "preview") return true;
  return isLocalHostname(hostname);
}

/**
 * If the request Host is not canonical, return the absolute URL to 308 to.
 * Preserves path and query. Returns null when no redirect is needed.
 */
export function resolveCanonicalHostRedirect(input: {
  hostHeader: string | null;
  pathname: string;
  search?: string;
  vercelEnv?: string | null;
}): string | null {
  if (!input.hostHeader) return null;
  const hostname = hostnameOf(input.hostHeader);
  if (!hostname) return null;
  if (isHostRedirectExempt(hostname, input.vercelEnv)) return null;

  const canonical = new URL(getSiteUrl());
  if (hostname === canonical.hostname.toLowerCase()) return null;

  const dest = new URL(canonical.origin);
  dest.pathname = input.pathname || "/";
  dest.search = input.search ?? "";
  return dest.toString();
}
