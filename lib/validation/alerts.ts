import { z } from "zod";

import { uuidSchema } from "./primitives";

export const ALERT_NAME_MAX = 80;
export const ALERT_QUERY_MAX = 500;
export const ALERT_MAX_PER_USER = 10;

export const alertFrequencySchema = z.enum(["daily", "weekly", "off"], {
  errorMap: () => ({ message: "Frequency must be daily, weekly, or off." }),
});

export type AlertFrequency = z.infer<typeof alertFrequencySchema>;

export const alertIdSchema = uuidSchema;

const querySchema = z
  .string()
  .trim()
  .max(ALERT_QUERY_MAX, `Query must be ${ALERT_QUERY_MAX} characters or fewer.`);

const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required.")
  .max(ALERT_NAME_MAX, `Name must be ${ALERT_NAME_MAX} characters or fewer.`);

const minMatchSchema = z
  .number()
  .int("Match threshold must be a whole number.")
  .min(0, "Match threshold must be between 0 and 100.")
  .max(100, "Match threshold must be between 0 and 100.");

export const alertCreateSchema = z.object({
  name: nameSchema,
  query: querySchema,
  min_match: minMatchSchema.optional(),
  frequency: alertFrequencySchema.optional(),
  discreet: z.boolean().optional(),
});

export type AlertCreateInput = {
  name: string;
  query: string;
  min_match: number;
  frequency: AlertFrequency;
  discreet: boolean;
};

/** Apply create defaults after Zod parse. */
export function withAlertCreateDefaults(
  input: z.infer<typeof alertCreateSchema>,
): AlertCreateInput {
  return {
    name: input.name,
    query: input.query,
    min_match: input.min_match ?? 40,
    frequency: input.frequency ?? "weekly",
    discreet: input.discreet ?? true,
  };
}

export const alertUpdateSchema = z
  .object({
    name: nameSchema.optional(),
    query: querySchema.optional(),
    min_match: minMatchSchema.optional(),
    frequency: alertFrequencySchema.optional(),
    discreet: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export type AlertUpdateInput = z.infer<typeof alertUpdateSchema>;
