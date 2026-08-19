import type { SupabaseClient } from "@supabase/supabase-js";

import { EMBEDDING_MODEL_VERSION } from "./types";
import type { EmbeddingEntityType, SimilarityHit, StoredEmbedding } from "./types";
import { publicErrorCode, withRetry } from "./retry";

function embeddingLiteral(vector: number[]): string {
  return `[${vector.join(",")}]`;
}

export function toStoredRow(input: {
  entity_type: EmbeddingEntityType;
  entity_id: string;
  owner_user_id: string | null;
  content_hash: string;
  vector: number[];
  status: StoredEmbedding["status"];
  attempts: number;
  error_code: string | null;
}): Record<string, unknown> {
  return {
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    owner_user_id: input.owner_user_id,
    model_version: EMBEDDING_MODEL_VERSION,
    content_hash: input.content_hash,
    embedding: embeddingLiteral(input.vector),
    status: input.status,
    attempts: input.attempts,
    error_code: input.error_code,
    updated_at: new Date().toISOString(),
  };
}

export async function upsertEmbeddingRows(
  supabase: SupabaseClient,
  rows: ReturnType<typeof toStoredRow>[],
): Promise<void> {
  if (!rows.length) return;
  await withRetry(async () => {
    const { error } = await supabase.from("workgraph_embeddings").upsert(rows, {
      onConflict: "owner_scope,entity_type,entity_id,model_version",
    });
    if (error) throw new Error(error.message);
  });
}

export async function loadExistingHashes(
  supabase: SupabaseClient,
  ownerUserId: string | null,
  entityType: EmbeddingEntityType,
  entityIds: string[],
): Promise<Map<string, { content_hash: string; status: string }>> {
  const out = new Map<string, { content_hash: string; status: string }>();
  if (!entityIds.length) return out;
  let query = supabase
    .from("workgraph_embeddings")
    .select("entity_id, content_hash, status")
    .eq("entity_type", entityType)
    .eq("model_version", EMBEDDING_MODEL_VERSION)
    .in("entity_id", entityIds);
  query = ownerUserId
    ? query.eq("owner_user_id", ownerUserId)
    : query.is("owner_user_id", null);
  const { data, error } = await query;
  if (error || !data) return out;
  for (const row of data) {
    out.set(String(row.entity_id), {
      content_hash: String(row.content_hash ?? ""),
      status: String(row.status ?? ""),
    });
  }
  return out;
}

export async function searchEmbeddingsRpc(
  supabase: SupabaseClient,
  queryVector: number[],
  opts: {
    topK?: number;
    entityTypes?: EmbeddingEntityType[];
    userId?: string | null;
  },
): Promise<SimilarityHit[]> {
  const { data, error } = await supabase.rpc("match_workgraph_embeddings", {
    query_embedding: embeddingLiteral(queryVector),
    match_count: opts.topK ?? 10,
    filter_entity_types: opts.entityTypes ?? null,
    filter_user_id: opts.userId ?? null,
    filter_model_version: EMBEDDING_MODEL_VERSION,
  });
  if (error) throw new Error(publicErrorCode(error));
  if (!Array.isArray(data)) return [];
  return data.map((row) => ({
    entity_type: row.entity_type as EmbeddingEntityType,
    entity_id: String(row.entity_id),
    owner_user_id: row.owner_user_id ? String(row.owner_user_id) : null,
    model_version: String(row.model_version ?? EMBEDDING_MODEL_VERSION),
    similarity: Number(row.similarity) || 0,
  }));
}

export async function deleteEmbeddingsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  await supabase.from("workgraph_embeddings").delete().eq("owner_user_id", userId);
}
