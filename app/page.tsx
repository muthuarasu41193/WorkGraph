import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { LandingPage } from "@/components/landing/LandingPage";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${SITE.name} — Find jobs that never hit LinkedIn`,
  description:
    "WorkGraph surfaces hidden roles from Reddit, Twitter, Discord, and 50+ private sources — prep, apply, and earn by selling interview guides.",
  alternates: {
    canonical: SITE.url,
  },
};

export default function Page() {
  return (
    <>
      <Navbar />
      <LandingPage />
    </>
  );
}
