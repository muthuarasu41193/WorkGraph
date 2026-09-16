import type { NextConfig } from "next";
import { ALTERNATE_HOSTS, getSiteUrl } from "./lib/site-url";

const canonicalOrigin = getSiteUrl();

const nextConfig: NextConfig = {
  output: "standalone",
  // Native/pdf tooling — avoid bundling issues on Vercel.
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],

  async redirects() {
    const hostRedirects = ALTERNATE_HOSTS.flatMap((host) => [
      {
        source: "/",
        has: [{ type: "host" as const, value: host }],
        destination: `${canonicalOrigin}/`,
        statusCode: 308 as const,
      },
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: host }],
        destination: `${canonicalOrigin}/:path*`,
        statusCode: 308 as const,
      },
    ]);

    return [
      {
        source: "/create-profile.html",
        destination: "/create-profile",
        permanent: true,
      },
      ...hostRedirects,
    ];
  },
};

export default nextConfig;
