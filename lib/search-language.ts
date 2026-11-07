/**
 * Detects query text that is unlikely to hit an English-heavy index.
 * Used only for an empty-state hint — never blocks search.
 */
export function queryLooksNonLatin(query: string): boolean {
  const trimmed = query.trim()
  if (!trimmed) return false
  // Letters outside Basic Latin + Latin-1 Supplement (covers ta, hi, and many others).
  return /[^\u0000-\u024F\s\d\p{P}\p{S}]/u.test(trimmed)
}

export const LANGUAGE_EMPTY_HINT =
  "No results in your language. Try the same role or skill in English too."
