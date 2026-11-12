import { Reveal } from "./Reveal";

const FAQS = [
  {
    q: "What is WorkGraph?",
    a: "WorkGraph is a job intelligence product. You can search the live jobs index without an account. Match notes appear as estimates when a profile is available.",
  },
  {
    q: "Do I need an account to search?",
    a: "No. Searching the index does not require an account. Sign in when you want to save a role, log an application, or use signed-in tools.",
  },
  {
    q: "Are match scores a promise I will get hired?",
    a: "No. Match notes are estimates from the profile we compared. They are not hiring probabilities and should not be read as guarantees.",
  },
  {
    q: "Where do the jobs come from?",
    a: "From the jobs index WorkGraph maintains. The sources page explains where listings come from. We do not invent a fixed source count on this page.",
  },
  {
    q: "What is Interview Vault?",
    a: "Interview Vault is a place for interview guides and experiences. Open it from the product when you want that workflow — it is separate from browsing the index.",
  },
  {
    q: "How do I delete my data?",
    a: "Signed-in accounts can delete their data from account settings. That removes the personal data we hold for the account.",
  },
] as const;

export function Faq() {
  return (
    <Reveal as="section" className="wg-section" id="faq" aria-labelledby="faq-heading">
      <div className="wg-container">
        <h2 className="wg-faq__title" id="faq-heading">
          Questions people ask us
          <span className="wg-accent-dot">.</span>
        </h2>
        <p className="wg-lead wg-faq__lead">
          Straight answers. No theatre.
        </p>
        <div className="wg-faq__list">
          {FAQS.map((item) => (
            <details key={item.q} className="wg-faq__item">
              <summary>
                {item.q}
                <span className="wg-faq__icon" aria-hidden="true" />
              </summary>
              <p className="wg-faq__answer">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
