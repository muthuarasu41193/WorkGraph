import { generateEmbedding } from "@/lib/embeddings";
import type { EmbeddingRecord } from "./schema";
import type { NormalizedResume } from "./schema";
import { resumeEmbeddingText } from "@/lib/embeddings";

/**
 * Resume vector via the shared WorkGraph embedding service (hash-ngram-v1).
 * No external embedding provider.
 */
export function embedNormalizedResume(resume: {
  skills: NormalizedResume["skills"];
  experience: NormalizedResume["experience"];
  target_roles: NormalizedResume["target_roles"];
  professional_summary: NormalizedResume["professional_summary"];
  seniority: NormalizedResume["seniority"];
}): EmbeddingRecord {
  const generated = generateEmbedding(
    resumeEmbeddingText({
      professional_summary: resume.professional_summary?.value ?? null,
      skills: resume.skills.map((item) => item.skill),
      target_roles: resume.target_roles.map((item) => item.value),
      seniority: resume.seniority?.value ?? null,
      experience: resume.experience,
    }),
  );
  return {
    model: generated.model,
    dimensions: generated.dimensions,
    vector: generated.vector,
  };
}
