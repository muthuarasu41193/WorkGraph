import type { PrepPackChecklistItem, PrepPackSkill, PrepSourceKind } from "./types";

function item(id: string, label: string, source: PrepSourceKind): PrepPackChecklistItem {
  return { id, label, source };
}

export function buildChecklist(options: {
  skills: PrepPackSkill[];
  hasGuides: boolean;
  company: string | null;
  inputMode: "job_description" | "role_template";
}): PrepPackChecklistItem[] {
  const items: PrepPackChecklistItem[] = [];
  const source: PrepSourceKind = options.inputMode === "job_description" ? "job_description" : "role_template";

  items.push(
    item(
      "read-requirements",
      options.inputMode === "job_description"
        ? "Re-read the role requirements and mark which skills you can demonstrate with examples"
        : "Review the role template skills and mark which ones you can demonstrate with examples",
      source,
    ),
  );

  const topSkills = options.skills.filter((s) => s.kind === "required").slice(0, 5);
  for (const skill of topSkills) {
    items.push(
      item(
        `practice-${skill.name.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}`,
        `Prepare one concrete example or practice problem for: ${skill.name}`,
        skill.source,
      ),
    );
  }

  if (options.company) {
    items.push(
      item(
        "company-context",
        `Draft 3 questions about the team and role at ${options.company}`,
        "estimate",
      ),
    );
  } else {
    items.push(
      item("company-context", "Draft 3 questions about the team, role scope, and success metrics", "estimate"),
    );
  }

  items.push(
    item(
      "behavioral",
      "Prepare 2–3 STAR stories covering conflict, impact, and a recent failure or learning",
      "estimate",
    ),
  );

  if (options.hasGuides) {
    items.push(
      item(
        "vault-guides",
        "Open the matched Interview Vault guides and note rounds, themes, and what is still locked until purchase",
        "firsthand_guide",
      ),
    );
  } else {
    items.push(
      item(
        "vault-browse",
        "Browse Interview Vault for the company or role family if no close guide matched yet",
        "estimate",
      ),
    );
  }

  items.push(
    item(
      "honest-scope",
      "Treat skill gaps and match notes as estimates for practice — not a judgment of your worth or a hiring probability",
      "estimate",
    ),
  );

  return items.slice(0, 12);
}
