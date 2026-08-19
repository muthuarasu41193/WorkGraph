import { generateEmbedding } from "./generate";
import { searchSimilarVectors } from "./similarity";
import { EMBEDDING_DIMENSIONS } from "./types";

export type EmbeddingBenchmarkReport = {
  corpus_size: number;
  dimensions: number;
  top_k: number;
  generate_ms: number;
  search_ms: number;
  total_ms: number;
  searches_per_second: number;
};

export function benchmarkSimilaritySearch(opts?: {
  corpusSize?: number;
  topK?: number;
}): EmbeddingBenchmarkReport {
  const corpusSize = opts?.corpusSize ?? 2000;
  const topK = opts?.topK ?? 10;
  const texts = Array.from({ length: corpusSize }, (_, i) => {
    const skill = ["python", "react", "sql", "aws", "java"][i % 5];
    return `Software engineer ${i} using ${skill} and postgresql docker kubernetes`;
  });

  const generateStarted = performance.now();
  const items = texts.map((text, i) => ({
    id: String(i),
    vector: generateEmbedding(text).vector,
  }));
  const query = generateEmbedding("Senior python engineer postgresql docker");
  const generateMs = performance.now() - generateStarted;

  const searchStarted = performance.now();
  const hits = searchSimilarVectors(query.vector, items, topK);
  const searchMs = performance.now() - searchStarted;

  void hits;
  const total = generateMs + searchMs;
  return {
    corpus_size: corpusSize,
    dimensions: EMBEDDING_DIMENSIONS,
    top_k: topK,
    generate_ms: Math.round(generateMs * 100) / 100,
    search_ms: Math.round(searchMs * 100) / 100,
    total_ms: Math.round(total * 100) / 100,
    searches_per_second: searchMs > 0 ? Math.round((1000 / searchMs) * 100) / 100 : 0,
  };
}
