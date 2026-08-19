export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  if (!denom) return 0;
  return dot / denom;
}

export type RankedVector<T> = T & { similarity: number };

export function searchSimilarVectors<T extends { vector: number[] }>(
  query: number[],
  items: T[],
  topK = 10,
): RankedVector<T>[] {
  const k = Math.max(1, Math.min(topK, 100));
  return items
    .map((item) => ({ ...item, similarity: cosineSimilarity(query, item.vector) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}
