import { z } from "zod";

import { LIMITS, coerceTrimmedString } from "./primitives";

export const educationSchema = z.object({
  degree: z.string().trim().max(LIMITS.jobTitle, "Degree is too long."),
  institution: z.string().trim().max(LIMITS.company, "Institution is too long."),
  year: z.string().trim().max(LIMITS.duration, "Year is too long."),
});

export const educationListSchema = z
  .array(educationSchema)
  .max(LIMITS.educationItems, `At most ${LIMITS.educationItems} education entries are allowed.`);

/** Manual profile form: one line per school. */
export const educationLinesSchema = z
  .array(z.string().trim().min(1).max(LIMITS.description))
  .max(LIMITS.educationItems, `At most ${LIMITS.educationItems} education entries are allowed.`);

export const aiEducationSchema = z.unknown().transform((value) => {
  if (!Array.isArray(value)) return [];
  const itemSchema = z.object({
    degree: coerceTrimmedString(LIMITS.jobTitle),
    institution: coerceTrimmedString(LIMITS.company),
    year: coerceTrimmedString(LIMITS.duration),
  });
  const out: z.infer<typeof educationSchema>[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const parsed = itemSchema.safeParse(raw);
    if (parsed.success) out.push(parsed.data);
    if (out.length >= LIMITS.educationItems) break;
  }
  return out;
});
