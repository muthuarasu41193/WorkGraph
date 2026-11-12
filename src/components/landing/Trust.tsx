import { Reveal } from "./Reveal";

const ITEMS = [
  {
    title: "Estimates stay labeled",
    body: "Match notes and extracted resume fields are marked as estimates or extractions. They are not hiring odds.",
  },
  {
    title: "No invented proof",
    body: "We do not show customer logos, fake user counts, security certifications, or income guarantees.",
  },
  {
    title: "Your data, your control",
    body: "Sign-in is required only for saving and tracking. Account deletion removes the personal data we hold for that account.",
  },
  {
    title: "Quiet by design",
    body: "No countdowns, no scarcity theatre, no pre-checked marketing consent. Rejecting optional cookies is as visible as accepting them.",
  },
] as const;

export function Trust() {
  return (
    <Reveal as="section" className="wg-section" id="trust" aria-labelledby="trust-heading">
      <div className="wg-container">
        <h2 className="wg-trust__title" id="trust-heading">
          Ready for a careful read
          <span className="wg-accent-dot">.</span>
        </h2>
        <div className="wg-trust__grid">
          {ITEMS.map((item) => (
            <article key={item.title} className="wg-trust__item">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <p className="wg-lead" style={{ marginTop: "2rem" }}>
          <a href="/trust" style={{ textDecoration: "underline", textUnderlineOffset: "0.18em" }}>
            Read the trust notes
          </a>
        </p>
      </div>
    </Reveal>
  );
}
