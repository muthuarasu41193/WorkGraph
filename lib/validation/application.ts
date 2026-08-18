import { z } from "zod";

import { APPLICATION_STATUSES } from "@/lib/applications";

import { isoDateSchema, uuidSchema } from "./primitives";

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES, {
  errorMap: () => ({ message: "Invalid application status." }),
});

export type ApplicationStatusInput = z.infer<typeof applicationStatusSchema>;

export const applicationIdSchema = uuidSchema;

const nullableTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => (value === "" ? null : value));

const optionalNullableDate = z
  .union([isoDateSchema, z.literal(""), z.null()])
  .optional()
  .transform((value) => (value === "" || value == null ? null : value));

export const applicationInsertSchema = z.object({
  company: z.string().trim().min(1, "Company and role are required.").max(200, "Company is too long."),
  role: z.string().trim().min(1, "Company and role are required.").max(200, "Role is too long."),
  status: applicationStatusSchema.optional(),
  applied_date: isoDateSchema.optional(),
  job_url: nullableTrimmed(500),
  notes: nullableTrimmed(8000),
  salary_offered: nullableTrimmed(120),
  contact_person: nullableTrimmed(200),
  next_step: nullableTrimmed(500),
  next_step_date: optionalNullableDate,
});

export type ApplicationInsertInput = z.infer<typeof applicationInsertSchema>;

export const applicationUpdateSchema = z
  .object({
    company: z.string().trim().min(1, "Company is required.").max(200).optional(),
    role: z.string().trim().min(1, "Role is required.").max(200).optional(),
    status: applicationStatusSchema.optional(),
    applied_date: isoDateSchema.optional(),
    job_url: nullableTrimmed(500),
    notes: nullableTrimmed(8000),
    salary_offered: nullableTrimmed(120),
    contact_person: nullableTrimmed(200),
    next_step: nullableTrimmed(500),
    next_step_date: z
      .union([isoDateSchema, z.literal(""), z.null()])
      .optional()
      .transform((value) => (value === "" || value == null ? null : value)),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;

export const applicationStatusPatchSchema = z.object({
  status: applicationStatusSchema,
});
