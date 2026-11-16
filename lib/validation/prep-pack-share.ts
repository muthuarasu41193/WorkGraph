import { z } from "zod";

import { uuidSchema } from "./primitives";

export const prepPackShareCreateSchema = z.object({
  packId: uuidSchema,
});

export type PrepPackShareCreateInput = z.infer<typeof prepPackShareCreateSchema>;

export const prepPackShareIdSchema = uuidSchema;
