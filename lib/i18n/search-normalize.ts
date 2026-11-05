/**
 * Makes search tolerant of diacritics and compatible with non-Latin input.
 * Folding applies to Latin letters; other scripts pass through unchanged.
 */
export function foldDiacritics(value: string): string {
  return value.normalize("NFD").replace(/\p{M}+/gu, "")
}

export function normalizeSearchText(value: string): string {
  return foldDiacritics(value).trim().toLocaleLowerCase("en-US")
}

/** Tokenize for overlap matching across Latin and non-Latin queries. */
export function searchTokens(value: string): string[] {
  const normalized = normalizeSearchText(value)
  if (!normalized) return []
  return normalized.split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 0)
}

export function searchTextMatches(haystack: string, query: string): boolean {
  const q = normalizeSearchText(query)
  if (!q) return true
  const hay = normalizeSearchText(haystack)
  if (hay.includes(q)) return true
  const tokens = searchTokens(query)
  if (tokens.length === 0) return true
  return tokens.every((token) => hay.includes(token))
}
