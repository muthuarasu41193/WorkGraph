import { z } from "zod";

import { LIMITS } from "./primitives";

export const savedJobIdSchema = z
  .string()
  .trim()
  .min(1, "Job id is required.")
  .max(LIMITS.jobId, "Job id is too long.");

export const savedJobIdsSchema = z
  .array(savedJobIdSchema)
  .max(500, "Too many saved jobs.");

export function parseSavedJobIds(data: unknown): string[] {
  const result = savedJobIdsSchema.safeParse(data);
  if (!result.success) {
    if (!Array.isArray(data)) return [];
    return data
      .filter((id): id is string => typeof id === "string")
      .map((id) => id.trim())
      .filter((id) => id.length > 0 && id.length <= LIMITS.jobId)
      .slice(0, 500);
  }
  return result.data;
}

export const savedJobToggleSchema = z.object({
  jobId: savedJobIdSchema,
});
