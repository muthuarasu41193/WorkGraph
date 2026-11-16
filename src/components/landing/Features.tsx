import { Reveal } from "./Reveal";

const FEATURES = [
  {
    title: "Live job index",
    body: "Browse listings we store from public sources. Search works without an account.",
  },
  {
    title: "Honest listing detail",
    body: "See the stored posted date and source. Trust notes appear only when a link or company name is missing.",
  },
  {
    title: "Match notes as estimates",
    body: "When a profile is available, match notes compare it to a role. They are estimates — not hiring probabilities.",
  },
  {
    title: "Application tracker",
    body: "Sign in to save roles and move applications through stages you control.",
  },
  {
    title: "Interview Vault",
    body: "Read candidate-written interview guides, or share your own. Prep packs stay free to open.",
  },
  {
    title: "Your data, your control",
    body: "You can delete your account data. Major personal data can be exported from account settings.",
  },
] as const;

export function Features() {
  return (
    <Reveal
      as="section"
      className="wg-section wg-features"
      id="features"
      aria-labelledby="features-heading"
    >
      <div className="wg-container">
        <div className="wg-features__intro">
          <p className="wg-eyebrow">What you get</p>
          <h2 id="features-heading" className="wg-section__title">
            Tools for a careful search.
          </h2>
          <p className="wg-section__lead">
            Built around the live index, an optional profile, and Interview Vault —
            without inventing counts or guarantees.
          </p>
        </div>
        <ul className="wg-feature-grid">
          {FEATURES.map((feature) => (
            <li key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}
