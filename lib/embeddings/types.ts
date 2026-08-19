/** Local hashed n-gram embeddings. No external provider, no PII egress. */

export const EMBEDDING_MODEL = "hash-ngram-v1";
export const EMBEDDING_MODEL_VERSION = "hash-ngram-v1";
export const EMBEDDING_DIMENSIONS = 256;
export const EMBEDDING_MAX_ATTEMPTS = 3;
export const EMBEDDING_BATCH_SIZE = 32;
export const EMBEDDING_MAX_TEXT_CHARS = 24_000;

export const EMBEDDING_ENTITY_TYPES = [
  "profile",
  "resume",
  "skill",
  "job_description",
  "job_requirements",
  "experience",
  "project",
] as const;

export type EmbeddingEntityType = (typeof EMBEDDING_ENTITY_TYPES)[number];

export type EmbeddingStatus = "pending" | "completed" | "failed" | "skipped";

export type EmbeddingVector = {
  model: typeof EMBEDDING_MODEL;
  model_version: typeof EMBEDDING_MODEL_VERSION;
  dimensions: typeof EMBEDDING_DIMENSIONS;
  vector: number[];
  content_hash: string;
};

export type EmbeddingRecord = {
  entity_type: EmbeddingEntityType;
  entity_id: string;
  owner_user_id: string | null;
  text: string;
  vector?: EmbeddingVector;
  status: EmbeddingStatus;
  attempts: number;
  error_code: string | null;
};

export type StoredEmbedding = {
  id?: string;
  entity_type: EmbeddingEntityType;
  entity_id: string;
  owner_user_id: string | null;
  model_version: string;
  content_hash: string;
  embedding: number[];
  status: EmbeddingStatus;
  attempts: number;
  error_code: string | null;
};

export type SimilarityHit = {
  entity_type: EmbeddingEntityType;
  entity_id: string;
  owner_user_id: string | null;
  model_version: string;
  similarity: number;
};
