import Link from "next/link";
import { FOOTER_LINKS, SITE } from "@/lib/constants";

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-3" role="list">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-foreground-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="border-t border-border bg-surface" aria-label="Site footer">
      <div className="mx-auto max-w-landing px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 font-heading text-lg font-bold text-foreground"
              aria-label={`${SITE.name} home`}
            >
              <span
                className="flex size-8 items-center justify-center rounded-lg bg-wg-primary text-sm font-bold text-white"
                aria-hidden
              >
                W
              </span>
              {SITE.name}
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground-muted">
              {SITE.tagline}. Discover hidden roles and make smarter career moves.
            </p>
          </div>

          <FooterColumn title="Product" links={FOOTER_LINKS.product} />
          <FooterColumn title="Company" links={FOOTER_LINKS.company} />
          <FooterColumn title="Legal" links={FOOTER_LINKS.legal} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-foreground-muted">
            &copy; {year} {SITE.name}. All rights reserved.
          </p>
          <p className="text-sm text-foreground-muted">
            Built for people who refuse to settle for the job board grind.
          </p>
        </div>
      </div>
    </footer>
  );
}
