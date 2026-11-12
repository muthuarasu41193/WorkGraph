import { AskBar } from "./AskBar";
import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { LiveIndex } from "./LiveIndex";
import { Nav } from "./Nav";
import { Showcase } from "./Showcase";
import { Trust } from "./Trust";
import { ValueProps } from "./ValueProps";
import { landingFontVariables } from "./fonts";
import "./landing.css";

/**
 * Stiro-inspired WorkGraph landing composition.
 * Mount only inside `/landing-preview` until explicitly promoted.
 */
export function LandingPage() {
  return (
    <div className={`wg-landing ${landingFontVariables}`}>
      <a href="#main-content" className="wg-skip">
        Skip to content
      </a>
      <Nav />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <AskBar />
        <LiveIndex />
        <ValueProps />
        <HowItWorks />
        <Showcase />
        <Trust />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
