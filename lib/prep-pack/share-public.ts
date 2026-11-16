import type {
  PrepPackChecklistItem,
  PrepPackGuideMatch,
  PrepPackSkill,
  SavedPrepPack,
} from "./types";

/**
 * Derived fields safe to show on a public share page / OG metadata.
 * Never includes raw JD, profile PII, user ids, or locked guide HTML.
 */
export type PublicSharedPrepPack = {
  role: { id: string | null; label: string | null };
  skills: Array<Pick<PrepPackSkill, "name" | "source">>;
  checklist: Array<Pick<PrepPackChecklistItem, "id" | "text" | "round">>;
  guides: Array<{
    id: string;
    company: string;
    role: string;
    href: string;
    why: string[];
  }>;
  estimateNotice: string;
};

const PRIVATE_FIELD_KEYS = [
  "jobDescription",
  "job_description",
  "user_id",
  "userId",
  "owner_id",
  "ownerId",
  "email",
  "resume",
  "questions_html",
  "tips_html",
  "token",
  "token_hash",
  "tokenHash",
] as const;

export function toPublicSharedPrepPack(pack: SavedPrepPack): PublicSharedPrepPack {
  return {
    role: {
      id: pack.role_id,
      label: pack.role_label,
    },
    skills: pack.skills.map((skill) => ({
      name: skill.name,
      source: skill.source,
    })),
    checklist: pack.checklist.map((item) => ({
      id: item.id,
      text: item.text,
      round: item.round,
    })),
    guides: pack.guides.map((guide: PrepPackGuideMatch) => ({
      id: guide.id,
      company: guide.company,
      role: guide.role,
      href: guide.href.startsWith("/interview-vault/")
        ? guide.href
        : `/interview-vault/${guide.id}`,
      why: Array.isArray(guide.why) ? guide.why.slice(0, 8) : [],
    })),
    estimateNotice: pack.estimate_notice,
  };
}

/** Open Graph copy with no private input — role label only when present. */
export function publicShareOpenGraph(pack: PublicSharedPrepPack): {
  title: string;
  description: string;
} {
  const role = pack.role.label?.trim();
  const title = role
    ? `Interview prep pack for ${role} | WorkGraph`
    : "Shared interview prep pack | WorkGraph";
  const description =
    "A shared prep pack with estimated skills, a checklist, and links to public Interview Vault guides. Estimates only — not a hiring probability.";
  return { title, description };
}

/** Assert helpers for tests: private keys must not appear in the public payload. */
export function publicShareContainsPrivateKey(payload: unknown): string | null {
  const json = JSON.stringify(payload);
  for (const key of PRIVATE_FIELD_KEYS) {
    if (new RegExp(`"${key}"\\s*:`).test(json)) return key;
  }
  if (/"questions_html"/i.test(json) || /"tips_html"/i.test(json)) {
    return "locked_guide_html";
  }
  return null;
}
