import { LinkButton } from "./ui";
import { HeroDemo } from "./HeroDemo";

export function Hero() {
  return (
    <section className="wg-hero" aria-labelledby="hero-brand">
      <div className="wg-hero__atmosphere" aria-hidden="true" />
      <div className="wg-container wg-hero__grid">
        <div className="wg-hero__copy">
          <p className="wg-hero__brand" id="hero-brand">
            WorkGraph
          </p>
          <h1 className="wg-hero__title">
            Your job search, cloned onto a live index.
          </h1>
          <p className="wg-hero__lead">
            Search listings we store from public sources. Open a role, read what
            we actually know, and sign in when you want to save, track, or use
            Interview Vault.
          </p>
          <div className="wg-hero__actions">
            <LinkButton href="/jobs" variant="primary">
              Search the index
            </LinkButton>
            <LinkButton href="#how-it-works" variant="ghost">
              See the flow
            </LinkButton>
          </div>
          <p className="wg-hero__note">
            No account required to look.{" "}
            <a href="#live-index">Try search on this page</a>
            {" · "}
            <a href="/sources">Where jobs come from</a>
          </p>
        </div>
        <HeroDemo />
      </div>
    </section>
  );
}
