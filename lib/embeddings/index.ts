export {
  EMBEDDING_MODEL,
  EMBEDDING_MODEL_VERSION,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_ENTITY_TYPES,
} from "./types";
export type {
  EmbeddingEntityType,
  EmbeddingVector,
  EmbeddingRecord,
  SimilarityHit,
  StoredEmbedding,
} from "./types";

export { generateEmbedding, generateEmbeddingBatch, redactPiiForEmbedding, hashEmbeddingText } from "./generate";
export { cosineSimilarity, searchSimilarVectors } from "./similarity";
export { withRetry, publicErrorCode } from "./retry";
export {
  embedAndStore,
  generateDrafts,
  searchSimilar,
  searchStoredEmbeddings,
  draftsFromNormalizedResume,
  draftsFromJobs,
  deleteEmbeddingsForUser,
} from "./service";
export { benchmarkSimilaritySearch } from "./benchmark";
export type { EmbeddingBenchmarkReport } from "./benchmark";
export {
  profileEmbeddingText,
  resumeEmbeddingText,
  skillEmbeddingText,
  experienceEmbeddingText,
  projectEmbeddingText,
  jobDescriptionEmbeddingText,
  jobRequirementsEmbeddingText,
} from "./texts";
