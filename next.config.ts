import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/pdf tooling — avoid bundling issues on Vercel.
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],

  async redirects() {
    return [
      {
        source: "/create-profile.html",
        destination: "/create-profile",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
