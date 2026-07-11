import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import StatsBar from "@/components/sections/StatsBar";
import HowItWorks from "@/components/sections/HowItWorks";
import InterviewVault from "@/components/sections/InterviewVault";
import Testimonials from "@/components/sections/Testimonials";
import { CtaSection } from "./CtaSection";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-wg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <main id="main-content">
        <Hero />
        <Features />
        <StatsBar />
        <HowItWorks />
        <InterviewVault />
        <Testimonials />
        <CtaSection />
      </main>
      <LandingFooter />
    </>
  );
}
