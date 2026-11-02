import { z } from "zod";

import { LIMITS } from "./primitives";

/** Extra client keys (e.g. userId) are stripped — never trusted. */
export const tailoringRequestSchema = z.object({
  jobId: z
    .string()
    .trim()
    .min(1, "Job id is required.")
    .max(LIMITS.jobId, "Job id is too long."),
});

export type TailoringRequestInput = z.infer<typeof tailoringRequestSchema>;
