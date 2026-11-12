const PROMPTS = [
  {
    label: "Remote product designer roles",
    href: "/jobs?q=Remote%20product%20designer",
  },
  {
    label: "Staff engineer in Berlin",
    href: "/jobs?q=Staff%20engineer%20Berlin",
  },
  {
    label: "Roles posted in the last day",
    href: "/jobs?date=1",
  },
  {
    label: "Frontend jobs with a company site",
    href: "/jobs?q=Frontend",
  },
  {
    label: "Product manager · hybrid",
    href: "/jobs?q=Product%20manager",
  },
  {
    label: "Data roles without a recruiter middleman",
    href: "/jobs?q=Data",
  },
  {
    label: "Designer openings I can save later",
    href: "/jobs?q=Designer",
  },
  {
    label: "Where these jobs come from",
    href: "/sources",
  },
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
              key={`${prompt.label}-${index}`}
              className="wg-prompt"
              href={prompt.href}
            >
              <span className="wg-prompt__dot" aria-hidden="true" />
              {prompt.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
