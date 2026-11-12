"use client";

import { useId, useState } from "react";
import { LinkButton } from "./ui";

const LINKS = [
  { label: "Demo", href: "#live-index" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Trust", href: "#trust" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "#faq" },
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);
  const drawerId = useId();

  return (
    <header className="wg-nav">
      <div className="wg-container wg-nav__inner">
        <a className="wg-brand" href="/landing-preview" aria-label="WorkGraph home">
          <span className="wg-brand__mark" aria-hidden="true" />
          WorkGraph
        </a>

        <nav aria-label="Primary">
          <ul className="wg-nav__links">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="wg-nav__actions">
          <a className="wg-nav__login" href="/login">
            Sign in
          </a>
          <LinkButton href="/signup" variant="primary">
            Get early access
          </LinkButton>
          <button
            type="button"
            className="wg-nav__menu"
            aria-expanded={open}
            aria-controls={drawerId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              {open ? (
                <path
                  d="M4 4l10 10M14 4L4 14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M3 5h12M3 9h12M3 13h12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        id={drawerId}
        className={["wg-container", "wg-nav__drawer", open ? "is-open" : ""]
          .filter(Boolean)
          .join(" ")}
      >
        <ul>
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a href="/login" onClick={() => setOpen(false)}>
              Sign in
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
