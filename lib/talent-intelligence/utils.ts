import { createHash } from "node:crypto";
import { TALENT_INTELLIGENCE_PROMPT_VERSION } from "./types";

export function hashContent(value: string): string {
  return createHash("sha256").update(value.trim()).digest("hex");
}

export function buildCacheKey(resumeHash: string, jobDescriptionHash: string): string {
  return `${resumeHash}:${jobDescriptionHash}:${TALENT_INTELLIGENCE_PROMPT_VERSION}`;
}

export function clampScore(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export function asStringArray(value: unknown, max = 20): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

export function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function truncateText(text: string, max = 24000): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[truncated]`;
}
