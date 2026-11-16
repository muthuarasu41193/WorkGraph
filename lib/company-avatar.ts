/** Trailing legal / fluff tokens that should not drive company initials. */
const TRAILING_SKIP = new Set([
  "inc",
  "inc.",
  "llc",
  "llc.",
  "ltd",
  "ltd.",
  "corp",
  "corp.",
  "co",
  "co.",
  "gmbh",
  "plc",
  "limited",
  "pvt",
  "pvt.",
  "private",
]);

/** Connector words dropped only when they sit between other words. */
const MIDDLE_SKIP = new Set(["the", "and", "&", "of"]);

function normalizePart(part: string): string {
  return part.replace(/[^a-zA-Z0-9.]/g, "");
}

function significantWords(name: string): string[] {
  const raw = name
    .trim()
    .split(/[\s/_-]+/)
    .map(normalizePart)
    .filter((part) => part.length > 0);

  // Strip trailing legal suffixes: "Cloudflare, Inc." → ["Cloudflare"]
  while (raw.length > 1 && TRAILING_SKIP.has(raw[raw.length - 1].toLowerCase())) {
    raw.pop();
  }

  return raw.filter((part, index) => {
    const lower = part.toLowerCase();
    if (MIDDLE_SKIP.has(lower) && index > 0 && index < raw.length - 1) return false;
    // Drop location fluff only when other words remain ("Thoughtworks India").
    if (raw.length > 1 && (lower === "india" || lower === "technologies" || lower === "technology" || lower === "labs" || lower === "lab" || lower === "group" || lower === "holdings" || lower === "solutions" || lower === "services" || lower === "systems" || lower === "software")) {
      return false;
    }
    return true;
  });
}

/**
 * Two-letter initials from a company name.
 * Prefers distinct letters across names (first+last of a single token,
 * or first letter of the first word + last letter of the last word) so
 * different companies do not all collapse to the same "CA".
 */
export function companyInitials(name: string): string {
  const words = significantWords(name);
  if (words.length === 0) {
    const fallback = name.trim().replace(/[^a-zA-Z0-9]/g, "");
    if (!fallback) return "?";
    if (fallback.length === 1) return fallback.toUpperCase();
    return `${fallback[0]}${fallback[fallback.length - 1]}`.toUpperCase();
  }
  if (words.length === 1) {
    const word = words[0];
    if (word.length === 1) return word.toUpperCase();
    return `${word[0]}${word[word.length - 1]}`.toUpperCase();
  }
  // First letter of the first word + last letter of the last word so
  // "Cool Apps" (CS) and "Company Alpha" (CA) stay distinct.
  const first = words[0][0] ?? "";
  const lastWord = words[words.length - 1];
  const last = lastWord[lastWord.length - 1] ?? "";
  return `${first}${last}`.toUpperCase();
}

/** Stable 0–n index from a company name for neutral avatar tinting. */
export function companyAvatarToneIndex(name: string, bucketCount = 5): number {
  const cleaned = name.trim().toLowerCase();
  if (!cleaned || bucketCount <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < cleaned.length; i += 1) {
    hash = (hash * 31 + cleaned.charCodeAt(i)) >>> 0;
  }
  return hash % bucketCount;
}
