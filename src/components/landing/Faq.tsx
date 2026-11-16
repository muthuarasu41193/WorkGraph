import { Reveal } from "./Reveal";

const FAQS = [
  {
    q: "Do I need an account to search?",
    a: "No. Searching the live index works without signing in. An account is for saving roles, tracking applications, and Interview Vault.",
  },
  {
    q: "Where do jobs come from?",
    a: "From public sources we ingest and store. The sources page lists where listings come from. We do not invent postings.",
  },
  {
    q: "What does a match note mean?",
    a: "When a profile is available, a match note estimates overlap with a listing. It is not a hiring probability.",
  },
  {
    q: "Can I delete my data?",
    a: "Yes. Account settings include delete and export paths for major personal data.",
  },
] as const;

export function Faq() {
  return (
    <Reveal
      as="section"
      className="wg-section wg-faq"
      id="faq"
      aria-labelledby="faq-heading"
    >
      <div className="wg-container">
        <p className="wg-eyebrow">FAQ</p>
        <h2 id="faq-heading" className="wg-section__title">
          Short answers.
        </h2>
        <div className="wg-faq__list">
          {FAQS.map((item) => (
            <details key={item.q} className="wg-faq__item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
