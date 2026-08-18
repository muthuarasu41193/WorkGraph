import { z } from "zod";

import { LIMITS, coerceStringList, stringList } from "./primitives";

export const skillSchema = z
  .string()
  .trim()
  .min(1, "Skill cannot be empty.")
  .max(LIMITS.skill, `Each skill must be ${LIMITS.skill} characters or fewer.`);

export const skillsSchema = z
  .array(skillSchema)
  .max(LIMITS.skills, `At most ${LIMITS.skills} skills are allowed.`);

/** User/API input: require a string array (or omit). */
export const skillsInputSchema = skillsSchema;

/** AI / untrusted structured output. */
export const aiSkillsSchema = coerceStringList(LIMITS.skills, LIMITS.skill);

export const certificationsSchema = stringList(LIMITS.certifications, LIMITS.certification);

export const aiCertificationsSchema = coerceStringList(LIMITS.certifications, LIMITS.certification);
