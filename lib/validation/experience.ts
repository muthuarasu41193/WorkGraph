import { z } from "zod";

import { LIMITS, coerceTrimmedString } from "./primitives";

export const workExperienceSchema = z.object({
  title: z.string().trim().max(LIMITS.jobTitle, "Title is too long."),
  company: z.string().trim().max(LIMITS.company, "Company is too long."),
  duration: z.string().trim().max(LIMITS.duration, "Duration is too long."),
  description: z.string().trim().max(LIMITS.description, "Description is too long."),
});

export const workExperienceListSchema = z
  .array(workExperienceSchema)
  .max(LIMITS.experienceItems, `At most ${LIMITS.experienceItems} roles are allowed.`);

/** Manual profile form: one line per role. */
export const experienceLinesSchema = z
  .array(z.string().trim().min(1).max(LIMITS.description))
  .max(LIMITS.experienceItems, `At most ${LIMITS.experienceItems} roles are allowed.`);

export const aiWorkExperienceSchema = z.unknown().transform((value) => {
  if (!Array.isArray(value)) return [];
  const itemSchema = z.object({
    title: coerceTrimmedString(LIMITS.jobTitle),
    company: coerceTrimmedString(LIMITS.company),
    duration: coerceTrimmedString(LIMITS.duration),
    description: coerceTrimmedString(LIMITS.description),
  });
  const out: z.infer<typeof workExperienceSchema>[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const parsed = itemSchema.safeParse(raw);
    if (parsed.success) out.push(parsed.data);
    if (out.length >= LIMITS.experienceItems) break;
  }
  return out;
});
