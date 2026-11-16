import { Contact } from "./Contact";
import { Faq } from "./Faq";
import { Features } from "./Features";
import { FinalCta } from "./FinalCta";
import { FlowSteps } from "./FlowSteps";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { LiveIndex } from "./LiveIndex";
import { Nav } from "./Nav";
import { Trust } from "./Trust";
import { landingFontVariables } from "./fonts";
import "./landing.css";

type LandingPageProps = {
  accountDeletedBanner?: string | null;
};

/**
 * Stateweave-inspired WorkGraph landing — live at `/`.
 * Stamp-red Signal Stamp palette; animated product stage; honest copy only.
 */
export function LandingPage({ accountDeletedBanner = null }: LandingPageProps) {
  return (
    <div className={`wg-landing ${landingFontVariables}`}>
      <a href="#main-content" className="wg-skip">
        Skip to content
      </a>
      <Nav />
      {accountDeletedBanner ? (
        <div className="wg-account-deleted" role="status">
          <p className="wg-account-deleted__body">{accountDeletedBanner}</p>
        </div>
      ) : null}
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <LiveIndex />
        <FlowSteps />
        <Features />
        <Trust />
        <Faq />
        <Contact />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
