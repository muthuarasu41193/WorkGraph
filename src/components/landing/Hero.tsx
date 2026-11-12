import { LinkButton } from "./ui";

function FloatingDemo() {
  return (
    <div className="wg-hero__stage" aria-hidden="true">
      <div className="wg-hero__glow" />
      <div className="wg-float-stack">
        <div className="wg-float wg-float--search">
          <p className="wg-float__label">Live search</p>
          <div className="wg-search-mock">
            <span className="wg-search-mock__q">product designer · remote</span>
            <span className="wg-search-mock__btn">Search</span>
          </div>
        </div>

        <div className="wg-float wg-float--job">
          <p className="wg-float__label">Listing</p>
          <p className="wg-job-mock__title">Senior product designer</p>
          <p className="wg-job-mock__meta">Northwind · Remote · Posted date on file</p>
          <div className="wg-job-mock__chips">
            <span className="wg-chip wg-chip--live">In the index</span>
            <span className="wg-chip">Company site</span>
            <span className="wg-chip">Save when signed in</span>
          </div>
        </div>

        <div className="wg-float wg-float--match">
          <p className="wg-float__label">Match note</p>
          <p className="wg-match-mock__score">Estimate</p>
          <p className="wg-match-mock__note">
            Match notes are estimates when a profile is available — not a hiring
            probability.
          </p>
          <div className="wg-match-mock__bar" aria-hidden="true">
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="wg-hero wg-atmosphere" aria-labelledby="hero-heading">
      <div className="wg-noise" aria-hidden="true" />
      <div className="wg-container wg-hero__grid">
        <div>
          <p className="wg-eyebrow">AI-powered job intelligence</p>
          <p className="wg-hero__brand" id="hero-heading">
            WorkGraph
          </p>
          <h1 className="wg-hero__title">
            Search the live index
            <span className="wg-accent-dot">.</span>
          </h1>
          <p className="wg-lead">
            Results come from the jobs index. No account is required to look.
            Sign in when you want to save a role or log an application.
          </p>
          <div className="wg-hero__actions">
            <LinkButton href="#live-index" variant="primary">
              Search the index
            </LinkButton>
            <LinkButton href="#how-it-works" variant="ghost">
              See how it works
            </LinkButton>
          </div>
          <p className="wg-hero__note">
            Prefer a slower start?{" "}
            <a href="/waitlist">Join the waitlist</a>
          </p>
        </div>
        <FloatingDemo />
      </div>
    </section>
  );
}
