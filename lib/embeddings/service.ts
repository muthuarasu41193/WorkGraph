import type { SupabaseClient } from "@supabase/supabase-js";

import { generateEmbedding } from "./generate";
import { publicErrorCode } from "./retry";
import { searchSimilarVectors } from "./similarity";
import {
  deleteEmbeddingsForUser,
  loadExistingHashes,
  searchEmbeddingsRpc,
  toStoredRow,
  upsertEmbeddingRows,
} from "./store";
import {
  experienceEmbeddingText,
  jobDescriptionEmbeddingText,
  jobRequirementsEmbeddingText,
  profileEmbeddingText,
  projectEmbeddingText,
  resumeEmbeddingText,
  skillEmbeddingText,
} from "./texts";
import {
  EMBEDDING_BATCH_SIZE,
  EMBEDDING_MAX_ATTEMPTS,
  EMBEDDING_MODEL_VERSION,
  type EmbeddingEntityType,
  type SimilarityHit,
} from "./types";

export type EmbeddingDraft = {
  entity_type: EmbeddingEntityType;
  entity_id: string;
  owner_user_id: string | null;
  text: string;
};

export type EmbedResult = {
  entity_type: EmbeddingEntityType;
  entity_id: string;
  owner_user_id: string | null;
  model_version: string;
  content_hash: string;
  status: "completed" | "failed" | "skipped";
  error_code: string | null;
  vector: number[] | null;
};

function embedDraft(draft: EmbeddingDraft, attempts: number): EmbedResult {
  const trimmed = draft.text.trim();
  if (!trimmed) {
    return {
      entity_type: draft.entity_type,
      entity_id: draft.entity_id,
      owner_user_id: draft.owner_user_id,
      model_version: EMBEDDING_MODEL_VERSION,
      content_hash: "",
      status: "skipped",
      error_code: "empty_text",
      vector: null,
    };
  }
  try {
    const generated = generateEmbedding(trimmed);
    return {
      entity_type: draft.entity_type,
      entity_id: draft.entity_id,
      owner_user_id: draft.owner_user_id,
      model_version: generated.model_version,
      content_hash: generated.content_hash,
      status: "completed",
      error_code: null,
      vector: generated.vector,
    };
  } catch (error) {
    return {
      entity_type: draft.entity_type,
      entity_id: draft.entity_id,
      owner_user_id: draft.owner_user_id,
      model_version: EMBEDDING_MODEL_VERSION,
      content_hash: "",
      status: "failed",
      error_code: attempts >= EMBEDDING_MAX_ATTEMPTS ? publicErrorCode(error) : "generate_failed",
      vector: null,
    };
  }
}

export function generateDrafts(drafts: EmbeddingDraft[]): EmbedResult[] {
  return drafts.map((draft) => embedDraft(draft, 1));
}

export async function embedAndStore(
  supabase: SupabaseClient | null,
  drafts: EmbeddingDraft[],
  opts?: { force?: boolean },
): Promise<EmbedResult[]> {
  const results: EmbedResult[] = [];
  for (let offset = 0; offset < drafts.length; offset += EMBEDDING_BATCH_SIZE) {
    const batch = drafts.slice(offset, offset + EMBEDDING_BATCH_SIZE);
    const byType = new Map<EmbeddingEntityType, EmbeddingDraft[]>();
    for (const draft of batch) {
      const list = byType.get(draft.entity_type) ?? [];
      list.push(draft);
      byType.set(draft.entity_type, list);
    }

    const existing = new Map<string, { content_hash: string; status: string }>();
    if (supabase && !opts?.force) {
      for (const [entityType, items] of byType) {
        const owner = items[0]?.owner_user_id ?? null;
        const hashes = await loadExistingHashes(
          supabase,
          owner,
          entityType,
          items.map((item) => item.entity_id),
        );
        for (const [id, value] of hashes) existing.set(`${entityType}:${id}`, value);
      }
    }

    const rows = [];
    for (const draft of batch) {
      const generated = embedDraft(draft, 1);
      if (generated.status === "skipped") {
        results.push(generated);
        continue;
      }
      const prior = existing.get(`${draft.entity_type}:${draft.entity_id}`);
      if (
        !opts?.force &&
        prior?.status === "completed" &&
        prior.content_hash === generated.content_hash
      ) {
        results.push({ ...generated, status: "skipped", error_code: "unchanged" });
        continue;
      }
      results.push(generated);
      if (generated.vector) {
        rows.push(
          toStoredRow({
            entity_type: generated.entity_type,
            entity_id: generated.entity_id,
            owner_user_id: generated.owner_user_id,
            content_hash: generated.content_hash,
            vector: generated.vector,
            status: generated.status,
            attempts: 1,
            error_code: generated.error_code,
          }),
        );
      }
    }

    if (supabase && rows.length) {
      try {
        await upsertEmbeddingRows(supabase, rows);
      } catch (error) {
        const code = publicErrorCode(error);
        for (const row of rows) {
          const hit = results.find(
            (item) => item.entity_type === row.entity_type && item.entity_id === row.entity_id,
          );
          if (hit && hit.status === "completed") {
            hit.status = "failed";
            hit.error_code = code;
            hit.vector = null;
          }
        }
      }
    }
  }
  return results;
}

