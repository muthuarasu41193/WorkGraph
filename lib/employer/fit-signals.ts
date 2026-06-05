/**
 * Score a jobseeker profile against employer-defined fit signals.
 * Distinct from ATS keyword matching — weighted signals with kinds.
 */

import type { FitSignal, FitSnapshot } from "./types";
import type { ProfileMatchInput } from "../job-match";

function skillVariants(skill: string): string[] {
  const base = normalize(skill);
  if (!base) return [];
  const variants = new Set<string>([base]);
  if (base.includes(".")) variants.add(base.replace(/\./g, ""));
  if (base.includes(" ")) {
    variants.add(base.replace(/\s+/g, ""));
    variants.add(base.replace(/\s+/g, "-"));
  }
  return [...variants].filter((v) => v.length >= 2);
}

function normalize(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function textHas(haystack: string, term: string): boolean {
  const h = normalize(haystack);
  const t = normalize(term);
  if (!t || !h) return false;
  if (t.length <= 3) return new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(h);
  return h.includes(t);
}

export function scoreFitSignals(
  fitSignals: FitSignal[],
  profile: ProfileMatchInput & { profileCompleteness?: number },
): FitSnapshot {
  const blob = normalize(
    [profile.headline, profile.summary, ...profile.skills].filter(Boolean).join(" "),
  );
  const matchedSignals: string[] = [];
  let weighted = 0;
  let totalWeight = 0;

  for (const signal of fitSignals) {
    const label = signal.label?.trim();
    if (!label) continue;
    const weight = Math.min(3, Math.max(1, signal.weight ?? 1));
    totalWeight += weight;

    let hit = false;
    if (signal.kind === "skill") {
      for (const variant of skillVariants(label)) {
        if (textHas(blob, variant)) {
          hit = true;
          break;
        }
      }
      if (!hit) {
        for (const skill of profile.skills) {
          if (textHas(label, skill) || textHas(skill, label)) {
            hit = true;
            break;
          }
        }
      }
    } else {
      hit = textHas(blob, label);
    }

    if (hit) {
      weighted += weight;
      matchedSignals.push(label);
    }
  }

  const matchPercent =
    totalWeight === 0
      ? Math.max(55, profile.profileCompleteness ?? 60)
      : Math.round(48 + (weighted / totalWeight) * 50);

  return {
    matchPercent: Math.min(98, matchPercent),
    matchedSignals,
    profileCompleteness: profile.profileCompleteness ?? 0,
    headline: profile.headline ?? null,
  };
}
