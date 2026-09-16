import dynamic from "next/dynamic";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import Hero from "@/components/sections/Hero";
import StatsBar from "@/components/sections/StatsBar";
import { SectionSkeleton } from "@/components/landing/SectionSkeleton";
import { getConsentedTestimonials } from "@/lib/social-proof-server";
import { getRealCounts } from "@/lib/social-proof";

const Features = dynamic(() => import("@/components/sections/Features"), {
  loading: () => <SectionSkeleton />,
});

const HowItWorks = dynamic(() => import("@/components/sections/HowItWorks"), {
  loading: () => <SectionSkeleton />,
});

const InterviewVault = dynamic(() => import("@/components/sections/InterviewVault"), {
  loading: () => <SectionSkeleton className="bg-slate-950" />,
});

const Testimonials = dynamic(() => import("@/components/sections/Testimonials"), {
  loading: () => <SectionSkeleton className="bg-background" />,
});

const Pricing = dynamic(() => import("@/components/sections/Pricing"), {
  loading: () => <SectionSkeleton />,
});

const Contact = dynamic(() => import("@/components/sections/Contact"), {
  loading: () => <SectionSkeleton className="bg-background" />,
});

export default async function HomePage() {
  const [counts, testimonials] = await Promise.all([
    getRealCounts(),
    getConsentedTestimonials(),
  ]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-wg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <SiteHeader>
        <AnnouncementBar signups={counts.signups} />
        <Navbar />
      </SiteHeader>

      <main id="main-content">
        <Hero counts={counts} />
        <StatsBar counts={counts} />
        <Features />
        <HowItWorks />
        <InterviewVault publishedGuides={counts.publishedGuides} />
        <Testimonials items={testimonials} />
        <Pricing />
        <Contact />
      </main>

      <Footer signups={counts.signups} />
    </>
  );
}