export async function searchSimilar(
  queryText: string,
  corpus: Array<{ entity_type: EmbeddingEntityType; entity_id: string; owner_user_id: string | null; text: string }>,
  topK = 10,
): Promise<SimilarityHit[]> {
  const query = generateEmbedding(queryText);
  const items = corpus
    .map((item) => {
      const generated = generateEmbedding(item.text);
      return {
        ...item,
        model_version: generated.model_version,
        vector: generated.vector,
      };
    })
    .filter((item) => item.vector.some((n) => n !== 0));
  return searchSimilarVectors(query.vector, items, topK).map((hit) => ({
    entity_type: hit.entity_type,
    entity_id: hit.entity_id,
    owner_user_id: hit.owner_user_id,
    model_version: hit.model_version,
    similarity: hit.similarity,
  }));
}

export async function searchStoredEmbeddings(
  supabase: SupabaseClient,
  queryText: string,
  opts: {
    topK?: number;
    entityTypes?: EmbeddingEntityType[];
    userId?: string | null;
  },
): Promise<SimilarityHit[]> {
  const query = generateEmbedding(queryText);
  return searchEmbeddingsRpc(supabase, query.vector, opts);
}

export function draftsFromNormalizedResume(
  userId: string,
  resume: {
    professional_summary?: { value: string } | null;
    skills?: Array<{ skill: string; canonical?: string; category?: string }>;
    target_roles?: Array<{ value: string }>;
    seniority?: { value: string } | null;
    identity?: { headline?: { value: string } | null };
    experience?: Array<{ title: string; company: string; duration: string; description: string }>;
    projects?: Array<{ name: string; description: string }>;
  },
): EmbeddingDraft[] {
  const drafts: EmbeddingDraft[] = [];
  const skills = (resume.skills ?? []).map((item) => item.skill);
  const target_roles = (resume.target_roles ?? []).map((item) => item.value);
  const seniority = resume.seniority?.value ?? null;
  const summary = resume.professional_summary?.value ?? null;
  const headline = resume.identity?.headline?.value ?? null;

  drafts.push({
    entity_type: "profile",
    entity_id: userId,
    owner_user_id: userId,
    text: profileEmbeddingText({ headline, summary, skills, target_roles, seniority }),
  });
  drafts.push({
    entity_type: "resume",
    entity_id: `resume:${userId}`,
    owner_user_id: userId,
    text: resumeEmbeddingText({
      professional_summary: summary,
      skills,
      target_roles,
      seniority,
      experience: resume.experience,
    }),
  });

  for (const skill of resume.skills ?? []) {
    drafts.push({
      entity_type: "skill",
      entity_id: skill.canonical ?? skill.skill.toLowerCase(),
      owner_user_id: userId,
      text: skillEmbeddingText(skill.skill, skill.canonical, skill.category),
    });
  }
  (resume.experience ?? []).forEach((item, index) => {
    drafts.push({
      entity_type: "experience",
      entity_id: `${index}:${item.company}:${item.title}`.slice(0, 180),
      owner_user_id: userId,
      text: experienceEmbeddingText(item),
    });
  });
  (resume.projects ?? []).forEach((item, index) => {
    drafts.push({
      entity_type: "project",
      entity_id: `${index}:${item.name}`.slice(0, 180),
      owner_user_id: userId,
      text: projectEmbeddingText(item),
    });
  });
  return drafts;
}

export function draftsFromJobs(
  jobs: Array<{
    id: string | number;
    title?: string;
    company?: string;
    location?: string;
    description?: string;
  }>,
): EmbeddingDraft[] {
  const drafts: EmbeddingDraft[] = [];
  for (const job of jobs) {
    const id = String(job.id);
    drafts.push({
      entity_type: "job_description",
      entity_id: id,
      owner_user_id: null,
      text: jobDescriptionEmbeddingText(job),
    });
    drafts.push({
      entity_type: "job_requirements",
      entity_id: `${id}:requirements`,
      owner_user_id: null,
      text: jobRequirementsEmbeddingText(job.description ?? "", job.title),
    });
  }
  return drafts;
}

export { deleteEmbeddingsForUser };
export { experienceEmbeddingText, jobDescriptionEmbeddingText, jobRequirementsEmbeddingText, profileEmbeddingText, projectEmbeddingText, resumeEmbeddingText, skillEmbeddingText };
