/** Domain-based employer verification helpers. */

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "me.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "gmx.com",
]);

export type VerificationOutcome =
  | { status: "verified"; domain: string; reason: "domain_match" }
  | { status: "pending"; domain: string | null; reason: "free_email" | "domain_mismatch" | "no_website" }
  | { status: "rejected"; reason: "invalid_email" };

export function extractEmailDomain(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.trim().toLowerCase().lastIndexOf("@");
  if (at < 1) return null;
  const domain = email.slice(at + 1).trim();
  return domain.length > 2 ? domain : null;
}

export function extractWebsiteDomain(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const normalized = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    const host = new URL(normalized).hostname.toLowerCase().replace(/^www\./, "");
    return host.length > 2 ? host : null;
  } catch {
    return null;
  }
}

function domainsAlign(emailDomain: string, websiteDomain: string): boolean {
  if (emailDomain === websiteDomain) return true;
  return emailDomain.endsWith(`.${websiteDomain}`) || websiteDomain.endsWith(`.${emailDomain}`);
}

export function evaluateEmployerVerification(input: {
  email: string | null;
  websiteUrl: string | null;
}): VerificationOutcome {
  const emailDomain = extractEmailDomain(input.email);
  if (!emailDomain) return { status: "rejected", reason: "invalid_email" };

  if (FREE_EMAIL_DOMAINS.has(emailDomain)) {
    return { status: "pending", domain: emailDomain, reason: "free_email" };
  }

  const websiteDomain = extractWebsiteDomain(input.websiteUrl);
  if (!websiteDomain) {
    return { status: "pending", domain: emailDomain, reason: "no_website" };
  }

  if (domainsAlign(emailDomain, websiteDomain)) {
    return { status: "verified", domain: emailDomain, reason: "domain_match" };
  }

  return { status: "pending", domain: emailDomain, reason: "domain_mismatch" };
}

export function isEmployerVerified(profile: {
  verification_status?: string;
  verified_at?: string | null;
}): boolean {
  return profile.verification_status === "verified" || Boolean(profile.verified_at);
}
