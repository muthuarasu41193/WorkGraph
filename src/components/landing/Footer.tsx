const PRODUCT = [
  { label: "Search jobs", href: "/jobs" },
  { label: "Pricing", href: "/pricing" },
  { label: "Sources", href: "/sources" },
  { label: "Interview vault", href: "/interview-vault" },
] as const;

const COMPANY = [
  { label: "Trust", href: "/trust" },
  { label: "Waitlist", href: "/waitlist" },
  { label: "Contact", href: "/#contact" },
  { label: "Sign in", href: "/login" },
] as const;

const LEGAL = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Cookies", href: "/legal/cookies" },
  { label: "Acceptable use", href: "/legal/acceptable-use" },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="wg-footer">
      <div className="wg-container">
        <div className="wg-footer__grid">
          <div>
            <a className="wg-brand" href="/">
              <span className="wg-brand__mark" aria-hidden="true" />
              WorkGraph
            </a>
            <p className="wg-footer__blurb">
              Search the live job index. Match notes are estimates when a profile
              is available.
            </p>
          </div>

          <div>
            <h3>Product</h3>
            <ul>
              {PRODUCT.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Company</h3>
            <ul>
              {COMPANY.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Legal</h3>
            <ul>
              {LEGAL.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="wg-footer__bottom">
          <p>© {year} WorkGraph</p>
          <p>Search the live job index.</p>
        </div>
      </div>
    </footer>
  );
}
