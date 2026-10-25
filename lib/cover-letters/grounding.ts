/**
 * Flags numbers and organisation-like names in a cover letter that are not
 * present in the candidate's resume or the job description.
 *
 * The company and job title the candidate typed are role context, not model
 * inventions, so they count as sources for organisation names only.
 */

export type GroundingClaimKind = "number" | "organisation";

export type GroundingFlag = {
  kind: GroundingClaimKind;
  claim: string;
};

export type GroundingSources = {
  resumeText: string;
  jobDescription: string;
  roleContext?: string;
};

const LEADING_FUNCTION_WORD =
  /^(?:a|an|and|as|at|by|for|from|in|into|my|of|on|or|our|the|to|via|with|during|while|after|before|within|across|dear|under|over)\s+/i;

const BOILERPLATE_PHRASES = new Set([
  "hiring manager",
  "hiring team",
  "best regards",
  "kind regards",
  "yours sincerely",
  "yours faithfully",
  "thank you",
  "sincerely yours",
  "cover letter",
  "to whom",
]);

const MAX_WARNING_CLAIMS = 20;

function numberTokens(text: string): string[] {
  return (
    text.match(/(?:[$€£₹]\s*)?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?%?/g) ?? []
  );
}

/** Comparable numeric core. "45%", "$45", and "45" share the core "45". */
export function numericCore(token: string): string | null {
  const cleaned = token.replace(/[$€£₹\s]/g, "").replace(/%$/, "").replace(/,/g, "");
  if (!/^\d+(?:\.\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return String(value);
}

export function extractNumbers(text: string): string[] {
  return numberTokens(text);
}

function numberCoresIn(text: string): Set<string> {
  const cores = new Set<string>();
  for (const token of numberTokens(text)) {
    const core = numericCore(token);
    if (core) cores.add(core);
  }
  return cores;
}

function cleanOrganisationPhrase(raw: string): string | null {
  let phrase = raw.trim();
  let next = phrase.replace(LEADING_FUNCTION_WORD, "");
  while (next !== phrase) {
    phrase = next.trim();
    next = phrase.replace(LEADING_FUNCTION_WORD, "");
  }
  const words = phrase
    .split(/\s+/)
    .map((word) => word.replace(/^[.'-]+|[.'-]+$/g, ""))
    .filter(Boolean);
  if (words.length < 2) return null;
  const normalised = words.join(" ");
  if (BOILERPLATE_PHRASES.has(normalised.toLowerCase())) return null;
  return normalised;
}

export function extractOrganisationNames(text: string): string[] {
  const pattern =
    /\b[A-Z][A-Za-z0-9'.-]*(?:\s+(?:&\s+)?[A-Z][A-Za-z0-9'.-]*)+\b/g;
  const found: string[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(pattern)) {
    const phrase = cleanOrganisationPhrase(match[0]);
    if (!phrase) continue;
    const key = phrase.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    found.push(phrase);
  }
  return found;
}

function includesPhrase(haystack: string, phrase: string): boolean {
  return haystack.toLowerCase().includes(phrase.toLowerCase());
}

export function findUngroundedClaims(
  letter: string,
  sources: GroundingSources,
): GroundingFlag[] {
  const numberHaystack = `${sources.resumeText}\n${sources.jobDescription}`;
  const allowedNumbers = numberCoresIn(numberHaystack);
  const orgHaystack = [sources.resumeText, sources.jobDescription, sources.roleContext ?? ""].join(
    "\n",
  );

  const flags: GroundingFlag[] = [];
  const seen = new Set<string>();

  for (const token of numberTokens(letter)) {
    const core = numericCore(token);
    if (!core || allowedNumbers.has(core)) continue;
    const key = `number:${core}`;
    if (seen.has(key)) continue;
    seen.add(key);
    flags.push({ kind: "number", claim: token });
  }

  for (const name of extractOrganisationNames(letter)) {
    if (includesPhrase(orgHaystack, name)) continue;
    const key = `organisation:${name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    flags.push({ kind: "organisation", claim: name });
  }

  return flags;
}

export function formatClaimWarning(flags: readonly GroundingFlag[]): string | null {
  if (flags.length === 0) return null;
  const claims: string[] = [];
  const seen = new Set<string>();
  for (const flag of flags) {
    const claim = flag.claim.trim();
    const key = claim.toLowerCase();
    if (!claim || seen.has(key)) continue;
    seen.add(key);
    claims.push(claim);
    if (claims.length >= MAX_WARNING_CLAIMS) break;
  }
  if (claims.length === 0) return null;
  return `Check these claims before sending: ${claims.join(", ")}`;
}
