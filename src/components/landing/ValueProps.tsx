import { Reveal } from "./Reveal";

const ITEMS = [
  {
    title: "A live index, not a feed of guesses",
    body: "Search results come from the jobs index. Posted dates are the dates we stored — not a verification timestamp.",
  },
  {
    title: "Match notes stay estimates",
    body: "When a profile is available, match notes explain the comparison. They are estimates, not hiring probabilities.",
  },
  {
    title: "Save and track when you are ready",
    body: "Browse without an account. Sign in to save roles, log applications, and keep the search moving.",
  },
] as const;

export function ValueProps() {
  return (
    <Reveal as="section" className="wg-section" id="features" aria-labelledby="value-heading">
      <div className="wg-container">
        <h2 className="wg-value__title" id="value-heading">
          What the index is for
          <span className="wg-accent-dot">.</span>
        </h2>
        <div className="wg-value__grid">
          {ITEMS.map((item) => (
            <article key={item.title} className="wg-value__item">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
