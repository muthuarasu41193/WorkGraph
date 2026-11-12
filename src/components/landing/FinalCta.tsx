import { Reveal } from "./Reveal";
import { LinkButton } from "./ui";

export function FinalCta() {
  return (
    <Reveal as="section" className="wg-final wg-atmosphere" aria-labelledby="final-heading">
      <div className="wg-noise" aria-hidden="true" />
      <div className="wg-container">
        <h2 className="wg-final__title" id="final-heading">
          Give your search a clearer index
          <span className="wg-accent-dot">.</span>
        </h2>
        <p className="wg-lead wg-final__lead">
          Look through live listings now. Create an account only when you want to
          save roles or keep an application record.
        </p>
        <div className="wg-final__actions">
          <LinkButton href="/jobs" variant="primary">
            Search the index
          </LinkButton>
          <LinkButton href="/signup" variant="ghost">
            Create a free account
          </LinkButton>
        </div>
      </div>
    </Reveal>
  );
}
