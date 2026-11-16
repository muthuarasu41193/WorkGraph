import { Reveal } from "./Reveal";
import { LinkButton } from "./ui";

const POINTS = [
  {
    title: "No invented stats",
    body: "Index counts come from the live database when they load. We do not publish placeholder reviews or logos.",
  },
  {
    title: "Sources are named",
    body: "Listings carry the source we stored. Read where jobs come from on the sources page.",
  },
  {
    title: "AI stays an estimate",
    body: "Match notes and AI rewrites are tools. They do not claim a hiring outcome.",
  },
] as const;

export function Trust() {
  return (
    <Reveal
      as="section"
      className="wg-section wg-trust"
      id="trust"
      aria-labelledby="trust-heading"
    >
      <div className="wg-container wg-trust__layout">
        <div>
          <p className="wg-eyebrow">Trust</p>
          <h2 id="trust-heading" className="wg-section__title">
            Built to stay honest under pressure.
          </h2>
          <p className="wg-section__lead">
            Job search tools overpromise. WorkGraph keeps claims tied to data we
            can show.
          </p>
          <div className="wg-trust__actions">
            <LinkButton href="/trust" variant="ghost">
              Trust page
            </LinkButton>
            <LinkButton href="/sources" variant="link">
              Sources
            </LinkButton>
          </div>
        </div>
        <ul className="wg-trust__list">
          {POINTS.map((point) => (
            <li key={point.title}>
              <h3>{point.title}</h3>
              <p>{point.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}
