/**
 * "What's inside" outline: section titles only.
 * Never includes question bodies, tip bodies, or round descriptions.
 */

import type { VaultExperience } from "@/lib/vault";

export type VaultGuideOutlineSection = {
  title: string;
};

/**
 * Build a safe outline from metadata. Round names are titles only.
 * Locked HTML bodies are never inspected beyond emptiness for presence of a section.
 */
export function buildVaultGuideOutline(
  experience: Pick<VaultExperience, "rounds_data" | "questions_html" | "tips_html" | "interview_round">,
): VaultGuideOutlineSection[] {
  const sections: VaultGuideOutlineSection[] = [];

  if (experience.interview_round?.trim()) {
    sections.push({ title: `Interview round: ${experience.interview_round.trim().slice(0, 120)}` });
  }

  const roundNames = (experience.rounds_data ?? [])
    .map((round) => String(round?.name ?? "").trim())
    .filter(Boolean)
    .slice(0, 12);

  if (roundNames.length > 0) {
    for (const name of roundNames) {
      sections.push({ title: name.slice(0, 120) });
    }
  } else if ((experience.rounds_data ?? []).length > 0) {
    sections.push({ title: "Interview rounds" });
  }

  // Presence-only checks: empty string means section absent; content never returned.
  if (String(experience.questions_html ?? "").trim()) {
    sections.push({ title: "Questions asked" });
  }
  if (String(experience.tips_html ?? "").trim()) {
    sections.push({ title: "Tips and preparation" });
  }

  return sections;
}
