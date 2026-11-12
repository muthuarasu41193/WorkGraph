import { Reveal } from "./Reveal";

export function Showcase() {
  return (
    <Reveal
      as="section"
      className="wg-section"
      id="demo"
      aria-labelledby="showcase-heading"
    >
      <div className="wg-container">
        <h2 className="wg-showcase__title" id="showcase-heading">
          A listing you can actually inspect
          <span className="wg-accent-dot">.</span>
        </h2>
        <p className="wg-lead wg-showcase__lead">
          Freshness uses the stored posted date. Salary is shown only when the
          listing includes pay. Nothing here invents coverage or guarantees.
        </p>

        <div className="wg-showcase__panel">
          <article className="wg-listing">
            <h3>Platform engineer</h3>
            <p className="wg-listing__meta">Harbor Labs · Hybrid · Company site</p>
            <div className="wg-listing__row">
              <span className="wg-chip wg-chip--live">In the index</span>
              <span className="wg-chip">Posted date on file</span>
              <span className="wg-chip">Pay undisclosed</span>
            </div>
            <p>
              Open a role to see source context and whether the date looks old.
              Apply on the company site when you are ready — WorkGraph does not
              submit applications for you.
            </p>
          </article>

          <aside className="wg-side-note">
            <h4>Where jobs come from</h4>
            <p>
              Sources are documented on a dedicated page. We do not claim a fixed
              source count or invent employer logos.
            </p>
            <a href="/sources">Where our jobs come from</a>
            <a href="/interview-vault">Interview vault</a>
          </aside>
        </div>
      </div>
    </Reveal>
  );
}
