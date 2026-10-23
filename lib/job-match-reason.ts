/** One-line reason under the match mark. Never a bare percentage. */
export function matchReason(matchedSkills: number, profileSkillCount: number): string {
  const matched = Math.max(0, Math.round(matchedSkills));
  const total = Math.max(0, Math.round(profileSkillCount));
  if (total > 0) return `Matches ${matched} of ${total} skills`;
  if (matched === 1) return "Matches 1 skill";
  return `Matches ${matched} skills`;
}
