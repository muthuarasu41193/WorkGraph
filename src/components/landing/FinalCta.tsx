import { Reveal } from "./Reveal";
import { LinkButton } from "./ui";

export function FinalCta() {
  return (
    <Reveal as="section" className="wg-final" aria-labelledby="final-heading">
      <div className="wg-container wg-final__inner">
        <h2 id="final-heading">Start with the live index.</h2>
        <p>
          Look first. Create an account only when you want to save, track, or open
          Interview Vault.
        </p>
        <div className="wg-final__actions">
          <LinkButton href="/jobs" variant="primary">
            Search jobs
          </LinkButton>
          <LinkButton href="/signup" variant="ghost">
            Create account
          </LinkButton>
        </div>
      </div>
    </Reveal>
  );
}
