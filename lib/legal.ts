export const LEGAL_VERSION = "0.1.0-draft";
export const LEGAL_LAST_UPDATED = "16 September 2026";
export const PRIVACY_EMAIL = "privacy@getworkgraph.com";

export const LEGAL_NAV = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/cookies", label: "Cookies" },
  { href: "/legal/acceptable-use", label: "Acceptable use" },
  { href: "/legal/dpa", label: "DPA" },
] as const;

export type LegalTocItem = { href: string; title: string };

export type LegalHeading = { id: string; title: string };

export function tocFromSections(sections: readonly LegalHeading[]): LegalTocItem[] {
  return sections.map((section) => ({
    href: `#${section.id}`,
    title: section.title,
  }));
}

export const SUBPROCESSORS = [
  {
    name: "Supabase",
    function: "Authentication, PostgreSQL database, and object storage for resumes and profile files",
    region: "United States (AWS)",
  },
  {
    name: "Vercel",
    function: "Application hosting, edge network, and preview deployments",
    region: "United States / global edge",
  },
  {
    name: "Stripe",
    function: "Payment processing for Interview Vault purchases when payments are enabled",
    region: "United States",
  },
  {
    name: "Resend",
    function: "Transactional email (account, employer connection, and product notices)",
    region: "United States",
  },
  {
    name: "Groq",
    function: "Large-language-model inference for resume parse, ATS scoring, and matching assistance",
    region: "United States",
  },
  {
    name: "Public job sources (RemoteOK, Arbeitnow, Reddit, GitHub, Hacker News, and similar listing APIs)",
    function: "Ingest of publicly posted job listings. We do not send resume files or account emails to these vendors.",
    region: "Various (public internet)",
  },
] as const;

export const DATA_CATEGORIES = [
  {
    category: "Account",
    examples: "Name, email, password hash (via auth provider), account identifiers",
    purpose: "Create and secure your account, communicate with you, provide the service",
    lawfulBasis: "Contract (Art. 6(1)(b) GDPR); legitimate interests in securing accounts (Art. 6(1)(f))",
    retention: "Until you delete the account, then up to 30 days in backups",
  },
  {
    category: "Resume content",
    examples: "Uploaded files, parsed text, skills, experience, education, portfolio links",
    purpose: "Profile, ATS scoring, job matching, cover letters, Talent Intelligence",
    lawfulBasis: "Contract; consent where you opt into optional AI features",
    retention: "Until you delete the resume/profile or the account; backups up to 30 days",
  },
  {
    category: "Application activity",
    examples: "Saved jobs, tracker stages, Interview Vault purchases, employer connection notes",
    purpose: "Provide tracker, marketplace, and hiring-signal features you use",
    lawfulBasis: "Contract",
    retention: "Until you delete the records or the account; backups up to 30 days",
  },
  {
    category: "Device / analytics",
    examples: "Cookie consent choice, coarse device/browser data, security logs",
    purpose: "Operate the site, remember consent, detect abuse, measure reliability",
    lawfulBasis: "Legitimate interests; consent for non-essential cookies where required",
    retention: "Consent choice stored locally until you clear it; security logs typically 90 days",
  },
] as const;
