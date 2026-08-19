import { createHash } from "node:crypto";

import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MAX_TEXT_CHARS,
  EMBEDDING_MODEL,
  EMBEDDING_MODEL_VERSION,
  type EmbeddingVector,
} from "./types";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;

export function redactPiiForEmbedding(text: string): string {
  return text.replace(EMAIL_RE, " ").replace(PHONE_RE, " ").replace(/\s+/g, " ").trim();
}

export function hashEmbeddingText(text: string): string {
  return createHash("sha256").update(text.trim()).digest("hex");
}

function tokensFrom(text: string): string[] {
  return redactPiiForEmbedding(text)
    .toLowerCase()
    .slice(0, EMBEDDING_MAX_TEXT_CHARS)
    .split(/[^a-z0-9+#.]/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && token.length <= 40);
}

function addHash(vector: Float64Array, token: string, weight: number) {
  const digest = createHash("sha256").update(token).digest();
  const index = digest.readUInt16BE(0) % EMBEDDING_DIMENSIONS;
  const sign = digest[2] % 2 === 0 ? 1 : -1;
  vector[index] += sign * weight;
}

/**
 * Deterministic local embedding. Same model/version as resume intelligence.
 * Does not call Groq or any hosted embedding API.
 */
export function generateEmbedding(text: string): EmbeddingVector {
  const redacted = redactPiiForEmbedding(text).slice(0, EMBEDDING_MAX_TEXT_CHARS);
  const vector = new Float64Array(EMBEDDING_DIMENSIONS);
  const toks = tokensFrom(redacted);
  for (const token of toks) addHash(vector, token, 1);
  for (let i = 0; i < toks.length - 1; i += 1) {
    addHash(vector, `${toks[i]}_${toks[i + 1]}`, 0.5);
  }

  let norm = 0;
  for (const n of vector) norm += n * n;
  norm = Math.sqrt(norm) || 1;
  const out: number[] = [];
  for (const n of vector) out.push(Math.round((n / norm) * 1e6) / 1e6);

  return {
    model: EMBEDDING_MODEL,
    model_version: EMBEDDING_MODEL_VERSION,
    dimensions: EMBEDDING_DIMENSIONS,
    vector: out,
    content_hash: hashEmbeddingText(redacted),
  };
}

export function generateEmbeddingBatch(texts: string[]): EmbeddingVector[] {
  return texts.map((text) => generateEmbedding(text));
}
