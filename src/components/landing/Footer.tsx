const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Live index", href: "#live-index" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Features", href: "#features" },
      { label: "Interview Vault", href: "/interview-vault" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Trust", href: "/trust" },
      { label: "Sources", href: "/sources" },
      { label: "Contact", href: "#contact" },
      { label: "Waitlist", href: "/waitlist" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
      { label: "Cookies", href: "/legal/cookies" },
      { label: "Acceptable use", href: "/legal/acceptable-use" },
      { label: "DPA", href: "/legal/dpa" },
    ],
  },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="wg-footer">
      <div className="wg-container wg-footer__grid">
        <div className="wg-footer__brand">
          <a className="wg-brand" href="/" aria-label="WorkGraph home">
            <span className="wg-brand__mark" aria-hidden="true" />
            WorkGraph
          </a>
          <p>Search the live job index. Match notes are estimates when a profile is available.</p>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="wg-footer__title">{column.title}</p>
            <ul>
              {column.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="wg-container wg-footer__base">
        <p>© {year} WorkGraph</p>
        <p>
          <a href="mailto:hello@getworkgraph.com">hello@getworkgraph.com</a>
        </p>
      </div>
    </footer>
  );
}
