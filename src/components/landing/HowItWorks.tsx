import { Reveal } from "./Reveal";

const STEPS = [
  {
    title: "Search the index",
    body: "An account is not required. Look through live listings and open any role that fits.",
  },
  {
    title: "Read what we actually know",
    body: "See where a role was posted and whether the stored date is old. Trust notes appear only when a link or company name is missing.",
  },
  {
    title: "Sign in to save or log",
    body: "Create an account when you want to save a role, keep an application record, or use Interview Vault.",
  },
] as const;

export function HowItWorks() {
  return (
    <Reveal
      as="section"
      className="wg-section"
      id="how-it-works"
      aria-labelledby="how-heading"
    >
      <div className="wg-container wg-how__layout">
        <div>
          <p className="wg-eyebrow">How it works</p>
          <h2 className="wg-how__title" id="how-heading">
            Three calm steps
            <span className="wg-accent-dot">.</span>
          </h2>
          <p className="wg-lead">
            WorkGraph is built for a careful search: look first, decide next, and
            only create an account when it helps.
          </p>
        </div>

        <div>
          <ol className="wg-steps">
            {STEPS.map((step, index) => (
              <li key={step.title} className="wg-step">
                <span className="wg-step__num" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="wg-code" style={{ marginTop: "2rem" }}>
            <div className="wg-code__bar">
              <span>what you get back</span>
              <span>honest fields only</span>
            </div>
            <pre className="wg-code__body">
              <code>
                <span className="tok-cmt">{"// sample listing shape — illustrative"}</span>
                {"\n"}
                {"{\n"}
                {"  "}
                <span className="tok-key">title</span>
                {": "}
                <span className="tok-str">&quot;Senior product designer&quot;</span>
                {",\n"}
                {"  "}
                <span className="tok-key">company</span>
                {": "}
                <span className="tok-str">&quot;Northwind&quot;</span>
                {",\n"}
                {"  "}
                <span className="tok-key">posted</span>
                {": "}
                <span className="tok-str">&quot;stored listing date&quot;</span>
                {",\n"}
                {"  "}
                <span className="tok-key">match</span>
                {": "}
                <span className="tok-str">&quot;estimate when profile exists&quot;</span>
                {"\n"}
                {"}"}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
