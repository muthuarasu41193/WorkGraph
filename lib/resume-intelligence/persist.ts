import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { draftsFromNormalizedResume, embedAndStore } from "@/lib/embeddings";
import { ownerResumeFilePath } from "@/lib/security/resume-access";
import { toStoredResumeIntelligence, type NormalizedResume } from "./schema";

export type ProfilePersistFields = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  headline: string | null;
  summary: string | null;
  years_of_experience: number | null;
  skills: string[];
  education: Array<{ degree: string; institution: string; year: string }>;
  work_experience: Array<{ title: string; company: string; duration: string; description: string }>;
  certifications: string[];
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
};

export function toLegacyProfileFields(resume: NormalizedResume): ProfilePersistFields {
  return {
    full_name: resume.identity.full_name?.value ?? null,
    email: resume.identity.email?.value ?? null,
    phone: resume.identity.phone?.value ?? null,
    location: resume.identity.location?.value ?? null,
    headline: resume.identity.headline?.value ?? resume.target_roles[0]?.value ?? null,
    summary: resume.professional_summary?.value ?? null,
    years_of_experience: resume.years_of_experience?.value ?? null,
    skills: resume.skills.map((s) => s.skill),
    education: resume.education.map((item) => ({
      degree: item.degree,
      institution: item.institution,
      year: item.year,
    })),
    work_experience: resume.experience.map((item) => ({
      title: item.title,
      company: item.company,
      duration: item.duration,
      description: item.description,
    })),
    certifications: resume.certifications.map((item) => item.name),
    linkedin_url: resume.identity.linkedin_url?.value ?? null,
    github_url: resume.identity.github_url?.value ?? null,
    website_url: resume.identity.website_url?.value ?? null,
  };
}

export function hashResumeText(text: string): string {
  return createHash("sha256").update(text.trim()).digest("hex");
}

export async function persistResumeIntelligence(opts: {
  supabase: SupabaseClient;
  userId: string;
  storagePath: string | null;
  sourceText: string;
  resume: NormalizedResume;
}): Promise<void> {
  const contentHash = hashResumeText(opts.sourceText);
  const snapshot = toStoredResumeIntelligence(opts.resume);
  const embedding = opts.resume.embedding;

  const { data: existing } = await opts.supabase
    .from("resume_versions")
    .select("id")
    .eq("user_id", opts.userId)
    .eq("content_hash", contentHash)
    .maybeSingle();

  const withEmbedding = {
    parsed_snapshot: snapshot,
    storage_path: opts.storagePath,
    embedding: embedding?.vector ?? null,
    embedding_model: embedding?.model ?? null,
  };
  const withoutEmbedding = {
    parsed_snapshot: snapshot,
    storage_path: opts.storagePath,
  };

  if (existing?.id) {
    const updated = await opts.supabase
      .from("resume_versions")
      .update(withEmbedding)
      .eq("id", existing.id)
      .eq("user_id", opts.userId);
    if (updated.error) {
      await opts.supabase
        .from("resume_versions")
        .update(withoutEmbedding)
        .eq("id", existing.id)
        .eq("user_id", opts.userId);
    }
  } else {
    const inserted = await opts.supabase.from("resume_versions").insert({
      user_id: opts.userId,
      source: "parse",
      content_hash: contentHash,
      ...withEmbedding,
    });
    if (inserted.error) {
      await opts.supabase.from("resume_versions").insert({
        user_id: opts.userId,
        source: "parse",
        content_hash: contentHash,
        ...withoutEmbedding,
      });
    }
  }

  try {
    await embedAndStore(opts.supabase, draftsFromNormalizedResume(opts.userId, opts.resume));
  } catch {
    // Embeddings are additive; profile/resume parse must still succeed.
  }
}

export function resumeFileUrlForOwner(): string {
  return ownerResumeFilePath();
}
