const PROMPTS = [
  "Remote product designer roles",
  "Staff engineer in Berlin",
  "Roles posted in the last 24 hours",
  "Frontend jobs with a company site",
  "Product manager · hybrid",
  "Data roles without a recruiter middleman",
  "Designer openings I can save later",
  "Where these jobs come from",
] as const;

export function AskBar() {
  const loop = [...PROMPTS, ...PROMPTS];

  return (
    <section className="wg-ask" aria-label="Example searches">
      <div className="wg-container">
        <p className="wg-ask__label">People look for</p>
      </div>
      <div className="wg-marquee">
        <div className="wg-marquee__track">
          {loop.map((prompt, index) => (
            <a
              key={`${prompt}-${index}`}
              className="wg-prompt"
              href={`/?q=${encodeURIComponent(prompt)}`}
            >
              <span className="wg-prompt__dot" aria-hidden="true" />
              {prompt}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
